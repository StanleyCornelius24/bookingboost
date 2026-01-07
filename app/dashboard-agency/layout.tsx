import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { requireUserRole, getImpersonatedUserInfo } from '@/lib/get-user-role'
import ImpersonationBanner from '@/components/admin/ImpersonationBanner'
import AgencyNav from '@/components/admin/AgencyNav'

export default async function AgencyDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createServerClient()

  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  try {
    const { role, hotel } = await requireUserRole()

    // Check if impersonating - if so, skip redirect checks for admin
    const cookieStore = await cookies()
    const isImpersonating = cookieStore.get('impersonate_user_id')?.value

    // Only redirect if NOT impersonating
    if (!isImpersonating) {
      // Redirect non-agency users to their appropriate dashboard
      if (role === 'admin') {
        redirect('/dashboard-admin')
      } else if (role !== 'agency') {
        redirect('/dashboard-client')
      }
    }

    // Agency-specific navigation - technical, data-focused
    const navigation = [
      { name: 'Clients Overview', href: '/dashboard-agency', icon: 'Users' },
      { name: 'Reports', href: '/dashboard-agency/reports', icon: 'FileText' },
      { name: 'Settings', href: '/dashboard-agency/settings', icon: 'Settings' },
    ]

    const handleSignOut = async () => {
      'use server'
      const supabase = await createServerClient()
      await supabase.auth.signOut()
      redirect('/login')
    }

    // Check for impersonation
    const impersonationInfo = await getImpersonatedUserInfo()

    return (
      <div className="min-h-screen bg-gray-50">
        {/* Impersonation Banner */}
        {impersonationInfo && (
          <ImpersonationBanner userEmail={hotel.email} role={impersonationInfo.role} />
        )}

        {/* Agency Navigation */}
        <AgencyNav
          hotel={hotel}
          navigation={navigation}
          onSignOut={handleSignOut}
          impersonationBannerHeight={impersonationInfo ? 40 : 0}
        />

        {/* Main Content - responsive padding */}
        <div className="lg:pl-64" style={impersonationInfo ? { paddingTop: '40px' } : {}}>
          <main className="p-4 sm:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    )
  } catch (error) {
    // Check if impersonating - if there's an error during impersonation, exit it
    const cookieStore = await cookies()
    const isImpersonating = cookieStore.get('impersonate_user_id')?.value

    if (isImpersonating) {
      // Clear impersonation cookies and redirect to admin
      cookieStore.delete('impersonate_user_id')
      cookieStore.delete('impersonate_role')
      redirect('/dashboard-admin')
    }

    // If no hotel exists, redirect to onboard page
    redirect('/onboard')
  }
}
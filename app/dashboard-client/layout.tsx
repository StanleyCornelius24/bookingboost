import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { requireUserRole, getImpersonatedUserInfo } from '@/lib/get-user-role'
import AIChatbot from '@/components/chatbot/AIChatbot'
import ClientNav from '@/components/dashboard/ClientNav'
import ImpersonationBanner from '@/components/admin/ImpersonationBanner'

export default async function ClientDashboardLayout({
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
      // Redirect non-client users to their appropriate dashboard
      if (role === 'admin') {
        redirect('/dashboard-admin')
      } else if (role !== 'client') {
        redirect('/dashboard-agency')
      }
    }

    // Client-specific navigation - performance areas + core functions
    const navigation = [
      { name: 'Booking Performance', href: '/dashboard-client', icon: 'TrendingUp' },
      { name: 'Marketing Performance', href: '/dashboard-client/marketing', icon: 'Target' },
      { name: 'OTA Performance', href: '/dashboard-client/channels', icon: 'LineChart' },
      { name: 'Bookings', href: '/dashboard-client/bookings', icon: 'List' },
      { name: 'Settings', href: '/dashboard-client/settings', icon: 'Settings' },
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
      <div className="min-h-screen bg-off-white">
        {/* Impersonation Banner */}
        {impersonationInfo && (
          <ImpersonationBanner userEmail={hotel.email} role={impersonationInfo.role} />
        )}

        {/* Client Navigation */}
        <ClientNav hotel={hotel} navigation={navigation} onSignOut={handleSignOut} />

        {/* Main Content - responsive padding */}
        <div className="lg:pl-64" style={impersonationInfo ? { paddingTop: '40px' } : {}}>
          <main className="p-4 sm:p-6 lg:p-10">
            {children}
          </main>
        </div>

        {/* AI Chatbot */}
        <AIChatbot />
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
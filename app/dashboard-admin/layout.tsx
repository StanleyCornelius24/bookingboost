import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { requireUserRole } from '@/lib/get-user-role'
import AdminNav from '@/components/admin/AdminNav'

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createServerClient()

  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  // Check if impersonating - if so, redirect to the impersonated user's dashboard
  const cookieStore = await cookies()
  const impersonateUserId = cookieStore.get('impersonate_user_id')?.value
  const impersonateRole = cookieStore.get('impersonate_role')?.value

  if (impersonateUserId && impersonateRole) {
    // Redirect to the impersonated user's dashboard
    if (impersonateRole === 'agency') {
      redirect('/dashboard-agency')
    } else if (impersonateRole === 'client') {
      redirect('/dashboard-client')
    }
  }

  try {
    const { role, hotel } = await requireUserRole()

    // Only allow admin users
    if (role !== 'admin') {
      // Redirect non-admin users to their appropriate dashboard
      if (role === 'agency') {
        redirect('/dashboard-agency')
      } else {
        redirect('/dashboard-client')
      }
    }

    // Admin navigation
    const navigation = [
      { name: 'Dashboard', href: '/dashboard-admin', icon: 'BarChart3' },
      { name: 'Reports', href: '/dashboard-admin/reports', icon: 'FileText' },
      { name: 'Lead Management', href: '/dashboard-admin/lead-management', icon: 'UserCheck' },
      { name: 'All Hotels', href: '/dashboard-admin/hotels', icon: 'Building2' },
      { name: 'All Users', href: '/dashboard-admin/users', icon: 'Users' },
      { name: 'Channels', href: '/dashboard-admin/channels', icon: 'Tags' },
      { name: 'System Settings', href: '/dashboard-admin/settings', icon: 'Settings' },
    ]

    const handleSignOut = async () => {
      'use server'
      const supabase = await createServerClient()
      await supabase.auth.signOut()
      redirect('/login')
    }

    return (
      <div className="min-h-screen bg-gray-50">
        {/* Admin Navigation */}
        <AdminNav navigation={navigation} onSignOut={handleSignOut} />

        {/* Main Content - responsive padding */}
        <div className="lg:pl-64">
          <main className="p-4 sm:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    )
  } catch (error) {
    // Log the error for debugging
    console.error('Admin dashboard layout error:', error)

    // Only redirect to onboard if hotel doesn't exist
    // For other errors, sign out to clear any corrupted session state
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    if (errorMessage.includes('Hotel not found')) {
      redirect('/onboard')
    } else {
      // Clear session and redirect to login for other errors
      const supabase = await createServerClient()
      await supabase.auth.signOut()
      redirect('/login')
    }
  }
}

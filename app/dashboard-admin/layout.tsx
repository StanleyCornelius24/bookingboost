import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  Users,
  Building2,
  Settings,
  BarChart3,
  Shield,
  LogOut
} from 'lucide-react'
import { requireUserRole } from '@/lib/get-user-role'

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
      { name: 'Dashboard', href: '/dashboard-admin', icon: BarChart3 },
      { name: 'All Hotels', href: '/dashboard-admin/hotels', icon: Building2 },
      { name: 'All Users', href: '/dashboard-admin/users', icon: Users },
      { name: 'System Settings', href: '/dashboard-admin/settings', icon: Settings },
    ]

    const handleSignOut = async () => {
      'use server'
      const supabase = await createServerClient()
      await supabase.auth.signOut()
      redirect('/login')
    }

    return (
      <div className="min-h-screen bg-gray-50">
        {/* Admin Sidebar */}
        <div className="fixed inset-y-0 left-0 w-64 bg-gradient-to-b from-gray-900 to-gray-800 border-r border-gray-700">
          <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="flex items-center justify-center h-16 border-b border-gray-700">
              <h1 className="text-2xl font-bold text-white">BookingBoost</h1>
            </div>

            {/* Role Indicator - Admin */}
            <div className="p-4 border-b border-gray-700">
              <div className="flex items-center">
                <Shield className="h-5 w-5 text-red-400 mr-2" />
                <div className="px-3 py-1.5 bg-red-600 text-white rounded-lg font-semibold text-sm">
                  ADMIN
                </div>
              </div>
              <p className="mt-2 text-lg font-semibold text-white">Admin Dashboard</p>
              <p className="text-xs text-gray-400 mt-1">Full system access</p>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center px-4 py-3 text-sm font-medium text-gray-300 rounded-lg hover:bg-gray-700 hover:text-white transition-colors duration-200"
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              ))}
            </nav>

            {/* Sign Out */}
            <div className="p-4 border-t border-gray-700">
              <form action={handleSignOut}>
                <button
                  type="submit"
                  className="flex items-center w-full px-4 py-3 text-sm font-medium text-gray-300 rounded-lg hover:bg-gray-700 hover:text-white transition-colors duration-200"
                >
                  <LogOut className="mr-3 h-5 w-5" />
                  Sign Out
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="pl-64">
          <main className="p-8">
            {children}
          </main>
        </div>
      </div>
    )
  } catch (error) {
    // If no hotel exists, redirect to onboard page
    redirect('/onboard')
  }
}

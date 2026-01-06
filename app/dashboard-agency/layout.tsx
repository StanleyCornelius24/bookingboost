import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'
import Image from 'next/image'
import {
  Users,
  FileText,
  Settings,
  LogOut
} from 'lucide-react'
import { requireUserRole, getImpersonatedUserInfo } from '@/lib/get-user-role'
import ImpersonationBanner from '@/components/admin/ImpersonationBanner'

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
      { name: 'Clients Overview', href: '/dashboard-agency', icon: Users },
      { name: 'Reports', href: '/dashboard-agency/reports', icon: FileText },
      { name: 'Settings', href: '/dashboard-agency/settings', icon: Settings },
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

        {/* Agency Sidebar with enhanced styling */}
        <div className="fixed inset-y-0 left-0 w-64 bg-gradient-to-b from-blue-900 to-blue-800 border-r border-blue-700" style={impersonationInfo ? { top: '40px' } : {}}>
          <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="flex items-center justify-center h-20 px-4 py-3 border-b border-blue-700">
              <Image
                src="/logo.png"
                alt="BookingFocus Logo"
                width={100}
                height={100}
                className="object-contain"
                priority
              />
            </div>

            {/* Role Indicator - Agency Dashboard */}
            <div className="p-4 border-b border-blue-700">
              <div className="flex items-center">
                <div className="px-3 py-1.5 bg-yellow-500 text-yellow-900 rounded-lg font-semibold text-sm">
                  AGENCY
                </div>
              </div>
              <p className="mt-2 text-lg font-semibold text-white">Agency Dashboard</p>
              <p className="text-xs text-blue-300 mt-1">Managing: {hotel?.name}</p>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center px-4 py-3 text-sm font-medium text-blue-100 rounded-lg hover:bg-blue-700 hover:text-white transition-colors duration-200"
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              ))}
            </nav>

            {/* Sign Out */}
            <div className="p-4 border-t border-blue-700">
              <form action={handleSignOut}>
                <button
                  type="submit"
                  className="flex items-center w-full px-4 py-3 text-sm font-medium text-blue-100 rounded-lg hover:bg-blue-700 hover:text-white transition-colors duration-200"
                >
                  <LogOut className="mr-3 h-5 w-5" />
                  Sign Out
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="pl-64" style={impersonationInfo ? { paddingTop: '40px' } : {}}>
          <main className="p-8">
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
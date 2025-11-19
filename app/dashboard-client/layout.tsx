import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard,
  TrendingUp,
  Target,
  LineChart,
  HelpCircle,
  FileText,
  Upload,
  LogOut,
  BarChart3,
  List,
  Settings
} from 'lucide-react'
import { requireUserRole } from '@/lib/get-user-role'
import AIChatbot from '@/components/chatbot/AIChatbot'

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

    // Redirect non-client users to their appropriate dashboard
    if (role === 'admin') {
      redirect('/dashboard-admin')
    } else if (role !== 'client') {
      redirect('/dashboard-agency')
    }

    // Client-specific navigation - friendly, outcome-focused labels
    const navigation = [
      { name: 'Overview', href: '/dashboard-client', icon: LayoutDashboard },
      { name: 'Upload Bookings', href: '/dashboard-client/upload', icon: Upload },
      { name: 'All Bookings', href: '/dashboard-client/bookings', icon: List },
      { name: 'Booking Channels', href: '/dashboard-client/channels', icon: TrendingUp },
      { name: 'Period Comparison', href: '/dashboard-client/analytics', icon: BarChart3 },
      { name: 'Your Marketing', href: '/dashboard-client/marketing', icon: Target },
      { name: 'Your Progress', href: '/dashboard-client/progress', icon: LineChart },
      { name: 'Questions & Answers', href: '/dashboard-client/faq', icon: HelpCircle },
      { name: 'Reports', href: '/dashboard-client/reports', icon: FileText },
      { name: 'Settings', href: '/dashboard-client/settings', icon: Settings },
    ]

    const handleSignOut = async () => {
      'use server'
      const supabase = await createServerClient()
      await supabase.auth.signOut()
      redirect('/login')
    }

    return (
      <div className="min-h-screen bg-off-white">
        {/* Client Sidebar with clean, friendly styling */}
        <div className="fixed inset-y-0 left-0 w-64 bg-card border-r border-border">
          <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="flex items-center justify-center h-16 border-b border-border">
              <h1 className="text-2xl font-bold text-brand-navy">Booking<span className="text-brand-gold">Boost</span></h1>
            </div>

            {/* Role Indicator - Hotel Name */}
            <div className="p-4 border-b border-border bg-brand-gold/5">
              <p className="text-xs text-brand-navy/60 uppercase tracking-wider font-medium mb-1">Your Hotel</p>
              <p className="text-base font-semibold text-brand-navy font-accent">{hotel?.name}</p>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center px-3 py-2.5 text-sm font-light text-brand-navy rounded-lg hover:bg-brand-gold/10 hover:text-brand-navy transition-all duration-200 group"
                >
                  <item.icon className="mr-3 h-4 w-4 text-brand-navy/60 group-hover:text-brand-gold transition-colors" />
                  {item.name}
                </Link>
              ))}
            </nav>

            {/* Sign Out */}
            <div className="p-4 border-t border-border">
              <form action={handleSignOut}>
                <button
                  type="submit"
                  className="flex items-center w-full px-3 py-2.5 text-sm font-light text-brand-navy/70 rounded-lg hover:bg-brand-navy/5 hover:text-brand-navy transition-all duration-200"
                >
                  <LogOut className="mr-3 h-4 w-4" />
                  Sign Out
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="pl-64">
          <main className="p-10">
            {children}
          </main>
        </div>

        {/* AI Chatbot */}
        <AIChatbot />
      </div>
    )
  } catch (error) {
    // If no hotel exists, redirect to onboard page
    redirect('/onboard')
  }
}
import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getUserRole } from '@/lib/get-user-role'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createServerClient()

  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  // Get user role and redirect to appropriate dashboard
  const role = await getUserRole()

  if (!role) {
    redirect('/onboard')
  }

  // Redirect to role-specific dashboard
  if (role === 'admin') {
    redirect('/dashboard-admin')
  } else if (role === 'agency') {
    redirect('/dashboard-agency')
  } else {
    redirect('/dashboard-client')
  }

  // This return should not be reached due to redirects above
  return <div>{children}</div>
}
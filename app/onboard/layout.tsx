import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function OnboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createServerClient()

  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  // Check if user already has a hotel - if so, redirect to dashboard
  const { data: hotel } = await supabase
    .from('hotels')
    .select('id')
    .eq('user_id', session.user.id)
    .single()

  if (hotel) {
    redirect('/')
  }

  return <>{children}</>
}
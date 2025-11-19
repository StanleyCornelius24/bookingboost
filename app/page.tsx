import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'

export default async function HomePage() {
  const supabase = await createServerClient()

  // Check if user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get user's hotel profile
  const { data: hotel, error } = await supabase
    .from('hotels')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  // Log error for debugging
  if (error) {
    console.error('Error fetching hotel profile:', error)
  }

  // If no hotel profile exists, redirect to onboarding
  if (!hotel) {
    console.log('No hotel profile found for user:', user.id)
    redirect('/onboard')
  }

  console.log('User hotel profile:', hotel)

  // Redirect based on user role
  switch (hotel.user_role) {
    case 'admin':
      redirect('/dashboard-admin')
    case 'agency':
      redirect('/dashboard-agency')
    case 'client':
    default:
      redirect('/dashboard-client')
  }
}

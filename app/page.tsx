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

  // Get user's hotels
  const { data: hotels, error } = await supabase
    .from('hotels')
    .select('*')
    .eq('user_id', user.id)
    .order('is_primary', { ascending: false })
    .order('created_at', { ascending: true })

  // Log error for debugging
  if (error) {
    console.error('Error fetching hotel profile:', error)
  }

  // If no hotel profile exists, redirect to onboarding
  if (!hotels || hotels.length === 0) {
    console.log('No hotel profile found for user:', user.id)
    redirect('/onboard')
  }

  // Get the primary hotel or first hotel
  const hotel = hotels[0]
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

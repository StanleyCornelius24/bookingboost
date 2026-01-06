import { createServerClient } from '@/lib/supabase/server'
import HotelManagement from '@/components/admin/HotelManagement'

export default async function AllHotelsPage() {
  const supabase = await createServerClient()

  // Fetch all hotels
  const { data: hotels, error } = await supabase
    .from('hotels')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching hotels:', error)
  }

  return <HotelManagement initialHotels={hotels || []} />
}

import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import HotelManagement from '@/components/admin/HotelManagement'

export default async function AllHotelsPage() {
  const supabase = await createServerClient()
  const adminSupabase = createAdminClient()

  // Fetch all hotels using admin client to bypass RLS
  const { data: hotels, error } = await adminSupabase
    .from('hotels')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching hotels:', error)
  }

  // Fetch SEO audits with PageSpeed data for all hotels using admin client
  const { data: seoAudits } = await adminSupabase
    .from('seo_audits')
    .select('hotel_id, checks')
    .in('hotel_id', hotels?.map(h => h.id) || [])
    .order('timestamp', { ascending: false })

  // Create a map of hotel_id to whether they have PageSpeed data
  const pageSpeedMap = new Map<string, boolean>()

  // Check ALL audits for each hotel - if ANY audit has PageSpeed data, mark the hotel as having it
  seoAudits?.forEach(audit => {
    // Skip if we already found PageSpeed data for this hotel
    if (pageSpeedMap.get(audit.hotel_id)) {
      return
    }

    // Check if this audit has PageSpeed data (mobile or desktop scores)
    const hasPageSpeed = audit.checks?.pageSpeed &&
      (audit.checks.pageSpeed.mobile || audit.checks.pageSpeed.desktop)

    if (hasPageSpeed) {
      pageSpeedMap.set(audit.hotel_id, true)
    }
  })

  // Add PageSpeed flag to hotels
  const hotelsWithPageSpeed = hotels?.map(hotel => ({
    ...hotel,
    hasPageSpeed: pageSpeedMap.get(hotel.id) || false
  }))

  return <HotelManagement initialHotels={hotelsWithPageSpeed || []} />
}

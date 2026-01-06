import { createServerClient } from '@/lib/supabase/server'
import UserManagement from '@/components/admin/UserManagement'

export default async function AllUsersPage() {
  const supabase = await createServerClient()

  // Fetch all users with their hotel information
  const { data: hotels, error } = await supabase
    .from('hotels')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching users:', error)
  }

  // Group hotels by user
  const usersMap = new Map()
  hotels?.forEach(hotel => {
    if (!usersMap.has(hotel.user_id)) {
      usersMap.set(hotel.user_id, {
        id: hotel.user_id,
        email: hotel.email,
        role: hotel.user_role,
        hotels: [hotel],
        created_at: hotel.created_at
      })
    } else {
      usersMap.get(hotel.user_id).hotels.push(hotel)
    }
  })

  const users = Array.from(usersMap.values())

  return <UserManagement initialUsers={users} />
}

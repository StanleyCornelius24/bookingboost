import { createServerClient } from '@/lib/supabase/server'
import { Building2, Users, DollarSign, TrendingUp } from 'lucide-react'

export default async function AdminDashboardPage() {
  const supabase = await createServerClient()

  // Fetch system-wide statistics
  const { data: hotels, count: hotelsCount } = await supabase
    .from('hotels')
    .select('*', { count: 'exact', head: false })

  const { data: bookings } = await supabase
    .from('bookings')
    .select('revenue')

  const totalRevenue = bookings?.reduce((sum, booking) => sum + Number(booking.revenue || 0), 0) || 0

  const stats = [
    {
      name: 'Total Hotels',
      value: hotelsCount || 0,
      icon: Building2,
      color: 'bg-blue-500',
    },
    {
      name: 'Total Users',
      value: hotels?.length || 0,
      icon: Users,
      color: 'bg-green-500',
    },
    {
      name: 'Total Revenue',
      value: `R ${totalRevenue.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: 'bg-yellow-500',
    },
    {
      name: 'Total Bookings',
      value: bookings?.length || 0,
      icon: TrendingUp,
      color: 'bg-purple-500',
    },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="mt-2 text-gray-600">System overview and statistics</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Hotels */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Hotels</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hotel Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {hotels?.slice(0, 10).map((hotel) => (
                <tr key={hotel.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {hotel.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {hotel.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        hotel.user_role === 'admin'
                          ? 'bg-red-100 text-red-800'
                          : hotel.user_role === 'agency'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {hotel.user_role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(hotel.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

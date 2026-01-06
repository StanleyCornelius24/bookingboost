'use client'

import { useState } from 'react'
import { Building2, Users, DollarSign, TrendingUp } from 'lucide-react'

interface Hotel {
  id: string
  name: string
  email: string
  user_role: string
  created_at: string
  bookingCount?: number
  totalRevenue?: number
  directBookingCount?: number
  directRevenue?: number
}

interface Stats {
  totalHotels: number
  totalUsers: number
  totalRevenue: number
  totalBookings: number
}

interface AdminDashboardProps {
  initialHotels: Hotel[]
  initialStats: Stats
  currentMonth: string
}

export default function AdminDashboard({
  initialHotels,
  initialStats,
  currentMonth
}: AdminDashboardProps) {
  const [selectedMonth, setSelectedMonth] = useState(currentMonth)
  const [hotels, setHotels] = useState<Hotel[]>(initialHotels)
  const [stats, setStats] = useState<Stats>(initialStats)
  const [loading, setLoading] = useState(false)

  const handleMonthChange = async (month: string) => {
    setSelectedMonth(month)
    setLoading(true)

    try {
      const response = await fetch(`/api/admin/dashboard-stats?month=${month}`)
      if (!response.ok) throw new Error('Failed to fetch stats')

      const data = await response.json()
      setStats(data.stats)
      setHotels(data.hotels)
    } catch (error) {
      console.error('Error fetching stats:', error)
      alert('Failed to load stats')
    } finally {
      setLoading(false)
    }
  }

  // Generate month options (last 12 months)
  const monthOptions = []
  for (let i = 0; i < 12; i++) {
    const date = new Date()
    date.setMonth(date.getMonth() - i)
    const value = date.toISOString().slice(0, 7) // YYYY-MM format
    const label = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
    monthOptions.push({ value, label })
  }

  const statsCards = [
    {
      name: 'Total Hotels',
      value: stats.totalHotels,
      icon: Building2,
      color: 'bg-blue-500',
    },
    {
      name: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      color: 'bg-green-500',
    },
    {
      name: 'Total Revenue',
      value: `R ${stats.totalRevenue.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: 'bg-yellow-500',
    },
    {
      name: 'Total Bookings',
      value: stats.totalBookings,
      icon: TrendingUp,
      color: 'bg-purple-500',
    },
  ]

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="mt-1 text-sm text-gray-600">System overview and statistics</p>
          </div>
          <div className="flex items-center space-x-3">
            <label htmlFor="month-select" className="text-sm font-medium text-gray-700">
              Period:
            </label>
            <select
              id="month-select"
              value={selectedMonth}
              onChange={(e) => handleMonthChange(e.target.value)}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
            >
              {monthOptions.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statsCards.map((stat) => (
          <div key={stat.name} className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-600 mb-1">{stat.name}</p>
                <p className="text-xl font-bold text-gray-900 truncate">{stat.value}</p>
              </div>
              <div className={`${stat.color} p-2.5 rounded-lg flex-shrink-0 ml-3`}>
                <stat.icon className="h-5 w-5 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Hotels Table with Stats */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-4 py-3 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">Hotels Overview</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hotel Name
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Direct Bookings
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Direct Revenue
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Bookings
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Revenue
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-sm text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : hotels.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-sm text-gray-500">
                    No hotels found
                  </td>
                </tr>
              ) : (
                hotels.map((hotel) => (
                  <tr key={hotel.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                      {hotel.name}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {hotel.email}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
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
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                      {hotel.directBookingCount || 0}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                      R {(hotel.directRevenue || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right font-semibold">
                      {hotel.bookingCount || 0}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right font-bold">
                      R {(hotel.totalRevenue || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {new Date(hotel.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

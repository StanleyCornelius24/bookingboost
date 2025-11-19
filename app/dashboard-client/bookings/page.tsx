'use client'

import { useState, useEffect } from 'react'
import { Calendar, Search } from 'lucide-react'

interface Booking {
  id: string
  booking_date: string
  checkin_date: string | null
  checkout_date: string | null
  channel: string
  guest_name: string | null
  revenue: number
  nights: number | null
  status: string | null
  commission_rate: number
  commission_amount: number
  hotel_id: string
  hotels?: {
    name: string
  }
}

export default function BookingsListPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'booking_date' | 'checkin_date'>('booking_date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [hotelName, setHotelName] = useState<string>('')
  const [totalInDatabase, setTotalInDatabase] = useState<number>(0)

  useEffect(() => {
    fetchBookings()
  }, [])

  const fetchBookings = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/client/bookings/all')
      if (!response.ok) {
        throw new Error('Failed to fetch bookings')
      }

      const data = await response.json()
      setBookings(data.bookings)
      setHotelName(data.hotelName || '')
      setTotalInDatabase(data.totalInDatabase || 0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    try {
      return new Date(dateString).toLocaleDateString('en-ZA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch {
      return dateString
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const filteredAndSortedBookings = bookings
    .filter(booking => {
      if (!searchTerm) return true
      const search = searchTerm.toLowerCase()
      return (
        booking.channel?.toLowerCase().includes(search) ||
        booking.guest_name?.toLowerCase().includes(search) ||
        booking.booking_date?.includes(search) ||
        booking.checkin_date?.includes(search)
      )
    })
    .sort((a, b) => {
      const dateA = sortBy === 'booking_date' ? a.booking_date : (a.checkin_date || '')
      const dateB = sortBy === 'booking_date' ? b.booking_date : (b.checkin_date || '')

      if (sortOrder === 'asc') {
        return dateA.localeCompare(dateB)
      } else {
        return dateB.localeCompare(dateA)
      }
    })

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-96"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">All Bookings</h1>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">All Bookings</h1>
        <p className="text-gray-600 mt-2 text-lg">
          View all uploaded bookings ({bookings.length} loaded{totalInDatabase > 0 && totalInDatabase !== bookings.length ? ` of ${totalInDatabase} total` : ''})
        </p>
        {totalInDatabase > bookings.length && (
          <div className="mt-2 bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-2 rounded-lg">
            Warning: Only showing {bookings.length} of {totalInDatabase} bookings. Some records may not be loading.
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search channel, guest, or date..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'booking_date' | 'checkin_date')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="booking_date">Booking Date</option>
              <option value="checkin_date">Check-in Date</option>
            </select>
          </div>

          {/* Sort Order */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase">
                  Hotel Name
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase">
                  Channel
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase">
                  Booking Date
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase">
                  Check-in Date
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase">
                  Checkout Date
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase">
                  Guest
                </th>
                <th className="px-6 py-4 text-right text-sm font-medium text-gray-500 uppercase">
                  Revenue
                </th>
                <th className="px-6 py-4 text-center text-sm font-medium text-gray-500 uppercase">
                  Nights
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredAndSortedBookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className="font-medium text-gray-900">
                      {hotelName || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`font-medium ${
                      booking.channel?.toLowerCase().includes('direct')
                        ? 'text-green-600'
                        : 'text-blue-600'
                    }`}>
                      {booking.channel}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(booking.booking_date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(booking.checkin_date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(booking.checkout_date)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {booking.guest_name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                    {formatCurrency(booking.revenue)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                    {booking.nights || 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredAndSortedBookings.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No bookings found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? 'Try adjusting your search criteria' : 'Upload bookings to get started'}
            </p>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="text-sm text-gray-600 mb-1">Total Bookings</div>
          <div className="text-2xl font-bold text-gray-900">{filteredAndSortedBookings.length}</div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="text-sm text-gray-600 mb-1">Total Revenue</div>
          <div className="text-2xl font-bold text-gray-900">
            {formatCurrency(filteredAndSortedBookings.reduce((sum, b) => sum + b.revenue, 0))}
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="text-sm text-gray-600 mb-1">Direct Bookings</div>
          <div className="text-2xl font-bold text-green-600">
            {filteredAndSortedBookings.filter(b => b.channel?.toLowerCase().includes('direct') || b.commission_rate === 0).length}
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="text-sm text-gray-600 mb-1">OTA Bookings</div>
          <div className="text-2xl font-bold text-blue-600">
            {filteredAndSortedBookings.filter(b => !b.channel?.toLowerCase().includes('direct') && b.commission_rate > 0).length}
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { Calendar, Search, Upload, Pencil, Trash2, X } from 'lucide-react'
import Link from 'next/link'
import { useApiUrl } from '@/lib/hooks/use-api-url'
import { useSelectedHotelId } from '@/lib/hooks/use-selected-hotel-id'

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
  const buildUrl = useApiUrl()
  const { selectedHotelId, isReady } = useSelectedHotelId()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'booking_date' | 'checkin_date'>('booking_date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [hotelName, setHotelName] = useState<string>('')
  const [totalInDatabase, setTotalInDatabase] = useState<number>(0)
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null)
  const [deletingBookingId, setDeletingBookingId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (isReady) {
      fetchBookings()
    }
  }, [selectedHotelId, isReady])

  const fetchBookings = async () => {
    setLoading(true)
    setError(null)

    try {
      const url = buildUrl('/api/client/bookings/all')
      const response = await fetch(url)
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

  const isDirectBooking = (booking: Booking) => {
    const channel = booking.channel?.toLowerCase() || ''
    return channel.includes('direct') || channel === 'own web site' || booking.commission_rate === 0
  }

  const handleDeleteBooking = async (bookingId: string) => {
    setIsDeleting(true)
    try {
      const url = buildUrl(`/api/client/bookings/${bookingId}`)
      const response = await fetch(url, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete booking')
      }

      // Remove the booking from the local state
      setBookings(bookings.filter(b => b.id !== bookingId))
      setDeletingBookingId(null)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete booking')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleUpdateBooking = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingBooking) return

    setIsSaving(true)
    try {
      const url = buildUrl(`/api/client/bookings/${editingBooking.id}`)
      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          booking_date: editingBooking.booking_date,
          checkin_date: editingBooking.checkin_date,
          checkout_date: editingBooking.checkout_date,
          channel: editingBooking.channel,
          guest_name: editingBooking.guest_name,
          revenue: editingBooking.revenue,
          nights: editingBooking.nights,
          status: editingBooking.status,
          commission_rate: editingBooking.commission_rate,
          commission_amount: editingBooking.commission_amount,
          hotelId: selectedHotelId,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update booking')
      }

      const { booking: updatedBooking } = await response.json()

      // Update the booking in the local state
      setBookings(bookings.map(b => b.id === updatedBooking.id ? updatedBooking : b))
      setEditingBooking(null)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update booking')
    } finally {
      setIsSaving(false)
    }
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
          <div className="h-10 bg-soft-gray rounded-xl w-64 mb-4"></div>
          <div className="h-5 bg-soft-gray rounded-lg w-96"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-brand-navy">All Bookings</h1>
          <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl">
            <p className="font-medium">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold text-brand-navy tracking-tight">All Bookings</h1>
          <p className="text-brand-navy/60 mt-3 text-base font-book">
            View all uploaded bookings ({bookings.length} loaded{totalInDatabase > 0 && totalInDatabase !== bookings.length ? ` of ${totalInDatabase} total` : ''})
          </p>
          {totalInDatabase > bookings.length && (
            <div className="mt-3 bg-sunset-peach/10 border border-sunset-orange/30 text-sunset-orange px-5 py-3 rounded-xl text-sm font-medium">
              Warning: Only showing {bookings.length} of {totalInDatabase} bookings. Some records may not be loading.
            </div>
          )}
        </div>
        <Link
          href="/dashboard-client/upload"
          className="inline-flex items-center px-6 py-3.5 bg-brand-gold text-brand-navy text-sm font-semibold rounded-xl hover:bg-brand-gold/90 hover:shadow-md transition-all shadow-sm whitespace-nowrap"
        >
          <Upload className="h-4 w-4 mr-2" />
          Upload Bookings
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-soft-gray">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4.5 w-4.5 text-brand-navy/40" />
            <input
              type="text"
              placeholder="Search channel, guest, or date..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 border border-soft-gray rounded-xl focus:ring-2 focus:ring-brand-gold/50 focus:border-brand-gold transition-all font-book text-sm"
            />
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-xs font-semibold text-brand-navy/60 uppercase tracking-wider mb-2">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'booking_date' | 'checkin_date')}
              className="w-full px-4 py-3 border border-soft-gray rounded-xl focus:ring-2 focus:ring-brand-gold/50 focus:border-brand-gold transition-all font-book text-sm"
            >
              <option value="booking_date">Booking Date</option>
              <option value="checkin_date">Check-in Date</option>
            </select>
          </div>

          {/* Sort Order */}
          <div>
            <label className="block text-xs font-semibold text-brand-navy/60 uppercase tracking-wider mb-2">Order</label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
              className="w-full px-4 py-3 border border-soft-gray rounded-xl focus:ring-2 focus:ring-brand-gold/50 focus:border-brand-gold transition-all font-book text-sm"
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-xl shadow-sm border border-soft-gray overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-golden-cream/20 border-b border-soft-gray">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-brand-navy/60 uppercase tracking-wider">
                  Hotel Name
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-brand-navy/60 uppercase tracking-wider">
                  Channel
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-brand-navy/60 uppercase tracking-wider">
                  Booking Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-brand-navy/60 uppercase tracking-wider">
                  Check-in Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-brand-navy/60 uppercase tracking-wider">
                  Checkout Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-brand-navy/60 uppercase tracking-wider">
                  Guest
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-brand-navy/60 uppercase tracking-wider">
                  Revenue
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-brand-navy/60 uppercase tracking-wider">
                  Nights
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-brand-navy/60 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-soft-gray">
              {filteredAndSortedBookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-golden-cream/10 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className="font-semibold text-brand-navy">
                      {hotelName || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`font-semibold px-3 py-1.5 rounded-lg ${
                      isDirectBooking(booking)
                        ? 'bg-forest-green/10 text-forest-green'
                        : 'bg-tropical-teal/10 text-tropical-teal'
                    }`}>
                      {booking.channel}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-navy font-book">
                    {formatDate(booking.booking_date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-navy font-book">
                    {formatDate(booking.checkin_date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-navy font-book">
                    {formatDate(booking.checkout_date)}
                  </td>
                  <td className="px-6 py-4 text-sm text-brand-navy font-book">
                    {booking.guest_name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-brand-navy">
                    {formatCurrency(booking.revenue)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium text-brand-navy">
                    {booking.nights || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => setEditingBooking(booking)}
                        className="p-2 text-brand-navy hover:bg-brand-gold/10 rounded-lg transition-colors"
                        title="Edit booking"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeletingBookingId(booking.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete booking"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredAndSortedBookings.length === 0 && (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-navy/5 mb-4">
              <Calendar className="h-8 w-8 text-brand-navy/40" />
            </div>
            <h3 className="text-base font-semibold text-brand-navy">No bookings found</h3>
            <p className="mt-2 text-sm font-book text-brand-navy/60 max-w-md mx-auto">
              {searchTerm ? 'Try adjusting your search criteria to find what you\'re looking for' : 'Upload your booking data to start tracking performance'}
            </p>
            {!searchTerm && bookings.length === 0 && (
              <Link
                href="/dashboard-client/upload"
                className="inline-flex items-center mt-6 px-6 py-3 bg-brand-gold text-brand-navy text-sm font-semibold rounded-xl hover:bg-brand-gold/90 hover:shadow-md transition-all shadow-sm"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Your First Bookings
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-soft-gray hover:shadow-md transition-shadow">
          <div className="text-xs font-semibold text-brand-navy/60 uppercase tracking-wider mb-2">Total Bookings</div>
          <div className="text-3xl font-bold text-brand-navy">{filteredAndSortedBookings.length}</div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-soft-gray hover:shadow-md transition-shadow">
          <div className="text-xs font-semibold text-brand-navy/60 uppercase tracking-wider mb-2">Total Revenue</div>
          <div className="text-3xl font-bold text-brand-navy">
            {formatCurrency(filteredAndSortedBookings.reduce((sum, b) => sum + b.revenue, 0))}
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-soft-gray hover:shadow-md transition-shadow">
          <div className="text-xs font-semibold text-brand-navy/60 uppercase tracking-wider mb-2">Direct Bookings</div>
          <div className="text-3xl font-bold text-forest-green">
            {filteredAndSortedBookings.filter(isDirectBooking).length}
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-soft-gray hover:shadow-md transition-shadow">
          <div className="text-xs font-semibold text-brand-navy/60 uppercase tracking-wider mb-2">OTA Bookings</div>
          <div className="text-3xl font-bold text-tropical-teal">
            {filteredAndSortedBookings.filter(b => !isDirectBooking(b)).length}
          </div>
        </div>
      </div>

      {/* Edit Booking Modal */}
      {editingBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-soft-gray px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-brand-navy">Edit Booking</h2>
              <button
                onClick={() => setEditingBooking(null)}
                className="p-2 hover:bg-soft-gray rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-brand-navy/60" />
              </button>
            </div>

            <form onSubmit={handleUpdateBooking} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-brand-navy mb-2">
                    Booking Date *
                  </label>
                  <input
                    type="date"
                    value={editingBooking.booking_date}
                    onChange={(e) => setEditingBooking({ ...editingBooking, booking_date: e.target.value })}
                    required
                    className="w-full px-4 py-3 border border-soft-gray rounded-xl focus:ring-2 focus:ring-brand-gold/50 focus:border-brand-gold transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-brand-navy mb-2">
                    Channel *
                  </label>
                  <input
                    type="text"
                    value={editingBooking.channel}
                    onChange={(e) => setEditingBooking({ ...editingBooking, channel: e.target.value })}
                    required
                    className="w-full px-4 py-3 border border-soft-gray rounded-xl focus:ring-2 focus:ring-brand-gold/50 focus:border-brand-gold transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-brand-navy mb-2">
                    Check-in Date
                  </label>
                  <input
                    type="date"
                    value={editingBooking.checkin_date || ''}
                    onChange={(e) => setEditingBooking({ ...editingBooking, checkin_date: e.target.value || null })}
                    className="w-full px-4 py-3 border border-soft-gray rounded-xl focus:ring-2 focus:ring-brand-gold/50 focus:border-brand-gold transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-brand-navy mb-2">
                    Checkout Date
                  </label>
                  <input
                    type="date"
                    value={editingBooking.checkout_date || ''}
                    onChange={(e) => setEditingBooking({ ...editingBooking, checkout_date: e.target.value || null })}
                    className="w-full px-4 py-3 border border-soft-gray rounded-xl focus:ring-2 focus:ring-brand-gold/50 focus:border-brand-gold transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-brand-navy mb-2">
                    Guest Name
                  </label>
                  <input
                    type="text"
                    value={editingBooking.guest_name || ''}
                    onChange={(e) => setEditingBooking({ ...editingBooking, guest_name: e.target.value || null })}
                    className="w-full px-4 py-3 border border-soft-gray rounded-xl focus:ring-2 focus:ring-brand-gold/50 focus:border-brand-gold transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-brand-navy mb-2">
                    Revenue *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingBooking.revenue}
                    onChange={(e) => setEditingBooking({ ...editingBooking, revenue: parseFloat(e.target.value) })}
                    required
                    className="w-full px-4 py-3 border border-soft-gray rounded-xl focus:ring-2 focus:ring-brand-gold/50 focus:border-brand-gold transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-brand-navy mb-2">
                    Nights
                  </label>
                  <input
                    type="number"
                    value={editingBooking.nights || ''}
                    onChange={(e) => setEditingBooking({ ...editingBooking, nights: e.target.value ? parseInt(e.target.value) : null })}
                    className="w-full px-4 py-3 border border-soft-gray rounded-xl focus:ring-2 focus:ring-brand-gold/50 focus:border-brand-gold transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-brand-navy mb-2">
                    Status
                  </label>
                  <input
                    type="text"
                    value={editingBooking.status || ''}
                    onChange={(e) => setEditingBooking({ ...editingBooking, status: e.target.value || null })}
                    className="w-full px-4 py-3 border border-soft-gray rounded-xl focus:ring-2 focus:ring-brand-gold/50 focus:border-brand-gold transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-brand-navy mb-2">
                    Commission Rate
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={editingBooking.commission_rate}
                    onChange={(e) => setEditingBooking({ ...editingBooking, commission_rate: parseFloat(e.target.value) })}
                    className="w-full px-4 py-3 border border-soft-gray rounded-xl focus:ring-2 focus:ring-brand-gold/50 focus:border-brand-gold transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-brand-navy mb-2">
                    Commission Amount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingBooking.commission_amount}
                    onChange={(e) => setEditingBooking({ ...editingBooking, commission_amount: parseFloat(e.target.value) })}
                    className="w-full px-4 py-3 border border-soft-gray rounded-xl focus:ring-2 focus:ring-brand-gold/50 focus:border-brand-gold transition-all"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-soft-gray">
                <button
                  type="button"
                  onClick={() => setEditingBooking(null)}
                  className="px-6 py-3 border border-soft-gray text-brand-navy rounded-xl hover:bg-soft-gray/50 transition-all font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-3 bg-brand-gold text-brand-navy rounded-xl hover:bg-brand-gold/90 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingBookingId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mx-auto mb-4">
              <Trash2 className="h-6 w-6 text-red-600" />
            </div>

            <h2 className="text-2xl font-bold text-brand-navy text-center mb-2">
              Delete Booking?
            </h2>

            <p className="text-brand-navy/60 text-center mb-6">
              This action cannot be undone. This booking will be permanently deleted from your records.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setDeletingBookingId(null)}
                disabled={isDeleting}
                className="flex-1 px-6 py-3 border border-soft-gray text-brand-navy rounded-xl hover:bg-soft-gray/50 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteBooking(deletingBookingId)}
                disabled={isDeleting}
                className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

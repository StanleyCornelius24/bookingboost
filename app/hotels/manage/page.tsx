'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Hotel, ArrowLeft, Plus, Star, Trash2 } from 'lucide-react'
import Link from 'next/link'

interface HotelData {
  id: string
  name: string
  email: string
  website: string | null
  currency: string
  is_primary: boolean
  display_order: number
}

export default function ManageHotelsPage() {
  const router = useRouter()
  const [hotels, setHotels] = useState<HotelData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchHotels()
  }, [])

  const fetchHotels = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/hotels')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch hotels')
      }

      setHotels(data.hotels || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (hotelId: string) => {
    try {
      setDeleting(true)
      setError(null)

      const response = await fetch(`/api/hotels?id=${hotelId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete hotel')
      }

      // Refresh hotels list
      await fetchHotels()
      setDeleteConfirm(null)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-off-white via-golden-cream/20 to-sandy-beige/30 p-4">
      <div className="max-w-4xl mx-auto py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/dashboard-client"
            className="p-2 hover:bg-white rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-brand-navy" />
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-brand-navy">Manage Hotels</h1>
            <p className="text-sm text-brand-navy/60 mt-1">
              View and manage all your hotel properties
            </p>
          </div>
          <Link
            href="/hotels/add"
            className="flex items-center gap-2 px-4 py-2 bg-brand-gold text-white rounded-lg hover:bg-brand-gold/90 transition-colors font-semibold"
          >
            <Plus className="h-4 w-4" />
            Add Hotel
          </Link>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-6">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="bg-white rounded-xl shadow-sm border border-soft-gray p-8 text-center">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mx-auto"></div>
            </div>
            <p className="text-sm text-brand-navy/60 mt-2">Loading hotels...</p>
          </div>
        ) : hotels.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-soft-gray p-8 text-center">
            <Hotel className="h-12 w-12 text-brand-navy/40 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-brand-navy mb-2">No Hotels Yet</h3>
            <p className="text-sm text-brand-navy/60 mb-4">
              Get started by adding your first hotel property
            </p>
            <Link
              href="/hotels/add"
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-gold text-white rounded-lg hover:bg-brand-gold/90 transition-colors font-semibold"
            >
              <Plus className="h-4 w-4" />
              Add Your First Hotel
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {hotels.map((hotel) => (
              <div
                key={hotel.id}
                className="bg-white rounded-xl shadow-sm border border-soft-gray p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="p-3 bg-brand-gold/10 rounded-lg">
                      <Hotel className="h-6 w-6 text-brand-navy" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-brand-navy">
                          {hotel.name}
                        </h3>
                        {hotel.is_primary && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-brand-gold/20 text-brand-gold rounded text-xs font-medium">
                            <Star className="h-3 w-3 fill-current" />
                            Primary
                          </span>
                        )}
                      </div>
                      <div className="mt-2 space-y-1">
                        <p className="text-sm text-brand-navy/60">
                          <span className="font-medium">Email:</span> {hotel.email}
                        </p>
                        {hotel.website && (
                          <p className="text-sm text-brand-navy/60">
                            <span className="font-medium">Website:</span>{' '}
                            <a
                              href={hotel.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-tropical-teal hover:underline"
                            >
                              {hotel.website}
                            </a>
                          </p>
                        )}
                        <p className="text-sm text-brand-navy/60">
                          <span className="font-medium">Currency:</span> {hotel.currency}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/dashboard-client/settings?hotel=${hotel.id}`}
                      className="px-4 py-2 text-sm border border-soft-gray text-brand-navy rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      View Settings
                    </Link>
                    {hotels.length > 1 && (
                      <button
                        onClick={() => setDeleteConfirm(hotel.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete hotel"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-brand-navy mb-2">
                Delete Hotel?
              </h3>
              <p className="text-sm text-brand-navy/60 mb-6">
                Are you sure you want to delete this hotel? This action cannot be undone.
                {hotels.find(h => h.id === deleteConfirm)?.is_primary && (
                  <span className="block mt-2 text-orange-600 font-medium">
                    Note: This is your primary hotel. Another hotel will be automatically set as primary.
                  </span>
                )}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  disabled={deleting}
                  className="flex-1 px-4 py-2 border border-soft-gray text-brand-navy rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  disabled={deleting}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 font-semibold"
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="text-sm font-semibold text-blue-900 mb-2">Tip</h4>
          <p className="text-sm text-blue-700">
            Use the hotel selector in the navigation to switch between your properties.
            Your primary hotel is selected by default when you log in.
          </p>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { Building2, Mail, Calendar, Edit2, Trash2, Save, X, BarChart2, TrendingUp, ExternalLink } from 'lucide-react'

interface Hotel {
  id: string
  name: string
  email: string
  user_role: string
  currency: string
  user_id: string
  created_at: string
  website?: string
  booking_engine?: string
  google_analytics_property_id?: string
  google_ads_customer_id?: string
  meta_ad_account_id?: string
}

interface HotelManagementProps {
  initialHotels: Hotel[]
}

export default function HotelManagement({ initialHotels }: HotelManagementProps) {
  const [hotels, setHotels] = useState<Hotel[]>(initialHotels)
  const [editingHotelId, setEditingHotelId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<Hotel>>({})
  const [loading, setLoading] = useState(false)

  const handleEdit = (hotel: Hotel) => {
    setEditingHotelId(hotel.id)
    setEditForm({
      name: hotel.name,
      email: hotel.email,
      currency: hotel.currency,
      booking_engine: hotel.booking_engine || '',
      google_analytics_property_id: hotel.google_analytics_property_id || '',
      google_ads_customer_id: hotel.google_ads_customer_id || '',
      meta_ad_account_id: hotel.meta_ad_account_id || '',
    })
  }

  const handleSave = async (hotelId: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/hotels/${hotelId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      })

      if (!response.ok) throw new Error('Failed to update hotel')

      // Update local state
      setHotels(hotels.map(hotel =>
        hotel.id === hotelId ? { ...hotel, ...editForm } : hotel
      ))

      setEditingHotelId(null)
      alert('Hotel updated successfully')
    } catch (error) {
      console.error('Error updating hotel:', error)
      alert('Failed to update hotel')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (hotelId: string) => {
    if (!confirm('Are you sure you want to delete this hotel? This will remove all associated data.')) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/admin/hotels/${hotelId}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete hotel')

      // Update local state
      setHotels(hotels.filter(hotel => hotel.id !== hotelId))

      alert('Hotel deleted successfully')
    } catch (error) {
      console.error('Error deleting hotel:', error)
      alert('Failed to delete hotel')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Hotel Management</h1>
        <p className="mt-2 text-gray-600">Manage all hotels in the system</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Hotels</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{hotels.length}</p>
            </div>
            <Building2 className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">With Analytics</p>
              <p className="mt-2 text-3xl font-bold text-green-600">
                {hotels.filter(h => h.google_analytics_property_id).length}
              </p>
            </div>
            <Building2 className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">With Ads</p>
              <p className="mt-2 text-3xl font-bold text-purple-600">
                {hotels.filter(h => h.google_ads_customer_id || h.meta_ad_account_id).length}
              </p>
            </div>
            <Building2 className="h-8 w-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Hotels Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hotel
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Booking Engine
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Currency
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {hotels.map((hotel) => (
                <tr key={hotel.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingHotelId === hotel.id ? (
                      <input
                        type="text"
                        value={editForm.name || ''}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        disabled={loading}
                      />
                    ) : (
                      <div className="flex items-center">
                        <Building2 className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            {hotel.website ? (
                              <a
                                href={hotel.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                              >
                                {hotel.name}
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            ) : (
                              <div className="text-sm font-medium text-gray-900">{hotel.name}</div>
                            )}
                            <div className="flex items-center gap-1">
                              {hotel.google_analytics_property_id && (
                                <div className="group relative">
                                  <BarChart2 className="h-4 w-4 text-green-600" />
                                  <span className="absolute hidden group-hover:block bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 text-xs text-white bg-gray-900 rounded whitespace-nowrap">
                                    Google Analytics
                                  </span>
                                </div>
                              )}
                              {hotel.google_ads_customer_id && (
                                <div className="group relative">
                                  <TrendingUp className="h-4 w-4 text-purple-600" />
                                  <span className="absolute hidden group-hover:block bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 text-xs text-white bg-gray-900 rounded whitespace-nowrap">
                                    Google Ads
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-sm text-gray-500">ID: {hotel.id.slice(0, 8)}...</div>
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingHotelId === hotel.id ? (
                      <input
                        type="email"
                        value={editForm.email || ''}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        disabled={loading}
                      />
                    ) : (
                      <div className="flex items-center text-sm text-gray-500">
                        <Mail className="h-4 w-4 mr-2" />
                        {hotel.email}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {editingHotelId === hotel.id ? (
                      <select
                        value={editForm.booking_engine || ''}
                        onChange={(e) => setEditForm({ ...editForm, booking_engine: e.target.value })}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        disabled={loading}
                      >
                        <option value="">Select...</option>
                        <option value="NightsBridge">NightsBridge</option>
                        <option value="Res Request">Res Request</option>
                        <option value="Booking Button">Booking Button</option>
                        <option value="Benson">Benson</option>
                        <option value="Other">Other</option>
                      </select>
                    ) : (
                      hotel.booking_engine || '-'
                    )}
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
                    {editingHotelId === hotel.id ? (
                      <input
                        type="text"
                        value={editForm.currency || ''}
                        onChange={(e) => setEditForm({ ...editForm, currency: e.target.value })}
                        className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                        disabled={loading}
                        maxLength={3}
                      />
                    ) : (
                      hotel.currency || 'ZAR'
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="h-4 w-4 mr-2" />
                      {new Date(hotel.created_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {editingHotelId === hotel.id ? (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleSave(hotel.id)}
                          disabled={loading}
                          className="text-green-600 hover:text-green-900 disabled:opacity-50"
                        >
                          <Save className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setEditingHotelId(null)}
                          disabled={loading}
                          className="text-gray-600 hover:text-gray-900 disabled:opacity-50"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex space-x-3">
                        <button
                          onClick={() => handleEdit(hotel)}
                          disabled={loading}
                          className="text-blue-600 hover:text-blue-900 disabled:opacity-50"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(hotel.id)}
                          disabled={loading}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {hotels.length === 0 && (
            <div className="text-center py-12">
              <Building2 className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hotels found</h3>
              <p className="mt-1 text-sm text-gray-500">No hotels have been registered yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

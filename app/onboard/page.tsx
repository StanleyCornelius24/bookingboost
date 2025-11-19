'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Hotel } from 'lucide-react'

export default function OnboardPage() {
  const [hotelName, setHotelName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/hotels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: hotelName,
          email: email,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create hotel')
      }

      router.push('/')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div className="text-center">
          <Hotel className="mx-auto h-12 w-12 text-blue-600" />
          <h2 className="mt-6 text-3xl font-bold text-gray-900">Welcome to BookingBoost!</h2>
          <p className="mt-2 text-gray-600">Let&apos;s set up your hotel profile to get started.</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="hotelName" className="block text-sm font-medium text-gray-700">
              Hotel Name *
            </label>
            <input
              id="hotelName"
              type="text"
              required
              value={hotelName}
              onChange={(e) => setHotelName(e.target.value)}
              placeholder="Enter your hotel name"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Hotel Email *
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="reservations@yourhotel.com"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Hotel Profile'}
          </button>
        </form>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-900">What&apos;s next?</h3>
          <ul className="mt-2 text-xs text-blue-800 space-y-1">
            <li>• Upload your SiteMinder booking data</li>
            <li>• Connect your marketing accounts (optional)</li>
            <li>• View your revenue analytics dashboard</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
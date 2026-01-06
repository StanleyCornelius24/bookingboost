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
    <div className="min-h-screen bg-gradient-to-br from-off-white via-golden-cream/20 to-sandy-beige/30 flex items-center justify-center p-4">
      <div className="max-w-lg w-full space-y-8 p-10 bg-white rounded-2xl shadow-lg border border-soft-gray">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-gold/20 mb-6">
            <Hotel className="h-8 w-8 text-brand-navy" />
          </div>
          <h2 className="text-4xl font-bold text-brand-navy tracking-tight">Welcome to <span className="font-accent text-brand-gold">BookingFocus</span>!</h2>
          <p className="mt-3 text-brand-navy/60 font-book">Let&apos;s set up your hotel profile to get started.</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="hotelName" className="block text-xs font-semibold text-brand-navy/60 uppercase tracking-wider mb-2">
              Hotel Name *
            </label>
            <input
              id="hotelName"
              type="text"
              required
              value={hotelName}
              onChange={(e) => setHotelName(e.target.value)}
              placeholder="Enter your hotel name"
              className="block w-full px-4 py-3 border border-soft-gray rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-gold/50 focus:border-brand-gold transition-all font-book"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-xs font-semibold text-brand-navy/60 uppercase tracking-wider mb-2">
              Hotel Email *
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="reservations@yourhotel.com"
              className="block w-full px-4 py-3 border border-soft-gray rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-gold/50 focus:border-brand-gold transition-all font-book"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-4 px-6 border border-transparent rounded-xl shadow-sm text-base font-semibold text-brand-navy bg-brand-gold hover:bg-brand-gold/90 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-gold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : 'Create Hotel Profile'}
          </button>
        </form>

        <div className="bg-tropical-aqua/10 border border-tropical-aqua/30 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-brand-navy mb-3">What&apos;s next?</h3>
          <ul className="text-sm text-brand-navy/80 font-book space-y-2">
            <li className="flex items-start">
              <span className="text-tropical-teal mr-2">•</span>
              <span>Upload your SiteMinder booking data</span>
            </li>
            <li className="flex items-start">
              <span className="text-tropical-teal mr-2">•</span>
              <span>Connect your marketing accounts (optional)</span>
            </li>
            <li className="flex items-start">
              <span className="text-tropical-teal mr-2">•</span>
              <span>View your revenue analytics dashboard</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
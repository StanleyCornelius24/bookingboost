'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Hotel, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function AddHotelPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    website: '',
    currency: 'ZAR',
    is_primary: false,
  })

  const updateFormData = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

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
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add hotel')
      }

      // Redirect to dashboard
      router.push('/dashboard-client')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const isValid = formData.name && formData.email

  return (
    <div className="min-h-screen bg-gradient-to-br from-off-white via-golden-cream/20 to-sandy-beige/30 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-8 p-10 bg-white rounded-2xl shadow-lg border border-soft-gray">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard-client"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-brand-navy" />
          </Link>
          <div className="flex-1">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-gold/20 mb-4">
              <Hotel className="h-8 w-8 text-brand-navy" />
            </div>
            <h2 className="text-3xl font-bold text-brand-navy tracking-tight">
              Add a New Hotel
            </h2>
            <p className="mt-2 text-sm text-brand-navy/60">
              Add another property to your BookingFocus account
            </p>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-brand-navy mb-2">
              Hotel Name *
            </label>
            <input
              id="name"
              type="text"
              required
              value={formData.name}
              onChange={(e) => updateFormData('name', e.target.value)}
              className="w-full px-4 py-3 border border-soft-gray rounded-lg focus:ring-2 focus:ring-brand-gold focus:border-transparent"
              placeholder="Enter your hotel name"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-brand-navy mb-2">
              Contact Email *
            </label>
            <input
              id="email"
              type="email"
              required
              value={formData.email}
              onChange={(e) => updateFormData('email', e.target.value)}
              className="w-full px-4 py-3 border border-soft-gray rounded-lg focus:ring-2 focus:ring-brand-gold focus:border-transparent"
              placeholder="hotel@example.com"
            />
          </div>

          <div>
            <label htmlFor="website" className="block text-sm font-medium text-brand-navy mb-2">
              Website
            </label>
            <input
              id="website"
              type="url"
              value={formData.website}
              onChange={(e) => updateFormData('website', e.target.value)}
              className="w-full px-4 py-3 border border-soft-gray rounded-lg focus:ring-2 focus:ring-brand-gold focus:border-transparent"
              placeholder="https://www.yourhotel.com"
            />
          </div>

          <div>
            <label htmlFor="currency" className="block text-sm font-medium text-brand-navy mb-2">
              Currency
            </label>
            <select
              id="currency"
              value={formData.currency}
              onChange={(e) => updateFormData('currency', e.target.value)}
              className="w-full px-4 py-3 border border-soft-gray rounded-lg focus:ring-2 focus:ring-brand-gold focus:border-transparent"
            >
              <option value="ZAR">ZAR (South African Rand)</option>
              <option value="USD">USD (US Dollar)</option>
              <option value="EUR">EUR (Euro)</option>
              <option value="GBP">GBP (British Pound)</option>
            </select>
          </div>

          <div className="flex items-center gap-3 p-4 bg-golden-cream/20 rounded-lg">
            <input
              id="is_primary"
              type="checkbox"
              checked={formData.is_primary}
              onChange={(e) => updateFormData('is_primary', e.target.checked)}
              className="h-4 w-4 text-brand-gold focus:ring-brand-gold border-soft-gray rounded"
            />
            <label htmlFor="is_primary" className="text-sm text-brand-navy">
              Set as primary hotel (this will become your default hotel)
            </label>
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 px-6 py-3 border border-soft-gray text-brand-navy rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isValid || loading}
              className="flex-1 px-6 py-3 bg-brand-gold text-white rounded-lg hover:bg-brand-gold/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              {loading ? 'Adding Hotel...' : 'Add Hotel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

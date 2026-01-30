'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Hotel, Globe, Link as LinkIcon, DollarSign, ArrowRight, ArrowLeft, Check } from 'lucide-react'

interface OnboardingFormData {
  // Step 1: Basic Info
  name: string
  email: string
  website: string
  currency: string

  // Step 2: Integration Setup (optional)
  google_analytics_property_id: string
  google_ads_customer_id: string
  google_ads_manager_id: string
  meta_ad_account_id: string
}

export default function OnboardPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const [formData, setFormData] = useState<OnboardingFormData>({
    name: '',
    email: '',
    website: '',
    currency: 'ZAR',
    google_analytics_property_id: '',
    google_ads_customer_id: '',
    google_ads_manager_id: '',
    meta_ad_account_id: '',
  })

  const updateFormData = (field: keyof OnboardingFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleNext = () => {
    setCurrentStep(prev => Math.min(prev + 1, 3))
  }

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/hotels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          website: formData.website || null,
          currency: formData.currency,
          google_analytics_property_id: formData.google_analytics_property_id || null,
          google_ads_customer_id: formData.google_ads_customer_id || null,
          google_ads_manager_id: formData.google_ads_manager_id || null,
          meta_ad_account_id: formData.meta_ad_account_id || null,
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

  const isStep1Valid = formData.name && formData.email

  return (
    <div className="min-h-screen bg-gradient-to-br from-off-white via-golden-cream/20 to-sandy-beige/30 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-8 p-10 bg-white rounded-2xl shadow-lg border border-soft-gray">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-gold/20 mb-6">
            <Hotel className="h-8 w-8 text-brand-navy" />
          </div>
          <h2 className="text-4xl font-bold text-brand-navy tracking-tight">
            Welcome to <span className="font-accent text-brand-gold">BookingFocus</span>!
          </h2>
          <p className="mt-3 text-brand-navy/60 font-book">Let&apos;s set up your hotel profile to get started.</p>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center space-x-4">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${
                currentStep > step
                  ? 'bg-brand-gold border-brand-gold text-white'
                  : currentStep === step
                  ? 'border-brand-gold text-brand-gold font-semibold'
                  : 'border-soft-gray text-brand-navy/40'
              }`}>
                {currentStep > step ? <Check className="h-5 w-5" /> : step}
              </div>
              {step < 3 && (
                <div className={`w-16 h-0.5 mx-2 ${currentStep > step ? 'bg-brand-gold' : 'bg-soft-gray'}`} />
              )}
            </div>
          ))}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-xl text-sm font-medium">
            {error}
          </div>
        )}

        {/* Step 1: Basic Info */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-brand-navy">Basic Information</h3>

            <div>
              <label htmlFor="name" className="block text-xs font-semibold text-brand-navy/60 uppercase tracking-wider mb-2">
                Hotel Name *
              </label>
              <input
                id="name"
                type="text"
                required
                value={formData.name}
                onChange={(e) => updateFormData('name', e.target.value)}
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
                value={formData.email}
                onChange={(e) => updateFormData('email', e.target.value)}
                placeholder="reservations@yourhotel.com"
                className="block w-full px-4 py-3 border border-soft-gray rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-gold/50 focus:border-brand-gold transition-all font-book"
              />
            </div>

            <div>
              <label htmlFor="website" className="block text-xs font-semibold text-brand-navy/60 uppercase tracking-wider mb-2">
                Website URL
              </label>
              <input
                id="website"
                type="url"
                value={formData.website}
                onChange={(e) => updateFormData('website', e.target.value)}
                placeholder="https://www.yourhotel.com"
                className="block w-full px-4 py-3 border border-soft-gray rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-gold/50 focus:border-brand-gold transition-all font-book"
              />
            </div>

            <div>
              <label htmlFor="currency" className="block text-xs font-semibold text-brand-navy/60 uppercase tracking-wider mb-2">
                Currency
              </label>
              <select
                id="currency"
                value={formData.currency}
                onChange={(e) => updateFormData('currency', e.target.value)}
                className="block w-full px-4 py-3 border border-soft-gray rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-gold/50 focus:border-brand-gold transition-all font-book"
              >
                <option value="ZAR">ZAR (South African Rand)</option>
                <option value="USD">USD (US Dollar)</option>
                <option value="EUR">EUR (Euro)</option>
                <option value="GBP">GBP (British Pound)</option>
                <option value="AUD">AUD (Australian Dollar)</option>
              </select>
            </div>

            <button
              onClick={handleNext}
              disabled={!isStep1Valid}
              className="w-full flex justify-center items-center gap-2 py-4 px-6 border border-transparent rounded-xl shadow-sm text-base font-semibold text-brand-navy bg-brand-gold hover:bg-brand-gold/90 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-gold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Step 2: Integration Setup */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-2xl font-bold text-brand-navy">Integration Setup</h3>
              <p className="text-sm text-brand-navy/60 mt-1">Connect your marketing and analytics accounts (optional - you can do this later)</p>
            </div>

            <div>
              <label htmlFor="google_analytics_property_id" className="block text-xs font-semibold text-brand-navy/60 uppercase tracking-wider mb-2">
                Google Analytics Property ID
              </label>
              <input
                id="google_analytics_property_id"
                type="text"
                value={formData.google_analytics_property_id}
                onChange={(e) => updateFormData('google_analytics_property_id', e.target.value)}
                placeholder="e.g., 123456789"
                className="block w-full px-4 py-3 border border-soft-gray rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-gold/50 focus:border-brand-gold transition-all font-book"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="google_ads_customer_id" className="block text-xs font-semibold text-brand-navy/60 uppercase tracking-wider mb-2">
                  Google Ads Customer ID
                </label>
                <input
                  id="google_ads_customer_id"
                  type="text"
                  value={formData.google_ads_customer_id}
                  onChange={(e) => updateFormData('google_ads_customer_id', e.target.value)}
                  placeholder="e.g., 123-456-7890"
                  className="block w-full px-4 py-3 border border-soft-gray rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-gold/50 focus:border-brand-gold transition-all font-book"
                />
              </div>

              <div>
                <label htmlFor="google_ads_manager_id" className="block text-xs font-semibold text-brand-navy/60 uppercase tracking-wider mb-2">
                  Google Ads Manager ID
                </label>
                <input
                  id="google_ads_manager_id"
                  type="text"
                  value={formData.google_ads_manager_id}
                  onChange={(e) => updateFormData('google_ads_manager_id', e.target.value)}
                  placeholder="e.g., 123-456-7890"
                  className="block w-full px-4 py-3 border border-soft-gray rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-gold/50 focus:border-brand-gold transition-all font-book"
                />
              </div>
            </div>

            <div>
              <label htmlFor="meta_ad_account_id" className="block text-xs font-semibold text-brand-navy/60 uppercase tracking-wider mb-2">
                Meta Ad Account ID
              </label>
              <input
                id="meta_ad_account_id"
                type="text"
                value={formData.meta_ad_account_id}
                onChange={(e) => updateFormData('meta_ad_account_id', e.target.value)}
                placeholder="e.g., act_123456789"
                className="block w-full px-4 py-3 border border-soft-gray rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-gold/50 focus:border-brand-gold transition-all font-book"
              />
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleBack}
                className="flex-1 flex justify-center items-center gap-2 py-4 px-6 border border-soft-gray rounded-xl shadow-sm text-base font-semibold text-brand-navy bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-gold transition-all"
              >
                <ArrowLeft className="h-5 w-5" /> Back
              </button>
              <button
                onClick={handleNext}
                className="flex-1 flex justify-center items-center gap-2 py-4 px-6 border border-transparent rounded-xl shadow-sm text-base font-semibold text-brand-navy bg-brand-gold hover:bg-brand-gold/90 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-gold transition-all"
              >
                Next <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Review & Complete */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-brand-navy">Review & Complete</h3>

            <div className="bg-gray-50 border border-soft-gray rounded-xl p-6 space-y-4">
              <div>
                <h4 className="text-xs font-semibold text-brand-navy/60 uppercase tracking-wider mb-1">Hotel Name</h4>
                <p className="text-brand-navy font-medium">{formData.name}</p>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-brand-navy/60 uppercase tracking-wider mb-1">Email</h4>
                <p className="text-brand-navy font-medium">{formData.email}</p>
              </div>

              {formData.website && (
                <div>
                  <h4 className="text-xs font-semibold text-brand-navy/60 uppercase tracking-wider mb-1">Website</h4>
                  <p className="text-brand-navy font-medium">{formData.website}</p>
                </div>
              )}

              <div>
                <h4 className="text-xs font-semibold text-brand-navy/60 uppercase tracking-wider mb-1">Currency</h4>
                <p className="text-brand-navy font-medium">{formData.currency}</p>
              </div>

              {(formData.google_analytics_property_id || formData.google_ads_customer_id || formData.meta_ad_account_id) && (
                <div>
                  <h4 className="text-xs font-semibold text-brand-navy/60 uppercase tracking-wider mb-2">Connected Integrations</h4>
                  <div className="space-y-1 text-sm">
                    {formData.google_analytics_property_id && (
                      <p className="text-brand-navy/80">• Google Analytics</p>
                    )}
                    {formData.google_ads_customer_id && (
                      <p className="text-brand-navy/80">• Google Ads</p>
                    )}
                    {formData.meta_ad_account_id && (
                      <p className="text-brand-navy/80">• Meta Ads</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-tropical-aqua/10 border border-tropical-aqua/30 rounded-xl p-5">
              <h4 className="text-sm font-semibold text-brand-navy mb-3">What&apos;s next?</h4>
              <ul className="text-sm text-brand-navy/80 font-book space-y-2">
                <li className="flex items-start">
                  <span className="text-tropical-teal mr-2">•</span>
                  <span>Upload your SiteMinder booking data</span>
                </li>
                <li className="flex items-start">
                  <span className="text-tropical-teal mr-2">•</span>
                  <span>View your revenue analytics dashboard</span>
                </li>
                <li className="flex items-start">
                  <span className="text-tropical-teal mr-2">•</span>
                  <span>Connect additional marketing accounts anytime from settings</span>
                </li>
              </ul>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleBack}
                disabled={loading}
                className="flex-1 flex justify-center items-center gap-2 py-4 px-6 border border-soft-gray rounded-xl shadow-sm text-base font-semibold text-brand-navy bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-gold transition-all disabled:opacity-50"
              >
                <ArrowLeft className="h-5 w-5" /> Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 flex justify-center items-center gap-2 py-4 px-6 border border-transparent rounded-xl shadow-sm text-base font-semibold text-brand-navy bg-brand-gold hover:bg-brand-gold/90 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-gold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Complete Setup'} <Check className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
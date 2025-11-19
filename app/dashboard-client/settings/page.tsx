'use client'

import { useState, useEffect } from 'react'
import { Settings, ExternalLink, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

export default function ClientSettingsPage() {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // Form state
  const [gaPropertyId, setGaPropertyId] = useState('')
  const [googleAdsCustomerId, setGoogleAdsCustomerId] = useState('')
  const [googleAdsManagerId, setGoogleAdsManagerId] = useState('')
  const [metaAdAccountId, setMetaAdAccountId] = useState('')

  // Connection status
  const [googleConnected, setGoogleConnected] = useState(false)
  const [metaConnected, setMetaConnected] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/client/settings')
      if (response.ok) {
        const data = await response.json()
        setGaPropertyId(data.google_analytics_property_id || '')
        setGoogleAdsCustomerId(data.google_ads_customer_id || '')
        setGoogleAdsManagerId(data.google_ads_manager_id || '')
        setMetaAdAccountId(data.meta_ad_account_id || '')
        setGoogleConnected(data.google_connected || false)
        setMetaConnected(data.meta_connected || false)
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)

    try {
      const response = await fetch('/api/client/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          google_analytics_property_id: gaPropertyId,
          google_ads_customer_id: googleAdsCustomerId,
          google_ads_manager_id: googleAdsManagerId,
          meta_ad_account_id: metaAdAccountId
        })
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Settings saved successfully!' })
      } else {
        setMessage({ type: 'error', text: 'Failed to save settings' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error saving settings' })
    } finally {
      setSaving(false)
    }
  }

  const handleConnectGoogle = async () => {
    try {
      const response = await fetch('/api/integrations/google/auth')
      const data = await response.json()
      if (data.authUrl) {
        window.location.href = data.authUrl
      }
    } catch (error) {
      console.error('Error connecting Google:', error)
      setMessage({ type: 'error', text: 'Failed to connect Google account' })
    }
  }

  const handleConnectMeta = async () => {
    try {
      const response = await fetch('/api/integrations/meta/auth')
      const data = await response.json()
      if (data.authUrl) {
        window.location.href = data.authUrl
      }
    } catch (error) {
      console.error('Error connecting Meta:', error)
      setMessage({ type: 'error', text: 'Failed to connect Meta account' })
    }
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="animate-pulse">
          <div className="h-8 bg-border rounded-lg w-64 mb-4"></div>
          <div className="h-4 bg-border rounded-lg w-96"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-brand-navy">Marketing Settings</h1>
        <p className="mt-2 text-brand-navy/70 text-base font-light">Configure your marketing integrations and analytics</p>
      </div>

      {/* Success/Error Message */}
      {message && (
        <div className={`p-4 rounded-2xl border ${
          message.type === 'success'
            ? 'bg-brand-gold/10 border-brand-gold/30 text-brand-navy'
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-center">
            {message.type === 'success' ? (
              <CheckCircle className="h-5 w-5 mr-2 text-brand-gold" />
            ) : (
              <XCircle className="h-5 w-5 mr-2" />
            )}
            <span className="text-sm font-light">{message.text}</span>
          </div>
        </div>
      )}

      {/* Google Integration */}
      <div className="bg-card rounded-2xl border border-border">
        <div className="px-6 py-5 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Settings className="h-5 w-5 text-brand-navy/60 mr-3" />
              <h2 className="text-lg font-semibold text-brand-navy">Google Integration</h2>
            </div>
            <div className="flex items-center">
              {googleConnected ? (
                <>
                  <CheckCircle className="h-4 w-4 text-brand-gold mr-2" />
                  <span className="text-xs font-medium text-brand-gold">Connected</span>
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 text-red-500 mr-2" />
                  <span className="text-xs font-medium text-red-600">Not Connected</span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="p-6 space-y-6">
          {!googleConnected && (
            <div className="bg-brand-gold/10 border border-brand-gold/30 p-4 rounded-xl">
              <div className="flex items-start">
                <AlertCircle className="h-4 w-4 text-brand-gold mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-light text-brand-navy">
                    Connect your Google account to enable Google Analytics and Google Ads integration.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div>
            <button
              onClick={handleConnectGoogle}
              className="inline-flex items-center px-5 py-2.5 bg-brand-navy text-white text-sm font-medium rounded-lg hover:bg-brand-navy/90 transition-all"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              {googleConnected ? 'Reconnect Google Account' : 'Connect Google Account'}
            </button>
          </div>

          <div className="border-t border-border pt-6 space-y-5">
            <div>
              <label className="block text-xs font-semibold text-brand-navy/60 uppercase tracking-wider mb-2">
                Google Analytics 4 Property ID
              </label>
              <input
                type="text"
                value={gaPropertyId}
                onChange={(e) => setGaPropertyId(e.target.value)}
                placeholder="e.g., 123456789"
                className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-gold/50 focus:border-brand-gold text-sm font-light text-brand-navy bg-card"
              />
              <p className="mt-1.5 text-xs font-light text-brand-navy/60">
                Find this in Google Analytics under Admin → Property Settings → Property ID
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-navy/60 uppercase tracking-wider mb-2">
                Google Ads Customer ID
              </label>
              <input
                type="text"
                value={googleAdsCustomerId}
                onChange={(e) => setGoogleAdsCustomerId(e.target.value)}
                placeholder="e.g., 123-456-7890"
                className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-gold/50 focus:border-brand-gold text-sm font-light text-brand-navy bg-card"
              />
              <p className="mt-1.5 text-xs font-light text-brand-navy/60">
                Find this at the top of your Google Ads dashboard (10-digit number)
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-navy/60 uppercase tracking-wider mb-2">
                Google Ads Manager ID (Optional)
              </label>
              <input
                type="text"
                value={googleAdsManagerId}
                onChange={(e) => setGoogleAdsManagerId(e.target.value)}
                placeholder="e.g., 123-456-7890"
                className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-gold/50 focus:border-brand-gold text-sm font-light text-brand-navy bg-card"
              />
              <p className="mt-1.5 text-xs font-light text-brand-navy/60">
                Only needed if your account is managed through an MCC (Manager) account
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Meta (Facebook) Integration */}
      <div className="bg-card rounded-2xl border border-border">
        <div className="px-6 py-5 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Settings className="h-5 w-5 text-brand-navy/60 mr-3" />
              <h2 className="text-lg font-semibold text-brand-navy">Meta (Facebook) Integration</h2>
            </div>
            <div className="flex items-center">
              {metaConnected ? (
                <>
                  <CheckCircle className="h-4 w-4 text-brand-gold mr-2" />
                  <span className="text-xs font-medium text-brand-gold">Connected</span>
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 text-red-500 mr-2" />
                  <span className="text-xs font-medium text-red-600">Not Connected</span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="p-6 space-y-6">
          {!metaConnected && (
            <div className="bg-brand-gold/10 border border-brand-gold/30 p-4 rounded-xl">
              <div className="flex items-start">
                <AlertCircle className="h-4 w-4 text-brand-gold mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-light text-brand-navy">
                    Connect your Meta (Facebook) account to enable Facebook and Instagram Ads integration.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div>
            <button
              onClick={handleConnectMeta}
              className="inline-flex items-center px-5 py-2.5 bg-brand-navy text-white text-sm font-medium rounded-lg hover:bg-brand-navy/90 transition-all"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              {metaConnected ? 'Reconnect Meta Account' : 'Connect Meta Account'}
            </button>
          </div>

          <div className="border-t border-border pt-6">
            <div>
              <label className="block text-xs font-semibold text-brand-navy/60 uppercase tracking-wider mb-2">
                Meta Ad Account ID
              </label>
              <input
                type="text"
                value={metaAdAccountId}
                onChange={(e) => setMetaAdAccountId(e.target.value)}
                placeholder="e.g., act_123456789"
                className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-gold/50 focus:border-brand-gold text-sm font-light text-brand-navy bg-card"
              />
              <p className="mt-1.5 text-xs font-light text-brand-navy/60">
                Find this in Meta Business Suite under Ad Accounts (usually starts with "act_")
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-8 py-3 bg-brand-gold text-brand-navy text-sm font-semibold rounded-lg hover:bg-brand-gold/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      {/* Help Section */}
      <div className="bg-card border border-border p-8 rounded-2xl">
        <h3 className="text-base font-semibold text-brand-navy mb-4">Need Help?</h3>
        <div className="space-y-3 text-sm font-light text-brand-navy/80">
          <p>
            <strong className="font-medium text-brand-navy">Google Analytics 4:</strong> Follow our setup guide to create a GA4 property and get your Property ID.
          </p>
          <p>
            <strong className="font-medium text-brand-navy">Google Ads:</strong> Make sure you have an active Google Ads account and know your Customer ID.
          </p>
          <p>
            <strong className="font-medium text-brand-navy">Meta Ads:</strong> You'll need a Facebook Business Manager account with an active Ad Account.
          </p>
        </div>
      </div>
    </div>
  )
}

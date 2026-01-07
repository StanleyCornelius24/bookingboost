'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Settings, ExternalLink, CheckCircle, XCircle, AlertCircle, User, Mail, Lock, DollarSign } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface CommissionRate {
  id: string
  hotel_id: string
  channel_name: string
  commission_rate: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export default function ClientSettingsPage() {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const searchParams = useSearchParams()
  const supabase = createClient()

  // Profile form state
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [profileSaving, setProfileSaving] = useState(false)
  const [emailSaving, setEmailSaving] = useState(false)
  const [passwordSaving, setPasswordSaving] = useState(false)

  // Marketing form state
  const [gaPropertyId, setGaPropertyId] = useState('')
  const [googleAdsCustomerId, setGoogleAdsCustomerId] = useState('')
  const [googleAdsManagerId, setGoogleAdsManagerId] = useState('')
  const [metaAdAccountId, setMetaAdAccountId] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')

  // Connection status
  const [googleConnected, setGoogleConnected] = useState(false)
  const [metaConnected, setMetaConnected] = useState(false)

  // Commission rates state
  const [commissionRates, setCommissionRates] = useState<CommissionRate[]>([])
  const [commissionSaving, setCommissionSaving] = useState(false)

  useEffect(() => {
    fetchSettings()
    fetchUserProfile()
    fetchCommissionRates()

    // Handle OAuth callback messages
    const success = searchParams.get('success')
    const error = searchParams.get('error')

    if (success === 'google_connected') {
      setMessage({ type: 'success', text: 'Google account connected successfully!' })
      // Remove query params from URL
      window.history.replaceState({}, '', '/dashboard-client/settings')
      // Refresh settings to show new connection status
      fetchSettings()
    } else if (success === 'meta_connected') {
      setMessage({ type: 'success', text: 'Meta account connected successfully!' })
      // Remove query params from URL
      window.history.replaceState({}, '', '/dashboard-client/settings')
      // Refresh settings to show new connection status
      fetchSettings()
    } else if (error) {
      const errorMessages: Record<string, string> = {
        google_auth_cancelled: 'Google authentication was cancelled',
        meta_auth_cancelled: 'Meta authentication was cancelled',
        missing_auth_code: 'Authentication failed - missing authorization code',
        database_error: 'Failed to save connection',
        google_auth_failed: 'Google authentication failed',
        meta_auth_failed: 'Meta authentication failed'
      }
      setMessage({
        type: 'error',
        text: errorMessages[error] || 'An error occurred during authentication'
      })
      // Remove query params from URL
      window.history.replaceState({}, '', '/dashboard-client/settings')
    }
  }, [])

  const fetchUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setEmail(user.email || '')
        setFullName(user.user_metadata?.full_name || '')
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
    }
  }

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
        setWebsiteUrl(data.website || '')
        setGoogleConnected(data.google_connected || false)
        setMetaConnected(data.meta_connected || false)
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCommissionRates = async () => {
    try {
      const response = await fetch('/api/client/commission-rates')
      if (response.ok) {
        const data = await response.json()
        setCommissionRates(data)
      }
    } catch (error) {
      console.error('Error fetching commission rates:', error)
    }
  }

  const handleUpdateCommissionRates = async () => {
    setCommissionSaving(true)
    setMessage(null)

    try {
      const response = await fetch('/api/client/commission-rates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rates: commissionRates })
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Commission rates updated successfully!' })
      } else {
        setMessage({ type: 'error', text: 'Failed to update commission rates' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error updating commission rates' })
    } finally {
      setCommissionSaving(false)
    }
  }

  const updateCommissionRate = (channelName: string, rate: number) => {
    setCommissionRates(prev =>
      prev.map(r =>
        r.channel_name === channelName
          ? { ...r, commission_rate: rate / 100 } // Convert percentage to decimal
          : r
      )
    )
  }

  const toggleChannelActive = (channelName: string) => {
    setCommissionRates(prev =>
      prev.map(r =>
        r.channel_name === channelName
          ? { ...r, is_active: !r.is_active }
          : r
      )
    )
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfileSaving(true)
    setMessage(null)

    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: fullName }
      })

      if (error) throw error

      setMessage({ type: 'success', text: 'Profile updated successfully!' })
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to update profile' })
    } finally {
      setProfileSaving(false)
    }
  }

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setEmailSaving(true)
    setMessage(null)

    if (!newEmail || newEmail === email) {
      setMessage({ type: 'error', text: 'Please enter a new email address' })
      setEmailSaving(false)
      return
    }

    try {
      // Update auth user email
      const { error: authError } = await supabase.auth.updateUser({ email: newEmail })
      if (authError) throw authError

      // Update hotel email in the hotels table
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { error: hotelError } = await supabase
          .from('hotels')
          .update({ email: newEmail })
          .eq('user_id', user.id)

        if (hotelError) {
          console.error('Failed to update hotel email:', hotelError)
          // Don't throw here, auth email is already updated
        }
      }

      setMessage({
        type: 'success',
        text: 'Email update initiated. Please check your new email for a confirmation link.'
      })
      setNewEmail('')
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to update email' })
    } finally {
      setEmailSaving(false)
    }
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordSaving(true)
    setMessage(null)

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' })
      setPasswordSaving(false)
      return
    }

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters long' })
      setPasswordSaving(false)
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })

      if (error) throw error

      setMessage({ type: 'success', text: 'Password updated successfully!' })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to update password' })
    } finally {
      setPasswordSaving(false)
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
          meta_ad_account_id: metaAdAccountId,
          website: websiteUrl
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
      setLoading(true)
      setMessage(null)

      const response = await fetch('/api/integrations/google/auth')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to initiate Google authentication')
      }

      if (data.authUrl) {
        window.location.href = data.authUrl
      } else {
        throw new Error('No authentication URL received')
      }
    } catch (error) {
      console.error('Error connecting Google:', error)
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to connect Google account'
      })
      setLoading(false)
    }
  }

  const handleConnectMeta = async () => {
    try {
      setLoading(true)
      setMessage(null)

      const response = await fetch('/api/integrations/meta/auth')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to initiate Meta authentication')
      }

      if (data.authUrl) {
        window.location.href = data.authUrl
      } else {
        throw new Error('No authentication URL received')
      }
    } catch (error) {
      console.error('Error connecting Meta:', error)
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to connect Meta account'
      })
      setLoading(false)
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
        <h1 className="text-3xl font-bold text-brand-navy">Settings</h1>
        <p className="mt-2 text-brand-navy/70 text-sm font-light">Manage your profile and integrations</p>
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

      {/* Profile Settings Section */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-brand-navy">Profile Settings</h2>

        {/* Profile Information */}
        <div className="bg-card rounded-2xl border border-border">
          <div className="px-6 py-5 border-b border-border">
            <div className="flex items-center">
              <User className="h-5 w-5 text-brand-navy/60 mr-3" />
              <h3 className="text-lg font-semibold text-brand-navy">Profile Information</h3>
            </div>
          </div>
          <form onSubmit={handleUpdateProfile} className="p-6 space-y-5">
            <div>
              <label className="block text-xs font-semibold text-brand-navy/60 uppercase tracking-wider mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-gold/50 focus:border-brand-gold text-sm font-light text-brand-navy bg-card"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={profileSaving}
                className="px-6 py-2.5 bg-brand-gold text-brand-navy text-sm font-semibold rounded-lg hover:bg-brand-gold/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {profileSaving ? 'Saving...' : 'Update Profile'}
              </button>
            </div>
          </form>
        </div>

        {/* Email Settings */}
        <div className="bg-card rounded-2xl border border-border">
          <div className="px-6 py-5 border-b border-border">
            <div className="flex items-center">
              <Mail className="h-5 w-5 text-brand-navy/60 mr-3" />
              <h3 className="text-lg font-semibold text-brand-navy">Email Settings</h3>
            </div>
          </div>
          <form onSubmit={handleUpdateEmail} className="p-6 space-y-5">
            <div>
              <label className="block text-xs font-semibold text-brand-navy/60 uppercase tracking-wider mb-2">
                Current Email
              </label>
              <input
                type="email"
                value={email}
                disabled
                className="w-full px-4 py-2.5 border border-border rounded-lg text-sm font-light text-brand-navy/60 bg-gray-50 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-brand-navy/60 uppercase tracking-wider mb-2">
                New Email Address
              </label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="Enter new email address"
                className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-gold/50 focus:border-brand-gold text-sm font-light text-brand-navy bg-card"
              />
              <p className="mt-1.5 text-xs font-light text-brand-navy/60">
                You will receive a confirmation link at your new email address
              </p>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={emailSaving}
                className="px-6 py-2.5 bg-brand-gold text-brand-navy text-sm font-semibold rounded-lg hover:bg-brand-gold/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {emailSaving ? 'Updating...' : 'Update Email'}
              </button>
            </div>
          </form>
        </div>

        {/* Password Settings */}
        <div className="bg-card rounded-2xl border border-border">
          <div className="px-6 py-5 border-b border-border">
            <div className="flex items-center">
              <Lock className="h-5 w-5 text-brand-navy/60 mr-3" />
              <h3 className="text-lg font-semibold text-brand-navy">Password Settings</h3>
            </div>
          </div>
          <form onSubmit={handleUpdatePassword} className="p-6 space-y-5">
            <div>
              <label className="block text-xs font-semibold text-brand-navy/60 uppercase tracking-wider mb-2">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                minLength={6}
                className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-gold/50 focus:border-brand-gold text-sm font-light text-brand-navy bg-card"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-brand-navy/60 uppercase tracking-wider mb-2">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                minLength={6}
                className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-gold/50 focus:border-brand-gold text-sm font-light text-brand-navy bg-card"
              />
              <p className="mt-1.5 text-xs font-light text-brand-navy/60">
                Password must be at least 6 characters long
              </p>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={passwordSaving}
                className="px-6 py-2.5 bg-brand-gold text-brand-navy text-sm font-semibold rounded-lg hover:bg-brand-gold/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {passwordSaving ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Channel Commission Settings Section */}
      <div className="space-y-6 pt-6 border-t border-border">
        <h2 className="text-xl font-semibold text-brand-navy">Channel Commission Settings</h2>

        <div className="bg-card rounded-2xl border border-border">
          <div className="px-6 py-5 border-b border-border">
            <div className="flex items-center">
              <DollarSign className="h-5 w-5 text-brand-navy/60 mr-3" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-brand-navy">Booking Channel Commission Rates</h3>
                <p className="text-xs font-light text-brand-navy/60 mt-1">
                  Customize commission rates for each booking channel. These rates are used to calculate your revenue metrics and savings.
                </p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="bg-tropical-aqua/10 border border-tropical-aqua/30 p-4 rounded-xl mb-6">
              <div className="flex items-start">
                <AlertCircle className="h-4 w-4 text-tropical-teal mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-light text-brand-navy">
                    Below are all available booking channels. You can customize the commission rate for channels you use, or keep the industry-standard defaults. Inactive channels won't affect your calculations but are shown so you're aware of other available options.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {commissionRates.map((rate) => (
                <div
                  key={rate.id}
                  className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                    rate.is_active
                      ? 'border-brand-gold/30 bg-brand-gold/5'
                      : 'border-border bg-gray-50'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleChannelActive(rate.channel_name)}
                    className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                      rate.is_active
                        ? 'bg-brand-gold border-brand-gold'
                        : 'bg-white border-border'
                    }`}
                  >
                    {rate.is_active && (
                      <CheckCircle className="h-3 w-3 text-brand-navy" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold ${
                      rate.is_active ? 'text-brand-navy' : 'text-brand-navy/40'
                    }`}>
                      {rate.channel_name}
                    </p>
                    {rate.channel_name === 'Direct Booking' && (
                      <p className="text-xs font-light text-brand-gold mt-0.5">
                        Recommended channel - zero commission
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={(rate.commission_rate * 100).toFixed(2)}
                      onChange={(e) => updateCommissionRate(rate.channel_name, parseFloat(e.target.value) || 0)}
                      disabled={!rate.is_active}
                      className={`w-20 px-3 py-2 border rounded-lg text-sm text-right font-medium focus:outline-none focus:ring-2 focus:ring-brand-gold/50 focus:border-brand-gold ${
                        rate.is_active
                          ? 'bg-white border-border text-brand-navy'
                          : 'bg-gray-100 border-border text-brand-navy/40 cursor-not-allowed'
                      }`}
                    />
                    <span className={`text-sm font-medium ${
                      rate.is_active ? 'text-brand-navy' : 'text-brand-navy/40'
                    }`}>
                      %
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={handleUpdateCommissionRates}
                disabled={commissionSaving}
                className="px-8 py-3 bg-brand-gold text-brand-navy text-sm font-semibold rounded-lg hover:bg-brand-gold/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {commissionSaving ? 'Saving...' : 'Save Commission Rates'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Marketing Settings Section */}
      <div className="space-y-6 pt-6 border-t border-border">
        <h2 className="text-xl font-semibold text-brand-navy">Marketing Settings</h2>

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
              disabled={loading}
              className="inline-flex items-center px-5 py-2.5 bg-brand-navy text-white text-sm font-medium rounded-lg hover:bg-brand-navy/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              {loading ? 'Connecting...' : googleConnected ? 'Reconnect Google Account' : 'Connect Google Account'}
            </button>
          </div>

          <div className="border-t border-border pt-6 space-y-5">
            <div>
              <label className="block text-xs font-semibold text-brand-navy/60 uppercase tracking-wider mb-2">
                Website URL
              </label>
              <input
                type="url"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="e.g., https://yourhotel.com"
                className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-gold/50 focus:border-brand-gold text-sm font-light text-brand-navy bg-card"
              />
              <p className="mt-1.5 text-xs font-light text-brand-navy/60">
                Your hotel's website URL (required for SEO audits)
              </p>
            </div>

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
              disabled={loading}
              className="inline-flex items-center px-5 py-2.5 bg-brand-navy text-white text-sm font-medium rounded-lg hover:bg-brand-navy/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              {loading ? 'Connecting...' : metaConnected ? 'Reconnect Meta Account' : 'Connect Meta Account'}
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
    </div>
  )
}

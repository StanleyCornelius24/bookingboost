'use client'

import { useState, useEffect } from 'react'
import { Target, DollarSign, MousePointerClick, Eye, Info, X } from 'lucide-react'

interface GoogleAdsData {
  totalSpend: number
  totalClicks: number
  totalImpressions: number
  totalConversions: number
  currency: string
  hasData: boolean
}

interface KeywordData {
  keyword: string
  impressions: number
  clicks: number
  conversions: number
  cost: number
}

interface ConversionEvent {
  eventName: string
  conversions: number
  eventCount: number
}

interface ConversionsData {
  conversions: ConversionEvent[]
  total: number
}

export default function GoogleAdsPage() {
  const [loading, setLoading] = useState(true)
  const [googleAdsData, setGoogleAdsData] = useState<GoogleAdsData | null>(null)
  const [keywordsData, setKeywordsData] = useState<KeywordData[]>([])
  const [conversionsData, setConversionsData] = useState<ConversionsData | null>(null)

  useEffect(() => {
    fetchGoogleAdsData()
    fetchKeywordsData()
    fetchConversionsData()
  }, [])

  const fetchGoogleAdsData = async () => {
    setLoading(true)

    try {
      // Calculate dates for last 30 days
      const endDate = new Date().toISOString().split('T')[0]
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

      const response = await fetch(`/api/integrations/google/ads?startDate=${startDate}&endDate=${endDate}`)
      if (response.ok) {
        const adsData = await response.json()

        setGoogleAdsData({
          totalSpend: adsData.summary?.totalSpend || 0,
          totalClicks: adsData.summary?.totalClicks || 0,
          totalImpressions: adsData.summary?.totalImpressions || 0,
          totalConversions: adsData.summary?.totalConversions || 0,
          currency: adsData.currency || 'ZAR',
          hasData: adsData.summary && (adsData.summary.totalSpend > 0 || adsData.summary.totalClicks > 0)
        })
      } else {
        setGoogleAdsData({ totalSpend: 0, totalClicks: 0, totalImpressions: 0, totalConversions: 0, currency: 'ZAR', hasData: false })
      }
    } catch (err) {
      console.error('Failed to fetch Google Ads data:', err)
      setGoogleAdsData({ totalSpend: 0, totalClicks: 0, totalImpressions: 0, totalConversions: 0, currency: 'ZAR', hasData: false })
    } finally {
      setLoading(false)
    }
  }

  const fetchKeywordsData = async () => {
    try {
      const endDate = new Date().toISOString().split('T')[0]
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

      const response = await fetch(`/api/integrations/google/ads/keywords?startDate=${startDate}&endDate=${endDate}`)
      if (response.ok) {
        const data = await response.json()
        setKeywordsData(data.keywords || [])
      } else {
        setKeywordsData([])
      }
    } catch (err) {
      console.error('Failed to fetch keywords data:', err)
      setKeywordsData([])
    }
  }

  const fetchConversionsData = async () => {
    try {
      const response = await fetch('/api/integrations/google/analytics/conversions?startDate=30daysAgo&endDate=today')
      if (response.ok) {
        const data = await response.json()
        setConversionsData(data)
      } else {
        setConversionsData({ conversions: [], total: 0 })
      }
    } catch (err) {
      console.error('Failed to fetch conversions data:', err)
      setConversionsData({ conversions: [], total: 0 })
    }
  }

  const formatCurrency = (amount: number, currency: string = 'ZAR') => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-ZA').format(value)
  }

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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-brand-navy mb-2">Google Ads</h1>
        <p className="text-brand-navy/70 mt-2 text-base font-light">
          Deep dive into your Google Ads campaign performance
        </p>
      </div>

      {/* Google Ads Performance Score Cards */}
      {googleAdsData && googleAdsData.hasData && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-xl border border-soft-gray hover:shadow-md transition-all shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-brand-navy/60">Ad Spend</span>
                <DollarSign className="h-4 w-4 text-brand-gold" />
              </div>
              <div className="text-2xl font-bold text-brand-navy">
                {formatCurrency(googleAdsData.totalSpend, googleAdsData.currency)}
              </div>
              <p className="text-xs text-brand-navy/60 mt-1">Total advertising cost</p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-soft-gray hover:shadow-md transition-all shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-brand-navy/60">Impressions</span>
                <Eye className="h-4 w-4 text-brand-gold" />
              </div>
              <div className="text-2xl font-bold text-brand-navy">
                {formatNumber(googleAdsData.totalImpressions)}
              </div>
              <p className="text-xs text-brand-navy/60 mt-1">Times ads were shown</p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-soft-gray hover:shadow-md transition-all shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-brand-navy/60">Clicks</span>
                <MousePointerClick className="h-4 w-4 text-brand-gold" />
              </div>
              <div className="text-2xl font-bold text-brand-navy">
                {formatNumber(googleAdsData.totalClicks)}
              </div>
              <p className="text-xs text-brand-navy/60 mt-1">Ad clicks received</p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-soft-gray hover:shadow-md transition-all shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-brand-navy/60">Conversions</span>
                <Target className="h-4 w-4 text-brand-gold" />
              </div>
              <ConversionTooltip conversionsData={conversionsData}>
                <div className="text-2xl font-bold text-brand-navy">
                  {formatNumber(googleAdsData.totalConversions)}
                </div>
              </ConversionTooltip>
              <p className="text-xs text-brand-navy/60 mt-1">Goals completed</p>
            </div>
          </div>

          {/* Top 10 Keywords Table */}
          {keywordsData.length > 0 && (
            <div className="bg-white rounded-xl border border-soft-gray overflow-hidden shadow-sm">
              <div className="px-6 py-5 border-b border-soft-gray">
                <h3 className="text-lg font-bold text-brand-navy">Top Keywords by Clicks</h3>
                <p className="text-sm text-brand-navy/60 mt-1">Best performing keywords (Last 30 Days)</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-golden-cream/20 border-b border-soft-gray">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-brand-navy/60 uppercase tracking-wider">
                        Keyword
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-brand-navy/60 uppercase tracking-wider">
                        Impressions
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-brand-navy/60 uppercase tracking-wider">
                        Clicks
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-brand-navy/60 uppercase tracking-wider">
                        Conversions
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-brand-navy/60 uppercase tracking-wider">
                        Cost
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-soft-gray">
                    {keywordsData.map((keyword, index) => (
                      <tr key={index} className="hover:bg-golden-cream/10 transition-colors">
                        <td className="px-6 py-4">
                          <span className="text-sm font-semibold text-brand-navy">
                            {keyword.keyword}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <span className="text-sm font-book text-brand-navy">
                            {formatNumber(keyword.impressions)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <span className="text-sm font-semibold text-brand-gold">
                            {formatNumber(keyword.clicks)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <span className="text-sm font-semibold text-forest-green">
                            {formatNumber(keyword.conversions)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <span className="text-sm font-book text-brand-navy">
                            {formatCurrency(keyword.cost, googleAdsData.currency)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* No Data State */}
      {googleAdsData && !googleAdsData.hasData && (
        <div className="bg-white border border-soft-gray p-12 rounded-xl text-center shadow-sm">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-brand-gold/20 mb-6">
            <Target className="h-10 w-10 text-brand-gold" />
          </div>
          <h3 className="text-2xl font-bold text-brand-navy mb-3">No Google Ads Data</h3>
          <p className="text-brand-navy/60 text-base font-book mb-6 max-w-2xl mx-auto leading-relaxed">
            Connect your Google Ads account to start tracking your campaign performance.
          </p>
        </div>
      )}
    </div>
  )
}

// Conversion Tooltip Component
interface ConversionTooltipProps {
  conversionsData: ConversionsData | null
  children: React.ReactNode
}

function ConversionTooltip({ conversionsData, children }: ConversionTooltipProps) {
  const [showPopup, setShowPopup] = useState(false)

  if (!conversionsData || conversionsData.conversions.length === 0) {
    return <>{children}</>
  }

  return (
    <>
      <div className="flex items-center gap-2">
        {children}
        <button
          onClick={() => setShowPopup(true)}
          className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-tropical-aqua/20 hover:bg-tropical-aqua/30 transition-colors"
          aria-label="View conversion details"
        >
          <Info className="h-3.5 w-3.5 text-tropical-teal" />
        </button>
      </div>

      {/* Modal Overlay */}
      {showPopup && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => setShowPopup(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-soft-gray">
                <div>
                  <h3 className="text-lg font-bold text-brand-navy">Conversion Events</h3>
                  <p className="text-sm text-brand-navy/60 mt-1">Last 30 Days</p>
                </div>
                <button
                  onClick={() => setShowPopup(false)}
                  className="p-2 rounded-lg hover:bg-soft-gray/50 transition-colors"
                  aria-label="Close"
                >
                  <X className="h-5 w-5 text-brand-navy" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-2">
                  {conversionsData.conversions.map((conversion, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between py-3 px-4 bg-off-white/50 rounded-xl hover:bg-brand-gold/10 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-brand-navy truncate">
                          {conversion.eventName}
                        </p>
                        <p className="text-xs text-brand-navy/50 mt-0.5">
                          {conversion.eventCount.toLocaleString()} total events
                        </p>
                      </div>
                      <div className="text-lg font-bold text-brand-gold ml-4">
                        {conversion.conversions.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-soft-gray bg-golden-cream/20">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold uppercase tracking-wider text-brand-navy/60">
                    Total Conversions
                  </span>
                  <span className="text-2xl font-bold text-brand-navy">
                    {conversionsData.total.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}

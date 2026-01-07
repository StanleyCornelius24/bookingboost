'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, TrendingUp, DollarSign, MousePointerClick, Target, Users, Eye, Activity, Info, X, Search } from 'lucide-react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { MarketingAnalysisData } from '@/lib/marketing-analysis-types'

interface GA4Data {
  totalSessions: number
  totalUsers: number
  totalPageviews: number
  totalEngagedSessions: number
  engagementRate: number
  trafficSources?: Array<{
    source: string
    sessions: number
    users: number
    conversions: number
    revenue: number
    cost: number
  }>
  devices?: Array<{
    device: string
    sessions: number
    users: number
  }>
  topCountries?: Array<{
    country: string
    sessions: number
    users: number
    conversions: number
    revenue: number
  }>
  hasData: boolean
}

interface GoogleAdsData {
  totalSpend: number
  totalClicks: number
  totalImpressions: number
  totalConversions: number
  currency: string
  hasData: boolean
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

export default function ClientMarketingPage() {
  const router = useRouter()
  const [data, setData] = useState<MarketingAnalysisData | null>(null)
  const [ga4Data, setGa4Data] = useState<GA4Data | null>(null)
  const [googleAdsData, setGoogleAdsData] = useState<GoogleAdsData | null>(null)
  const [conversionsData, setConversionsData] = useState<ConversionsData | null>(null)
  const [attributionModel, setAttributionModel] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [ga4Loading, setGa4Loading] = useState(true)
  const [adsLoading, setAdsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [ga4Error, setGa4Error] = useState<string | null>(null)
  const [adsError, setAdsError] = useState<string | null>(null)
  const [lastSync, setLastSync] = useState<string | null>(null)

  useEffect(() => {
    fetchMarketingData()
    fetchGA4Data()
    fetchGoogleAdsData()
    fetchConversionsData()
    fetchAttributionModel()
  }, [])

  const fetchMarketingData = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/client/marketing')
      if (!response.ok) {
        throw new Error('Failed to fetch marketing data')
      }

      const marketingData = await response.json()
      setData(marketingData)

      // Fetch last sync time
      const settingsResponse = await fetch('/api/client/settings')
      if (settingsResponse.ok) {
        const settings = await settingsResponse.json()
        setLastSync(settings.last_marketing_sync)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const fetchGA4Data = async () => {
    setGa4Loading(true)
    setGa4Error(null)

    try {
      const response = await fetch('/api/integrations/google/analytics?startDate=30daysAgo&endDate=today')
      if (response.ok) {
        const analyticsData = await response.json()

        // Calculate totals from the overview data
        const totals = analyticsData.overview?.reduce((acc: any, day: any) => ({
          totalSessions: acc.totalSessions + day.sessions,
          totalUsers: acc.totalUsers + day.users,
          totalPageviews: acc.totalPageviews + day.pageviews,
          totalEngagedSessions: acc.totalEngagedSessions + (day.engagedSessions || 0)
        }), { totalSessions: 0, totalUsers: 0, totalPageviews: 0, totalEngagedSessions: 0 })

        // Calculate engagement rate
        const engagementRate = totals.totalSessions > 0
          ? (totals.totalEngagedSessions / totals.totalSessions) * 100
          : 0

        setGa4Data({
          ...totals,
          engagementRate,
          trafficSources: analyticsData.trafficSources || [],
          devices: analyticsData.devices || [],
          topCountries: analyticsData.topCountries || [],
          hasData: analyticsData.overview && analyticsData.overview.length > 0
        })
      } else {
        // Capture actual error message from API
        const errorData = await response.json()
        let errorMessage = errorData.error || `Failed to fetch GA4 data (${response.status})`
        // Add details if available for more context
        if (errorData.details) {
          errorMessage += `: ${errorData.details}`
        }
        if (errorData.originalError) {
          errorMessage += ` (${errorData.originalError})`
        }
        setGa4Error(errorMessage)
        setGa4Data({ totalSessions: 0, totalUsers: 0, totalPageviews: 0, totalEngagedSessions: 0, engagementRate: 0, trafficSources: [], devices: [], topCountries: [], hasData: false })
      }
    } catch (err) {
      console.error('Failed to fetch GA4 data:', err)
      const errorMessage = err instanceof Error ? err.message : 'Network error fetching GA4 data'
      setGa4Error(errorMessage)
      setGa4Data({ totalSessions: 0, totalUsers: 0, totalPageviews: 0, totalEngagedSessions: 0, engagementRate: 0, trafficSources: [], devices: [], topCountries: [], hasData: false })
    } finally {
      setGa4Loading(false)
    }
  }

  const fetchGoogleAdsData = async () => {
    setAdsLoading(true)
    setAdsError(null)

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
        // Capture actual error message from API
        const errorData = await response.json()
        let errorMessage = errorData.error || `Failed to fetch Google Ads data (${response.status})`
        // Add details if available for more context
        if (errorData.details) {
          errorMessage += `: ${errorData.details}`
        }
        if (errorData.originalError) {
          errorMessage += ` (${errorData.originalError})`
        }
        setAdsError(errorMessage)
        setGoogleAdsData({ totalSpend: 0, totalClicks: 0, totalImpressions: 0, totalConversions: 0, currency: 'ZAR', hasData: false })
      }
    } catch (err) {
      console.error('Failed to fetch Google Ads data:', err)
      const errorMessage = err instanceof Error ? err.message : 'Network error fetching Google Ads data'
      setAdsError(errorMessage)
      setGoogleAdsData({ totalSpend: 0, totalClicks: 0, totalImpressions: 0, totalConversions: 0, currency: 'ZAR', hasData: false })
    } finally {
      setAdsLoading(false)
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

  const fetchAttributionModel = async () => {
    try {
      const response = await fetch('/api/integrations/google/analytics/attribution')
      if (response.ok) {
        const data = await response.json()
        setAttributionModel(data.attributionModel)
      }
    } catch (err) {
      console.error('Failed to fetch attribution model:', err)
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

  if (error || !data) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-brand-navy">Your Marketing</h1>
          <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl">
            <p className="font-medium">{error || 'Failed to load marketing data'}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-bold text-brand-navy mb-2">Your Marketing</h1>
          <p className="text-brand-navy/70 mt-2 text-base font-light">Track your advertising performance</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/dashboard-client/google-ads')}
            className="flex items-center px-4 py-2 text-sm font-semibold bg-brand-gold/20 text-brand-gold rounded-lg hover:bg-brand-gold/30 transition-colors border border-brand-gold/30"
          >
            <Target className="h-4 w-4 mr-2" />
            Google Ads
          </button>
          <button
            onClick={() => router.push('/dashboard-client/seo')}
            className="flex items-center px-4 py-2 text-sm font-semibold bg-tropical-aqua/20 text-tropical-teal rounded-lg hover:bg-tropical-aqua/30 transition-colors border border-tropical-aqua/30"
          >
            <Search className="h-4 w-4 mr-2" />
            SEO
          </button>
          {lastSync && (
            <div className="text-right">
              <p className="text-xs font-medium text-brand-navy/60 uppercase tracking-wider">Last Synced</p>
              <p className="text-sm font-light text-brand-navy mt-1">
                {new Date(lastSync).toLocaleDateString('en-ZA', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Integration Error Banners */}
      {(ga4Error || adsError) && (
        <div className="space-y-4">
          {ga4Error && (
            <div className="bg-red-50 border border-red-200 p-4 rounded-xl">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-red-900 mb-1">Google Analytics Error</h3>
                  <p className="text-sm text-red-800">{ga4Error}</p>
                  {ga4Error.includes('not connected') && (
                    <button
                      onClick={() => router.push('/dashboard-client/settings')}
                      className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                    >
                      Connect Google Analytics
                    </button>
                  )}
                  {ga4Error.includes('not configured') && (
                    <button
                      onClick={() => router.push('/dashboard-client/settings')}
                      className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                    >
                      Configure Analytics Property ID
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
          {adsError && (
            <div className="bg-red-50 border border-red-200 p-4 rounded-xl">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-red-900 mb-1">Google Ads Error</h3>
                  <p className="text-sm text-red-800 mb-2">{adsError}</p>
                  {(adsError.includes('not connected') || adsError.includes('refresh token')) && (
                    <div className="space-y-2">
                      <p className="text-xs text-red-700">
                        {adsError.includes('refresh token')
                          ? 'Your Google connection needs to be refreshed with Google Ads permissions.'
                          : 'Connect your Google account to access Google Ads data.'}
                      </p>
                      <button
                        onClick={() => router.push('/dashboard-client/settings')}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                      >
                        Reconnect Google Account
                      </button>
                    </div>
                  )}
                  {adsError.includes('not configured') && !adsError.includes('refresh token') && (
                    <button
                      onClick={() => router.push('/dashboard-client/settings')}
                      className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                    >
                      Configure Ads Customer ID
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Loading States */}
      {(ga4Loading || adsLoading) && (
        <div className="space-y-4">
          {ga4Loading && (
            <div className="bg-tropical-aqua/10 border border-tropical-aqua/30 p-4 rounded-xl">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-tropical-teal mr-3"></div>
                <div>
                  <h3 className="text-sm font-semibold text-brand-navy">Fetching website traffic stats...</h3>
                  <p className="text-xs text-brand-navy/60 mt-0.5">Loading Google Analytics data</p>
                </div>
              </div>
            </div>
          )}
          {adsLoading && (
            <div className="bg-tropical-aqua/10 border border-tropical-aqua/30 p-4 rounded-xl">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-tropical-teal mr-3"></div>
                <div>
                  <h3 className="text-sm font-semibold text-brand-navy">Fetching Google Ads data...</h3>
                  <p className="text-xs text-brand-navy/60 mt-0.5">Loading campaign performance</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* BIG WARNING - Always visible at top */}
      <div className="bg-brand-gold/10 border border-brand-gold/30 p-6 rounded-2xl sticky top-0 z-10 backdrop-blur-sm">
        <div className="flex items-start">
          <AlertTriangle className="h-6 w-6 text-brand-gold mr-4 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-base font-semibold text-brand-navy mb-2">About Marketing Attribution</h3>
            <p className="text-brand-navy/80 text-sm leading-relaxed font-light">
              Marketing tracking isn't perfect. Someone might see your ad, research you, then book directly days later.
              We show you overall performance, not per-booking attribution. Use this data to understand trends and make
              informed decisions about where to invest your marketing budget.
            </p>
          </div>
        </div>
      </div>

      {/* Check if has data */}
      {!data.hasData && (
        <div className="bg-white border border-soft-gray p-12 rounded-xl text-center shadow-sm">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-gold/20 mb-6">
            <Target className="h-8 w-8 text-brand-navy" />
          </div>
          <h3 className="text-xl font-bold text-brand-navy mb-3">No Marketing Data Yet</h3>
          <p className="text-brand-navy/60 text-sm font-book mb-6 max-w-md mx-auto">
            Connect your Google Ads or Meta Ads account to start tracking your marketing performance.
          </p>
          <button
            onClick={() => router.push('/dashboard-client/settings')}
            className="px-6 py-3 bg-brand-navy text-white rounded-xl font-semibold hover:bg-brand-navy/90 hover:shadow-md transition-all"
          >
            Connect Marketing Accounts
          </button>
        </div>
      )}

      {data.hasData && (
        <>
          {/* GA4 Website Traffic Section */}
          {ga4Data && ga4Data.hasData && (
            <>
              <h3 className="text-lg font-bold text-brand-navy mb-4 flex items-center">
                <Eye className="h-5 w-5 text-tropical-teal mr-2" />
                Website Traffic (Last 30 Days)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-xl border border-soft-gray hover:shadow-md transition-all shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-brand-navy/60">Sessions</span>
                    <MousePointerClick className="h-4 w-4 text-brand-gold" />
                  </div>
                  <div className="text-2xl font-bold text-brand-navy">
                    {formatNumber(ga4Data.totalSessions)}
                  </div>
                  <p className="text-xs text-brand-navy/60 mt-1">Total website visits</p>
                </div>

                <div className="bg-white p-6 rounded-xl border border-soft-gray hover:shadow-md transition-all shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-brand-navy/60">Users</span>
                    <Users className="h-4 w-4 text-brand-gold" />
                  </div>
                  <div className="text-2xl font-bold text-brand-navy">
                    {formatNumber(ga4Data.totalUsers)}
                  </div>
                  <p className="text-xs text-brand-navy/60 mt-1">Unique visitors</p>
                </div>

                <div className="bg-white p-6 rounded-xl border border-soft-gray hover:shadow-md transition-all shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-brand-navy/60">Page Views</span>
                    <Eye className="h-4 w-4 text-brand-gold" />
                  </div>
                  <div className="text-2xl font-bold text-brand-navy">
                    {formatNumber(ga4Data.totalPageviews)}
                  </div>
                  <p className="text-xs text-brand-navy/60 mt-1">Total pages viewed</p>
                </div>

                <div className="bg-white p-6 rounded-xl border border-soft-gray hover:shadow-md transition-all shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-brand-navy/60">Engagement Rate</span>
                    <Activity className="h-4 w-4 text-brand-gold" />
                  </div>
                  <div className="text-2xl font-bold text-brand-navy">
                    {ga4Data.engagementRate.toFixed(1)}%
                  </div>
                  <p className="text-xs text-brand-navy/60 mt-1">Sessions with engagement</p>
                </div>
              </div>
            </>
          )}

          {/* Traffic Sources Table */}
          {ga4Data && ga4Data.hasData && ga4Data.trafficSources && ga4Data.trafficSources.length > 0 && (
            <div className="bg-white rounded-xl border border-soft-gray overflow-hidden shadow-sm">
              <div className="px-6 py-5 border-b border-soft-gray">
                <h3 className="text-lg font-bold text-brand-navy">Traffic by Medium</h3>
                <p className="text-sm text-brand-navy/60 mt-1">Google Analytics traffic sources (Last 30 Days)</p>
                {attributionModel && (
                  <div className="mt-3 flex items-start gap-2 text-xs text-brand-navy/60">
                    <Info className="h-3.5 w-3.5 text-tropical-teal mt-0.5 flex-shrink-0" />
                    <p className="leading-relaxed">
                      Conversions and revenue are attributed using <span className="font-semibold text-brand-navy">{attributionModel}</span> attribution.
                      This can be changed in GA4 Admin → Attribution Settings.
                    </p>
                  </div>
                )}
                <div className="mt-2 flex items-start gap-2 text-xs text-brand-navy/60">
                  <AlertTriangle className="h-3.5 w-3.5 text-sunset-orange mt-0.5 flex-shrink-0" />
                  <p className="leading-relaxed">
                    <span className="font-semibold text-brand-navy">Google Ads clicks vs GA4 sessions:</span> Numbers will differ because not all ad clicks result in tracked sessions (due to ad blockers, page load issues, invalid clicks, or users leaving before GA4 fires). Typically 70-90% of clicks become sessions.
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-golden-cream/20 border-b border-soft-gray">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-brand-navy/60 uppercase tracking-wider">
                        Channel
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-brand-navy/60 uppercase tracking-wider">
                        Sessions
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-brand-navy/60 uppercase tracking-wider">
                        Users
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-brand-navy/60 uppercase tracking-wider">
                        Cost
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-brand-navy/60 uppercase tracking-wider">
                        Conversions
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-brand-navy/60 uppercase tracking-wider">
                        Revenue
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-soft-gray">
                    {ga4Data.trafficSources.map((source: any, index: number) => {
                      return (
                        <tr key={index} className="hover:bg-golden-cream/10 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-semibold text-brand-navy">
                              {source.source}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <span className="text-sm font-book text-brand-navy">
                              {formatNumber(source.sessions)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <span className="text-sm font-book text-brand-navy">
                              {formatNumber(source.users)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <span className="text-sm font-book text-brand-navy">
                              {source.cost > 0 ? formatCurrency(source.cost) : '-'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <span className="text-sm font-semibold text-brand-gold">
                              {formatNumber(source.conversions)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <span className="text-sm font-semibold text-forest-green">
                              {source.revenue > 0 ? formatCurrency(source.revenue) : '-'}
                            </span>
                          </td>
                        </tr>
                      )
                    })}

                    {/* Totals Row */}
                    <tr className="bg-brand-gold/5">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-xs font-semibold uppercase tracking-wider text-brand-navy">Total</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className="text-sm font-semibold text-brand-navy">
                          {formatNumber(ga4Data.totalSessions)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className="text-sm font-semibold text-brand-navy">
                          {formatNumber(ga4Data.totalUsers)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className="text-sm font-semibold text-brand-navy">
                          {formatCurrency(ga4Data.trafficSources.reduce((sum, s) => sum + s.cost, 0))}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className="text-sm font-semibold text-brand-gold">
                          {formatNumber(ga4Data.trafficSources.reduce((sum, s) => sum + s.conversions, 0))}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className="text-sm font-bold text-forest-green">
                          {formatCurrency(ga4Data.trafficSources.reduce((sum, s) => sum + s.revenue, 0))}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Device Breakdown and Top Countries Grid */}
          {ga4Data && ga4Data.hasData && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Device Breakdown */}
              {ga4Data.devices && ga4Data.devices.length > 0 && (
                <div className="bg-white rounded-xl border border-soft-gray shadow-sm">
                  <div className="px-6 py-5 border-b border-soft-gray">
                    <h3 className="text-lg font-bold text-brand-navy">Device Breakdown</h3>
                    <p className="text-sm text-brand-navy/60 mt-1">Sessions by device type</p>
                  </div>
                  <div className="p-6 space-y-4">
                    {ga4Data.devices.map((device, index) => {
                      const percentage = ga4Data.totalSessions > 0
                        ? (device.sessions / ga4Data.totalSessions) * 100
                        : 0
                      const deviceIcons: { [key: string]: string } = {
                        'mobile': '📱',
                        'desktop': '💻',
                        'tablet': '📱',
                        'tv': '📺'
                      }
                      return (
                        <div key={index} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{deviceIcons[device.device.toLowerCase()] || '📱'}</span>
                              <span className="text-sm font-semibold text-brand-navy capitalize">
                                {device.device}
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-sm font-bold text-brand-navy">
                                {formatNumber(device.sessions)}
                              </span>
                              <span className="text-xs text-brand-navy/60 ml-2">
                                ({percentage.toFixed(1)}%)
                              </span>
                            </div>
                          </div>
                          <div className="w-full bg-soft-gray rounded-full h-2">
                            <div
                              className="bg-brand-gold rounded-full h-2 transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Top 10 Countries */}
              {ga4Data.topCountries && ga4Data.topCountries.length > 0 && (
                <div className="bg-white rounded-xl border border-soft-gray shadow-sm">
                  <div className="px-6 py-5 border-b border-soft-gray">
                    <h3 className="text-lg font-bold text-brand-navy">Top Countries</h3>
                    <p className="text-sm text-brand-navy/60 mt-1">Traffic by location</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-golden-cream/20 border-b border-soft-gray">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-brand-navy/60 uppercase tracking-wider">
                            Country
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-semibold text-brand-navy/60 uppercase tracking-wider">
                            Sessions
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-semibold text-brand-navy/60 uppercase tracking-wider">
                            Conv.
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-soft-gray">
                        {ga4Data.topCountries.map((country, index) => (
                          <tr key={index} className="hover:bg-golden-cream/10 transition-colors">
                            <td className="px-6 py-3 whitespace-nowrap">
                              <span className="text-sm font-medium text-brand-navy">
                                {country.country}
                              </span>
                            </td>
                            <td className="px-6 py-3 whitespace-nowrap text-right">
                              <span className="text-sm font-book text-brand-navy">
                                {formatNumber(country.sessions)}
                              </span>
                            </td>
                            <td className="px-6 py-3 whitespace-nowrap text-right">
                              <span className="text-sm font-semibold text-brand-gold">
                                {formatNumber(country.conversions)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Additional Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-8 rounded-xl border border-soft-gray hover:shadow-md transition-all shadow-sm">
              <h3 className="text-xs font-semibold text-brand-navy/60 uppercase tracking-wider mb-3">Cost Per Booking</h3>
              <div className="text-3xl font-bold text-brand-navy mb-2">
                {formatCurrency(data.summary.costPerBooking)}
              </div>
              <p className="text-sm font-book text-brand-navy/60 leading-relaxed">
                Average cost to acquire one booking through marketing
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl border border-soft-gray hover:shadow-md transition-all shadow-sm">
              <h3 className="text-xs font-semibold text-brand-navy/60 uppercase tracking-wider mb-3">Direct Bookings</h3>
              <div className="text-3xl font-bold text-brand-gold mb-2">
                {formatNumber(data.summary.directBookings)}
              </div>
              <p className="text-sm font-book text-brand-navy/60 leading-relaxed">
                Estimated bookings directly attributed to marketing (30% attribution model)
              </p>
            </div>
          </div>

          {/* Trend Chart */}
          {data.trendData && data.trendData.length > 0 && (
            <div className="bg-white p-6 rounded-xl border border-soft-gray shadow-sm">
              <h3 className="text-lg font-bold text-brand-navy mb-6">30-Day Trend</h3>
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={data.trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e0" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' })}
                    style={{ fontSize: '12px', fill: '#28384d', fontWeight: 500 }}
                  />
                  <YAxis style={{ fontSize: '12px', fill: '#28384d', fontWeight: 500 }} />
                  <Tooltip
                    labelFormatter={(value) => new Date(value).toLocaleDateString('en-ZA')}
                    formatter={(value: number) => formatNumber(value)}
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e5e5e0',
                      borderRadius: '12px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      fontSize: '13px',
                      padding: '12px'
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Line type="monotone" dataKey="spend" stroke="#28384d" name="Spend" strokeWidth={3} />
                  <Line type="monotone" dataKey="clicks" stroke="#ffcc4e" name="Clicks" strokeWidth={3} />
                  <Line type="monotone" dataKey="conversions" stroke="#2d5f4d" name="Conversions" strokeWidth={3} strokeDasharray="5 5" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* ROI Guidance */}
          <div className="bg-tropical-aqua/10 border border-tropical-aqua/30 p-8 rounded-xl shadow-sm">
            <div className="flex items-start">
              <TrendingUp className="h-6 w-6 text-tropical-teal mr-4 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-base font-semibold text-brand-navy mb-3">Understanding Your ROI</h3>
                <p className="text-brand-navy/80 text-sm font-book leading-relaxed mb-4">
                  ROI (Return on Investment) shows how much revenue you generate for every rand spent on marketing.
                  A 3.0x ROI means you earn R3 for every R1 spent.
                </p>
                <div className="space-y-2.5">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-forest-green rounded-full mr-3"></div>
                    <span className="text-brand-navy/80 text-sm font-book">2.5x or higher = Excellent</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-brand-navy rounded-full mr-3"></div>
                    <span className="text-brand-navy/80 text-sm font-book">1.5x - 2.5x = Good</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-sunset-orange rounded-full mr-3"></div>
                    <span className="text-brand-navy/80 text-sm font-book">Below 1.5x = Needs improvement</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// Conversion Popup Component
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

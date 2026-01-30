'use client'

import { useState, useEffect } from 'react'
import { Search, TrendingUp, Eye, Activity, MousePointerClick, CheckCircle2, XCircle, AlertTriangle, Info, RefreshCw, Settings, Target } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useApiUrl } from '@/lib/hooks/use-api-url'
import { useSelectedHotelId } from '@/lib/hooks/use-selected-hotel-id'

interface SEOData {
  organicTraffic: {
    sessions: number
    users: number
    engagedSessions: number
    conversions: number
    revenue: number
    engagementRate: number
  }
  organicSources?: Array<{
    source: string
    sessions: number
    users: number
    conversions: number
  }>
  searchConsole: {
    impressions: number
    clicks: number
    ctr: number
    position: number
    connected: boolean
  } | null
  hasData: boolean
}

interface SEOAuditData {
  url: string
  timestamp: string
  overallScore: number
  fromCache?: boolean
  checks: {
    [key: string]: any
  }
}

export default function SEOPage() {
  const router = useRouter()
  const buildUrl = useApiUrl()
  const { selectedHotelId, isReady } = useSelectedHotelId()
  const [loading, setLoading] = useState(true)
  const [seoData, setSeoData] = useState<SEOData | null>(null)
  const [seoLoading, setSeoLoading] = useState(true)
  const [auditData, setAuditData] = useState<SEOAuditData | null>(null)
  const [auditLoading, setAuditLoading] = useState(false)
  const [auditError, setAuditError] = useState<string | null>(null)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  useEffect(() => {
    if (isReady) {
      // Set default date range to last 30 days
      const end = new Date()
      const start = new Date()
      start.setDate(start.getDate() - 30)

      const endDateStr = end.toISOString().split('T')[0]
      const startDateStr = start.toISOString().split('T')[0]

      setEndDate(endDateStr)
      setStartDate(startDateStr)

      fetchSEOData(startDateStr, endDateStr)
      fetchAuditData()
    }
  }, [selectedHotelId, isReady])

  const fetchSEOData = async (start: string, end: string) => {
    setSeoLoading(true)
    try {
      const url = buildUrl('/api/client/seo', { startDate: start, endDate: end })
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setSeoData(data)
      } else {
        setSeoData(null)
      }
    } catch (err) {
      console.error('Failed to fetch SEO data:', err)
      setSeoData(null)
    } finally {
      setSeoLoading(false)
      setLoading(false)
    }
  }

  const fetchAuditData = async (forceRefresh = false) => {
    setAuditLoading(true)
    setAuditError(null)
    try {
      const url = buildUrl('/api/client/seo-audit', forceRefresh ? { refresh: 'true' } : {})
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setAuditData(data)
      } else {
        const errorData = await response.json()
        setAuditError(errorData.error || 'Failed to fetch SEO audit data')
        setAuditData(null)
      }
    } catch (err) {
      console.error('Failed to fetch SEO audit data:', err)
      setAuditError('Failed to fetch SEO audit data')
      setAuditData(null)
    } finally {
      setAuditLoading(false)
    }
  }

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-ZA').format(value)
  }

  const handleUpdateData = () => {
    if (startDate && endDate) {
      fetchSEOData(startDate, endDate)
    }
  }

  const formatDateRange = () => {
    if (!startDate || !endDate) return 'Last 30 Days'

    const start = new Date(startDate)
    const end = new Date(endDate)

    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle2 className="h-5 w-5 text-forest-green" />
      case 'fail':
        return <XCircle className="h-5 w-5 text-sunset-orange" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-brand-gold" />
      default:
        return <Info className="h-5 w-5 text-tropical-teal" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass':
        return 'bg-forest-green/10 border-forest-green/30'
      case 'fail':
        return 'bg-sunset-orange/10 border-sunset-orange/30'
      case 'warning':
        return 'bg-brand-gold/10 border-brand-gold/30'
      default:
        return 'bg-tropical-aqua/10 border-tropical-aqua/30'
    }
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
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold text-brand-navy mb-2">SEO Performance</h1>
          <p className="text-brand-navy/70 mt-2 text-base font-light">
            Track your organic search performance and technical SEO health
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/dashboard-client/marketing')}
            className="flex items-center px-4 py-2 text-sm font-semibold bg-white text-brand-navy rounded-lg hover:bg-soft-gray/50 transition-colors border border-soft-gray"
          >
            <Eye className="h-4 w-4 mr-2" />
            Website Performance
          </button>
          <button
            onClick={() => router.push('/dashboard-client/google-ads')}
            className="flex items-center px-4 py-2 text-sm font-semibold bg-white text-brand-navy rounded-lg hover:bg-soft-gray/50 transition-colors border border-soft-gray"
          >
            <Target className="h-4 w-4 mr-2" />
            Google Ads
          </button>
          <div className="flex items-center px-4 py-2 text-sm font-semibold bg-tropical-teal text-white rounded-lg border border-tropical-teal shadow-sm">
            <Search className="h-4 w-4 mr-2" />
            SEO
          </div>
        </div>
      </div>

      {/* Date Range Selector */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-soft-gray">
        <h3 className="text-base font-semibold text-brand-navy mb-3">Date Range</h3>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-4 py-2 border border-soft-gray rounded-lg text-sm text-brand-navy focus:outline-none focus:ring-2 focus:ring-tropical-teal/50 focus:border-tropical-teal"
          />
          <span className="text-brand-navy/60 text-sm font-medium">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-4 py-2 border border-soft-gray rounded-lg text-sm text-brand-navy focus:outline-none focus:ring-2 focus:ring-tropical-teal/50 focus:border-tropical-teal"
          />
          <button
            onClick={handleUpdateData}
            disabled={seoLoading || !startDate || !endDate}
            className="px-6 py-2 bg-tropical-teal text-white text-sm font-semibold rounded-lg hover:bg-tropical-teal/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {seoLoading ? 'Updating...' : 'Update'}
          </button>
        </div>
      </div>

      {/* Organic Traffic Score Cards */}
      {seoLoading ? (
        <>
          <h3 className="text-lg font-bold text-brand-navy mb-4 flex items-center">
            <TrendingUp className="h-5 w-5 text-tropical-teal mr-2" />
            Organic Search Traffic ({formatDateRange()})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white p-6 rounded-xl border border-soft-gray shadow-sm animate-pulse">
                <div className="h-4 bg-soft-gray rounded w-20 mb-3"></div>
                <div className="h-8 bg-soft-gray rounded w-24 mb-2"></div>
                <div className="h-3 bg-soft-gray rounded w-32"></div>
              </div>
            ))}
          </div>
        </>
      ) : seoData && seoData.hasData ? (
        <>
          <h3 className="text-lg font-bold text-brand-navy mb-4 flex items-center">
            <TrendingUp className="h-5 w-5 text-tropical-teal mr-2" />
            Organic Search Traffic ({formatDateRange()})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-xl border border-soft-gray hover:shadow-md transition-all shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-brand-navy/60">Sessions</span>
                <MousePointerClick className="h-4 w-4 text-tropical-teal" />
              </div>
              <div className="text-2xl font-bold text-brand-navy">
                {formatNumber(seoData.organicTraffic.sessions)}
              </div>
              <p className="text-xs text-brand-navy/60 mt-1">Organic search visits</p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-soft-gray hover:shadow-md transition-all shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-brand-navy/60">Users</span>
                <Eye className="h-4 w-4 text-tropical-teal" />
              </div>
              <div className="text-2xl font-bold text-brand-navy">
                {formatNumber(seoData.organicTraffic.users)}
              </div>
              <p className="text-xs text-brand-navy/60 mt-1">Unique organic visitors</p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-soft-gray hover:shadow-md transition-all shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-brand-navy/60">Engagement Rate</span>
                <Activity className="h-4 w-4 text-tropical-teal" />
              </div>
              <div className="text-2xl font-bold text-brand-navy">
                {seoData.organicTraffic.engagementRate.toFixed(1)}%
              </div>
              <p className="text-xs text-brand-navy/60 mt-1">Engaged sessions</p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-soft-gray hover:shadow-md transition-all shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-brand-navy/60">Key Events</span>
                <TrendingUp className="h-4 w-4 text-tropical-teal" />
              </div>
              <div className="text-2xl font-bold text-brand-navy">
                {formatNumber(seoData.organicTraffic.conversions)}
              </div>
              <p className="text-xs text-brand-navy/60 mt-1">From organic search</p>
            </div>
          </div>
        </>
      ) : null}

      {/* Search Console Score Cards */}
      {seoLoading ? (
        <>
          <h3 className="text-lg font-bold text-brand-navy mb-4 flex items-center">
            <Search className="h-5 w-5 text-tropical-teal mr-2" />
            Google Search Console ({formatDateRange()})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white p-6 rounded-xl border border-soft-gray shadow-sm animate-pulse">
                <div className="h-4 bg-soft-gray rounded w-20 mb-3"></div>
                <div className="h-8 bg-soft-gray rounded w-24 mb-2"></div>
                <div className="h-3 bg-soft-gray rounded w-32"></div>
              </div>
            ))}
          </div>
        </>
      ) : seoData && seoData.searchConsole && seoData.searchConsole.connected ? (
        <>
          <h3 className="text-lg font-bold text-brand-navy mb-4 flex items-center">
            <Search className="h-5 w-5 text-tropical-teal mr-2" />
            Google Search Console ({formatDateRange()})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-xl border border-soft-gray hover:shadow-md transition-all shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-brand-navy/60">Impressions</span>
                <Eye className="h-4 w-4 text-tropical-teal" />
              </div>
              <div className="text-2xl font-bold text-brand-navy">
                {formatNumber(seoData.searchConsole.impressions)}
              </div>
              <p className="text-xs text-brand-navy/60 mt-1">Times shown in search</p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-soft-gray hover:shadow-md transition-all shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-brand-navy/60">Clicks</span>
                <MousePointerClick className="h-4 w-4 text-tropical-teal" />
              </div>
              <div className="text-2xl font-bold text-brand-navy">
                {formatNumber(seoData.searchConsole.clicks)}
              </div>
              <p className="text-xs text-brand-navy/60 mt-1">Clicks from search</p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-soft-gray hover:shadow-md transition-all shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-brand-navy/60">CTR</span>
                <TrendingUp className="h-4 w-4 text-tropical-teal" />
              </div>
              <div className="text-2xl font-bold text-brand-navy">
                {(seoData.searchConsole.ctr * 100).toFixed(1)}%
              </div>
              <p className="text-xs text-brand-navy/60 mt-1">Click-through rate</p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-soft-gray hover:shadow-md transition-all shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-brand-navy/60">Avg. Position</span>
                <Search className="h-4 w-4 text-tropical-teal" />
              </div>
              <div className="text-2xl font-bold text-brand-navy">
                {seoData.searchConsole.position.toFixed(1)}
              </div>
              <p className="text-xs text-brand-navy/60 mt-1">Average ranking</p>
            </div>
          </div>
        </>
      ) : null}

      {/* Organic Traffic Sources Table */}
      {seoLoading ? (
        <div className="bg-white rounded-xl border border-soft-gray overflow-hidden shadow-sm">
          <div className="px-6 py-5 border-b border-soft-gray">
            <div className="h-5 bg-soft-gray rounded w-48 mb-2 animate-pulse"></div>
            <div className="h-4 bg-soft-gray rounded w-64 animate-pulse"></div>
          </div>
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between animate-pulse">
                <div className="h-4 bg-soft-gray rounded w-24"></div>
                <div className="flex gap-8">
                  <div className="h-4 bg-soft-gray rounded w-16"></div>
                  <div className="h-4 bg-soft-gray rounded w-16"></div>
                  <div className="h-4 bg-soft-gray rounded w-16"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : seoData && seoData.organicSources && seoData.organicSources.length > 0 ? (
        <div className="bg-white rounded-xl border border-soft-gray overflow-hidden shadow-sm">
          <div className="px-6 py-5 border-b border-soft-gray">
            <h3 className="text-lg font-bold text-brand-navy">Organic Traffic by Source</h3>
            <p className="text-sm text-brand-navy/60 mt-1">Search engines driving organic traffic ({formatDateRange()})</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-golden-cream/20 border-b border-soft-gray">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-brand-navy/60 uppercase tracking-wider">
                    Source
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-brand-navy/60 uppercase tracking-wider">
                    Sessions
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-brand-navy/60 uppercase tracking-wider">
                    Users
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-brand-navy/60 uppercase tracking-wider">
                    Conversions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-soft-gray">
                {seoData.organicSources.map((source, index) => (
                  <tr key={index} className="hover:bg-golden-cream/10 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-brand-navy capitalize">
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
                      <span className="text-sm font-semibold text-tropical-teal">
                        {formatNumber(source.conversions)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {/* Technical SEO Audit */}
      <div className="bg-white rounded-xl border border-soft-gray shadow-sm">
        <div className="px-6 py-5 border-b border-soft-gray flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-brand-navy">Technical SEO Audit</h3>
            <p className="text-sm text-brand-navy/60 mt-1">
              {auditData ? `Last checked: ${new Date(auditData.timestamp).toLocaleString('en-ZA')}` : 'Site health checks'}
            </p>
          </div>
          <button
            onClick={() => fetchAuditData(true)}
            disabled={auditLoading}
            className="flex items-center px-4 py-2 text-sm font-semibold bg-tropical-aqua/20 text-tropical-teal rounded-lg hover:bg-tropical-aqua/30 transition-colors border border-tropical-aqua/30 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${auditLoading ? 'animate-spin' : ''}`} />
            {auditLoading ? 'Running Audit...' : 'Run New Audit'}
          </button>
        </div>

        {auditData && (
          <>
            {/* Last Run Date - Prominent Display */}
            <div className="px-6 py-4 bg-golden-cream/20 border-b border-soft-gray">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-semibold text-brand-navy/70">Last audit run:</span>
                <span className="font-bold text-brand-navy">
                  {new Date(auditData.timestamp).toLocaleString('en-ZA', {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
                {auditData.fromCache && (
                  <span className="text-xs text-brand-navy/50 italic">(from cache)</span>
                )}
              </div>
            </div>

            {/* Overall Score */}
            <div className="px-6 py-5 bg-tropical-aqua/5 border-b border-soft-gray">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-brand-navy mb-1">Overall SEO Health Score</h4>
                  <p className="text-xs text-brand-navy/60">Based on {Object.keys(auditData.checks).length} checks</p>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold text-brand-navy">{auditData.overallScore}%</div>
                  <p className="text-xs text-brand-navy/60 mt-1">
                    {auditData.overallScore >= 80 ? 'Excellent' : auditData.overallScore >= 60 ? 'Good' : 'Needs Work'}
                  </p>
                </div>
              </div>
            </div>

            {/* Audit Checks */}
            <div className="p-6 space-y-3">
              {/* Page Speed */}
              {auditData.checks.pageSpeed && auditData.checks.pageSpeed.status !== 'info' && (
                <div className={`p-4 rounded-xl border ${getStatusColor(auditData.checks.pageSpeed.status)}`}>
                  <div className="flex items-start gap-3">
                    {getStatusIcon(auditData.checks.pageSpeed.status)}
                    <div className="flex-1">
                      <h5 className="text-sm font-semibold text-brand-navy mb-1">Page Speed</h5>
                      <p className="text-xs text-brand-navy/70 mb-2">{auditData.checks.pageSpeed.message}</p>
                      {auditData.checks.pageSpeed.mobile && (
                        <div className="grid grid-cols-2 gap-4 mt-3">
                          <div>
                            <p className="text-xs font-semibold text-brand-navy/60 mb-2">Mobile</p>
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs">
                                <span className="text-brand-navy/70">Performance:</span>
                                <span className="font-semibold text-brand-navy">{auditData.checks.pageSpeed.mobile.score}/100</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-brand-navy/70">LCP:</span>
                                <span className="font-semibold text-brand-navy">{auditData.checks.pageSpeed.mobile.lcp}</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-brand-navy/70">CLS:</span>
                                <span className="font-semibold text-brand-navy">{auditData.checks.pageSpeed.mobile.cls}</span>
                              </div>
                            </div>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-brand-navy/60 mb-2">Desktop</p>
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs">
                                <span className="text-brand-navy/70">Performance:</span>
                                <span className="font-semibold text-brand-navy">{auditData.checks.pageSpeed.desktop.score}/100</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-brand-navy/70">LCP:</span>
                                <span className="font-semibold text-brand-navy">{auditData.checks.pageSpeed.desktop.lcp}</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-brand-navy/70">CLS:</span>
                                <span className="font-semibold text-brand-navy">{auditData.checks.pageSpeed.desktop.cls}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Title */}
              {auditData.checks.title && (
                <div className={`p-4 rounded-xl border ${getStatusColor(auditData.checks.title.status)}`}>
                  <div className="flex items-start gap-3">
                    {getStatusIcon(auditData.checks.title.status)}
                    <div className="flex-1">
                      <h5 className="text-sm font-semibold text-brand-navy mb-1">Homepage Title</h5>
                      <p className="text-xs text-brand-navy/70 mb-1">{auditData.checks.title.message}</p>
                      {auditData.checks.title.value && (
                        <p className="text-xs text-brand-navy/50 font-mono bg-white/50 p-2 rounded mt-2">
                          "{auditData.checks.title.value}" ({auditData.checks.title.length} chars)
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Meta Description */}
              {auditData.checks.metaDescription && (
                <div className={`p-4 rounded-xl border ${getStatusColor(auditData.checks.metaDescription.status)}`}>
                  <div className="flex items-start gap-3">
                    {getStatusIcon(auditData.checks.metaDescription.status)}
                    <div className="flex-1">
                      <h5 className="text-sm font-semibold text-brand-navy mb-1">Meta Description</h5>
                      <p className="text-xs text-brand-navy/70 mb-1">{auditData.checks.metaDescription.message}</p>
                      {auditData.checks.metaDescription.value && (
                        <p className="text-xs text-brand-navy/50 font-mono bg-white/50 p-2 rounded mt-2">
                          "{auditData.checks.metaDescription.value}" ({auditData.checks.metaDescription.length} chars)
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* HTTPS */}
              {auditData.checks.https && (
                <div className={`p-4 rounded-xl border ${getStatusColor(auditData.checks.https.status)}`}>
                  <div className="flex items-start gap-3">
                    {getStatusIcon(auditData.checks.https.status)}
                    <div className="flex-1">
                      <h5 className="text-sm font-semibold text-brand-navy mb-1">HTTPS / SSL Certificate</h5>
                      <p className="text-xs text-brand-navy/70">{auditData.checks.https.message}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Favicon */}
              {auditData.checks.favicon && (
                <div className={`p-4 rounded-xl border ${getStatusColor(auditData.checks.favicon.status)}`}>
                  <div className="flex items-start gap-3">
                    {getStatusIcon(auditData.checks.favicon.status)}
                    <div className="flex-1">
                      <h5 className="text-sm font-semibold text-brand-navy mb-1">Favicon</h5>
                      <p className="text-xs text-brand-navy/70">{auditData.checks.favicon.message}</p>
                      {auditData.checks.favicon.url && (
                        <p className="text-xs text-brand-navy/50 mt-1">{auditData.checks.favicon.url}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* robots.txt */}
              {auditData.checks.robotsTxt && (
                <div className={`p-4 rounded-xl border ${getStatusColor(auditData.checks.robotsTxt.status)}`}>
                  <div className="flex items-start gap-3">
                    {getStatusIcon(auditData.checks.robotsTxt.status)}
                    <div className="flex-1">
                      <h5 className="text-sm font-semibold text-brand-navy mb-1">robots.txt</h5>
                      <p className="text-xs text-brand-navy/70">{auditData.checks.robotsTxt.message}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* XML Sitemap */}
              {auditData.checks.xmlSitemap && (
                <div className={`p-4 rounded-xl border ${getStatusColor(auditData.checks.xmlSitemap.status)}`}>
                  <div className="flex items-start gap-3">
                    {getStatusIcon(auditData.checks.xmlSitemap.status)}
                    <div className="flex-1">
                      <h5 className="text-sm font-semibold text-brand-navy mb-1">XML Sitemap</h5>
                      <p className="text-xs text-brand-navy/70">{auditData.checks.xmlSitemap.message}</p>
                      {auditData.checks.xmlSitemap.url && (
                        <p className="text-xs text-brand-navy/50 mt-1">{auditData.checks.xmlSitemap.url}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* H1 Tag */}
              {auditData.checks.h1 && (
                <div className={`p-4 rounded-xl border ${getStatusColor(auditData.checks.h1.status)}`}>
                  <div className="flex items-start gap-3">
                    {getStatusIcon(auditData.checks.h1.status)}
                    <div className="flex-1">
                      <h5 className="text-sm font-semibold text-brand-navy mb-1">H1 Tag</h5>
                      <p className="text-xs text-brand-navy/70 mb-1">{auditData.checks.h1.message}</p>
                      {auditData.checks.h1.value && (
                        <p className="text-xs text-brand-navy/50 font-mono bg-white/50 p-2 rounded mt-2">
                          "{auditData.checks.h1.value}"
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Mobile Friendly */}
              {auditData.checks.mobileFriendly && (
                <div className={`p-4 rounded-xl border ${getStatusColor(auditData.checks.mobileFriendly.status)}`}>
                  <div className="flex items-start gap-3">
                    {getStatusIcon(auditData.checks.mobileFriendly.status)}
                    <div className="flex-1">
                      <h5 className="text-sm font-semibold text-brand-navy mb-1">Mobile-Friendly</h5>
                      <p className="text-xs text-brand-navy/70">{auditData.checks.mobileFriendly.message}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Structured Data */}
              {auditData.checks.structuredData && (
                <div className={`p-4 rounded-xl border ${getStatusColor(auditData.checks.structuredData.status)}`}>
                  <div className="flex items-start gap-3">
                    {getStatusIcon(auditData.checks.structuredData.status)}
                    <div className="flex-1">
                      <h5 className="text-sm font-semibold text-brand-navy mb-1">Structured Data</h5>
                      <p className="text-xs text-brand-navy/70">{auditData.checks.structuredData.message}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Meta Robots */}
              {auditData.checks.metaRobots && (
                <div className={`p-4 rounded-xl border ${getStatusColor(auditData.checks.metaRobots.status)}`}>
                  <div className="flex items-start gap-3">
                    {getStatusIcon(auditData.checks.metaRobots.status)}
                    <div className="flex-1">
                      <h5 className="text-sm font-semibold text-brand-navy mb-1">Indexability</h5>
                      <p className="text-xs text-brand-navy/70">{auditData.checks.metaRobots.message}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Open Graph */}
              {auditData.checks.openGraph && (
                <div className={`p-4 rounded-xl border ${getStatusColor(auditData.checks.openGraph.status)}`}>
                  <div className="flex items-start gap-3">
                    {getStatusIcon(auditData.checks.openGraph.status)}
                    <div className="flex-1">
                      <h5 className="text-sm font-semibold text-brand-navy mb-1">Open Graph Tags</h5>
                      <p className="text-xs text-brand-navy/70">{auditData.checks.openGraph.message}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Canonical */}
              {auditData.checks.canonical && (
                <div className={`p-4 rounded-xl border ${getStatusColor(auditData.checks.canonical.status)}`}>
                  <div className="flex items-start gap-3">
                    {getStatusIcon(auditData.checks.canonical.status)}
                    <div className="flex-1">
                      <h5 className="text-sm font-semibold text-brand-navy mb-1">Canonical URL</h5>
                      <p className="text-xs text-brand-navy/70">{auditData.checks.canonical.message}</p>
                      {auditData.checks.canonical.value && (
                        <p className="text-xs text-brand-navy/50 mt-1">{auditData.checks.canonical.value}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {!auditData && !auditLoading && !auditError && (
          <div className="p-12 text-center">
            <p className="text-brand-navy/60">Click "Refresh" to run an SEO audit</p>
          </div>
        )}

        {auditError && (
          <div className="p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-sunset-orange/20 mb-4">
              <AlertTriangle className="h-8 w-8 text-sunset-orange" />
            </div>
            <h4 className="text-lg font-bold text-brand-navy mb-2">Unable to Run SEO Audit</h4>
            <p className="text-brand-navy/70 text-sm mb-4">{auditError}</p>
            {auditError.includes('Website URL not configured') && (
              <p className="text-brand-navy/60 text-sm">
                Please add your website URL in{' '}
                <a href="/dashboard-client/settings" className="text-tropical-teal font-semibold hover:underline">
                  Settings
                </a>{' '}
                to enable SEO audits.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

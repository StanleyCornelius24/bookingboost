'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, TrendingUp, DollarSign, MousePointerClick, Target } from 'lucide-react'
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
import { MarketingAnalysisData } from '@/lib/marketing-analysis'

export default function ClientMarketingPage() {
  const [data, setData] = useState<MarketingAnalysisData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastSync, setLastSync] = useState<string | null>(null)

  useEffect(() => {
    fetchMarketingData()
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
          <div className="h-8 bg-border rounded-lg w-64 mb-4"></div>
          <div className="h-4 bg-border rounded-lg w-96"></div>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-brand-navy">Your Marketing</h1>
          <p className="text-red-600 font-light">{error || 'Failed to load marketing data'}</p>
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
        <div className="bg-card border border-border p-12 rounded-2xl text-center shadow-sm">
          <Target className="h-12 w-12 text-brand-gold mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-brand-navy mb-2">No Marketing Data Yet</h3>
          <p className="text-brand-navy/70 text-sm font-light mb-6 max-w-md mx-auto">
            Connect your Google Ads or Meta Ads account to start tracking your marketing performance.
          </p>
          <button className="px-6 py-2.5 bg-brand-navy text-white rounded-lg font-medium hover:bg-brand-navy/90 transition-all">
            Connect Marketing Accounts
          </button>
        </div>
      )}

      {data.hasData && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-card p-6 rounded-2xl border border-border hover:border-brand-gold/30 transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium uppercase tracking-wider text-brand-navy/60">Total Spend</span>
                <DollarSign className="h-4 w-4 text-brand-gold" />
              </div>
              <div className="text-2xl font-bold text-brand-navy">
                {formatCurrency(data.summary.totalSpend)}
              </div>
            </div>

            <div className="bg-card p-6 rounded-2xl border border-border hover:border-brand-gold/30 transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium uppercase tracking-wider text-brand-navy/60">Total Clicks</span>
                <MousePointerClick className="h-4 w-4 text-brand-gold" />
              </div>
              <div className="text-2xl font-bold text-brand-navy">
                {formatNumber(data.summary.totalClicks)}
              </div>
            </div>

            <div className="bg-card p-6 rounded-2xl border border-border hover:border-brand-gold/30 transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium uppercase tracking-wider text-brand-navy/60">Conversions</span>
                <Target className="h-4 w-4 text-brand-gold" />
              </div>
              <div className="text-2xl font-bold text-brand-navy">
                {formatNumber(data.summary.totalConversions)}
              </div>
            </div>

            <div className="bg-card p-6 rounded-2xl border border-border hover:border-brand-gold/30 transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium uppercase tracking-wider text-brand-navy/60">Blended ROI</span>
                <TrendingUp className="h-4 w-4 text-brand-gold" />
              </div>
              <div className="text-2xl font-bold text-brand-navy">
                {data.summary.blendedRoi.toFixed(1)}x
              </div>
            </div>
          </div>

          {/* Platform Performance Table */}
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="px-6 py-5 border-b border-border">
              <h3 className="text-lg font-semibold text-brand-navy">Platform Performance</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-off-white">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-brand-navy/60 uppercase tracking-wider">
                      Platform
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-brand-navy/60 uppercase tracking-wider">
                      Spend
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-brand-navy/60 uppercase tracking-wider">
                      Clicks
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-brand-navy/60 uppercase tracking-wider">
                      Conversions
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-brand-navy/60 uppercase tracking-wider">
                      CPC
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-brand-navy/60 uppercase tracking-wider">
                      ROI
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.platforms.map((platform, index) => (
                    <tr key={index} className="hover:bg-off-white/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-brand-navy">
                          {platform.platform}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className="text-sm font-light text-brand-navy">
                          {formatCurrency(platform.spend)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="text-sm font-light text-brand-navy">
                          {formatNumber(platform.clicks)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="text-sm font-medium text-brand-gold">
                          {formatNumber(platform.conversions)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className="text-sm font-light text-brand-navy">
                          {formatCurrency(platform.cpc)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className={`text-sm font-semibold ${
                          platform.roi >= 2.5 ? 'text-brand-gold' :
                          platform.roi >= 1.5 ? 'text-brand-navy' :
                          'text-red-600'
                        }`}>
                          {platform.roi.toFixed(1)}x
                        </span>
                      </td>
                    </tr>
                  ))}

                  {/* Totals Row */}
                  <tr className="bg-brand-gold/5">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-xs font-semibold uppercase tracking-wider text-brand-navy">Total</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className="text-sm font-semibold text-brand-navy">
                        {formatCurrency(data.summary.totalSpend)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-sm font-semibold text-brand-navy">
                        {formatNumber(data.summary.totalClicks)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-sm font-semibold text-brand-gold">
                        {formatNumber(data.summary.totalConversions)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className="text-sm font-semibold text-brand-navy">
                        {formatCurrency(data.summary.totalSpend / data.summary.totalClicks)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className="text-sm font-bold text-brand-gold">
                        {data.summary.blendedRoi.toFixed(1)}x
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Additional Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-card p-8 rounded-2xl border border-border hover:border-brand-gold/30 transition-all">
              <h3 className="text-sm font-semibold text-brand-navy/60 uppercase tracking-wider mb-3">Cost Per Booking</h3>
              <div className="text-3xl font-bold text-brand-navy mb-2">
                {formatCurrency(data.summary.costPerBooking)}
              </div>
              <p className="text-xs font-light text-brand-navy/70">
                Average cost to acquire one booking through marketing
              </p>
            </div>

            <div className="bg-card p-8 rounded-2xl border border-border hover:border-brand-gold/30 transition-all">
              <h3 className="text-sm font-semibold text-brand-navy/60 uppercase tracking-wider mb-3">Direct Bookings</h3>
              <div className="text-3xl font-bold text-brand-gold mb-2">
                {formatNumber(data.summary.directBookings)}
              </div>
              <p className="text-xs font-light text-brand-navy/70">
                Estimated bookings directly attributed to marketing (30% attribution model)
              </p>
            </div>
          </div>

          {/* Trend Chart */}
          {data.trendData && data.trendData.length > 0 && (
            <div className="bg-card p-6 rounded-2xl border border-border">
              <h3 className="text-lg font-semibold text-brand-navy mb-6">30-Day Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e0" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' })}
                    style={{ fontSize: '12px', fill: '#28384d' }}
                  />
                  <YAxis style={{ fontSize: '12px', fill: '#28384d' }} />
                  <Tooltip
                    labelFormatter={(value) => new Date(value).toLocaleDateString('en-ZA')}
                    formatter={(value: number) => formatNumber(value)}
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e5e5e0',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Line type="monotone" dataKey="spend" stroke="#28384d" name="Spend" strokeWidth={2} />
                  <Line type="monotone" dataKey="clicks" stroke="#ffcc4e" name="Clicks" strokeWidth={2} />
                  <Line type="monotone" dataKey="conversions" stroke="#28384d" name="Conversions" strokeWidth={2.5} strokeDasharray="5 5" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* ROI Guidance */}
          <div className="bg-card border border-border p-8 rounded-2xl">
            <div className="flex items-start">
              <TrendingUp className="h-6 w-6 text-brand-gold mr-4 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-base font-semibold text-brand-navy mb-3">Understanding Your ROI</h3>
                <p className="text-brand-navy/80 text-sm font-light leading-relaxed mb-4">
                  ROI (Return on Investment) shows how much revenue you generate for every rand spent on marketing.
                  A 3.0x ROI means you earn R3 for every R1 spent.
                </p>
                <div className="space-y-2.5">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-brand-gold rounded mr-3"></div>
                    <span className="text-brand-navy/80 text-sm font-light">2.5x or higher = Excellent</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-brand-navy rounded mr-3"></div>
                    <span className="text-brand-navy/80 text-sm font-light">1.5x - 2.5x = Good</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-red-500 rounded mr-3"></div>
                    <span className="text-brand-navy/80 text-sm font-light">Below 1.5x = Needs improvement</span>
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

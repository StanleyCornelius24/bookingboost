'use client'

import { useState, useEffect } from 'react'
import { Star, TrendingUp } from 'lucide-react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer
} from 'recharts'
import { ClientChannelsAnalysis } from '@/lib/client-channels-data'

export default function ClientChannelsPage() {
  const [data, setData] = useState<ClientChannelsAnalysis | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  useEffect(() => {
    // Set default to previous month and fetch data
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth(), 0)

    const formatDate = (date: Date) => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }

    const start = formatDate(monthStart)
    const end = formatDate(monthEnd)

    setStartDate(start)
    setEndDate(end)

    // Fetch data after setting dates
    const fetchInitialData = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/client/channels?startDate=${start}&endDate=${end}`)
        if (!response.ok) {
          throw new Error('Failed to fetch channels data')
        }

        const channelsData = await response.json()
        setData(channelsData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchInitialData()
  }, [])

  const fetchChannelsData = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/client/channels?startDate=${startDate}&endDate=${endDate}`)
      if (!response.ok) {
        throw new Error('Failed to fetch channels data')
      }

      const channelsData = await response.json()
      setData(channelsData)
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

  const CustomLabel = ({ cx, cy }: { cx: number; cy: number }) => {
    if (!data) return null

    return (
      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
        <tspan x={cx} y={cy - 10} className="text-3xl font-bold fill-gray-900">
          {data.summary.directPercentage.toFixed(0)}%
        </tspan>
        <tspan x={cx} y={cy + 15} className="text-lg fill-gray-600">
          Direct
        </tspan>
      </text>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-10 bg-soft-gray rounded-xl w-64 mb-4"></div>
          <div className="h-5 bg-soft-gray rounded-lg w-96"></div>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">OTA Performance</h1>
          <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl">
            <p className="font-medium">{error || 'Failed to load channels data'}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-brand-navy">OTA Performance</h1>
        <p className="text-brand-navy/60 mt-1 text-sm font-book">See where your bookings come from</p>
      </div>

      {/* Date Range Selector */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-soft-gray">
        <h3 className="text-base font-semibold text-brand-navy mb-3">Date Range</h3>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-2 text-sm border border-soft-gray rounded-lg focus:ring-2 focus:ring-brand-gold focus:border-transparent"
          />
          <span className="text-brand-navy/60 text-sm font-medium">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-2 text-sm border border-soft-gray rounded-lg focus:ring-2 focus:ring-brand-gold focus:border-transparent"
          />
          <button
            onClick={fetchChannelsData}
            disabled={loading}
            className="px-4 py-2 text-sm font-semibold bg-brand-gold text-brand-navy rounded-lg hover:bg-brand-gold/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Updating...' : 'Update'}
          </button>
        </div>
      </div>

      {/* Main Chart */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-soft-gray">
        <h2 className="text-lg font-bold text-brand-navy mb-5 text-center">Your Channel Breakdown</h2>
        <div className="flex flex-col items-center gap-4">
          <ResponsiveContainer width={400} height={400}>
            <PieChart>
              <Pie
                data={data.chartData}
                cx="50%"
                cy="50%"
                innerRadius={120}
                outerRadius={180}
                paddingAngle={2}
                dataKey="value"
              >
                {data.chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <CustomLabel cx={200} cy={200} />
            </PieChart>
          </ResponsiveContainer>

          {/* Legend */}
          <div className="flex flex-wrap justify-center gap-4 max-w-md">
            {data.chartData.map((entry, index) => (
              <div key={index} className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-sm"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-sm text-brand-navy font-medium">
                  {entry.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Simple Channels Table */}
      <div className="bg-white rounded-xl shadow-sm border border-soft-gray overflow-hidden">
        <div className="px-6 py-4 border-b border-soft-gray">
          <h3 className="text-lg font-bold text-brand-navy">Channel Details</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-off-white">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-brand-navy/60 uppercase tracking-wider">
                  Channel
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-brand-navy/60 uppercase tracking-wider">
                  Bookings
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-brand-navy/60 uppercase tracking-wider">
                  Revenue
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-brand-navy/60 uppercase tracking-wider">
                  Commission Paid
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-brand-navy/60 uppercase tracking-wider">
                  Avg Lead Time
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-brand-navy/60 uppercase tracking-wider">
                  Avg LOS
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-brand-navy/60 uppercase tracking-wider">
                  ADR
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-soft-gray">
              {data.channels.map((channel, index) => (
                <tr key={index} className={channel.isDirect ? 'bg-sage-green/10' : 'hover:bg-off-white transition-colors'}>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-lg mr-2">{channel.emoji}</span>
                      <span className={`text-sm ${channel.isDirect ? 'font-semibold text-forest-green' : 'text-brand-navy'}`}>
                        {channel.channel}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center">
                    <span className="text-sm text-brand-navy">
                      {formatNumber(channel.bookings)}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    <span className="text-sm font-medium text-brand-navy">
                      {formatCurrency(channel.revenue, data.currency)}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    <span className={`text-sm font-medium ${
                      channel.commissionPaid === 0 ? 'text-forest-green' : 'text-sunset-orange'
                    }`}>
                      {formatCurrency(channel.commissionPaid, data.currency)}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    <span className="text-sm text-brand-navy">
                      {channel.bookings > 0 ? channel.averageLeadTime.toFixed(0) : '-'}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    <span className="text-sm text-brand-navy">
                      {channel.bookings > 0 ? channel.averageLengthOfStay.toFixed(1) : '-'}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    <span className="text-sm font-medium text-brand-navy">
                      {channel.bookings > 0 ? formatCurrency(channel.adr, data.currency) : '-'}
                    </span>
                  </td>
                </tr>
              ))}

              {/* Totals Row */}
              <tr className="bg-brand-navy/5 font-bold border-t-2 border-brand-navy">
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="text-sm text-brand-navy">TOTAL / AVERAGE</span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-center">
                  <span className="text-sm text-brand-navy">
                    {formatNumber(data.channels.reduce((sum, ch) => sum + ch.bookings, 0))}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-right">
                  <span className="text-sm text-brand-navy">
                    {formatCurrency(data.channels.reduce((sum, ch) => sum + ch.revenue, 0), data.currency)}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-right">
                  <span className="text-sm text-sunset-orange">
                    {formatCurrency(data.summary.totalOtaCommissions, data.currency)}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-right">
                  <span className="text-sm text-brand-navy">
                    {(() => {
                      const totalBookings = data.channels.reduce((sum, ch) => sum + ch.bookings, 0)
                      const weightedLeadTime = data.channels.reduce((sum, ch) => sum + (ch.averageLeadTime * ch.bookings), 0)
                      return totalBookings > 0 ? (weightedLeadTime / totalBookings).toFixed(0) : '-'
                    })()}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-right">
                  <span className="text-sm text-brand-navy">
                    {(() => {
                      const totalBookings = data.channels.reduce((sum, ch) => sum + ch.bookings, 0)
                      const weightedLOS = data.channels.reduce((sum, ch) => sum + (ch.averageLengthOfStay * ch.bookings), 0)
                      return totalBookings > 0 ? (weightedLOS / totalBookings).toFixed(1) : '-'
                    })()}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-right">
                  <span className="text-sm text-brand-navy">
                    {(() => {
                      const totalRevenue = data.channels.reduce((sum, ch) => sum + ch.revenue, 0)
                      const totalNights = data.channels.reduce((sum, ch) => sum + (ch.averageLengthOfStay * ch.bookings), 0)
                      return totalNights > 0 ? formatCurrency(totalRevenue / totalNights, data.currency) : '-'
                    })()}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-soft-gray text-center">
          <div className="text-2xl font-bold text-sunset-orange mb-1">
            {formatCurrency(data.summary.totalOtaCommissions, data.currency)}
          </div>
          <div className="text-xs font-semibold text-brand-navy/60 uppercase tracking-wider mb-0.5">Total OTA Commissions</div>
          <div className="text-xs text-brand-navy/50 font-book">Money paid to booking sites</div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-soft-gray text-center">
          <div className="text-2xl font-bold text-forest-green mb-1">
            {data.summary.directPercentage.toFixed(0)}%
          </div>
          <div className="text-xs font-semibold text-brand-navy/60 uppercase tracking-wider mb-0.5">Your Direct %</div>
          <div className="text-xs text-brand-navy/50 font-book">By number of bookings</div>
          <div className="text-xs text-brand-navy/40 mt-1 italic">
            (Revenue: {((data.channels.filter(ch => ch.isDirect).reduce((sum, ch) => sum + ch.revenue, 0) / data.channels.reduce((sum, ch) => sum + ch.revenue, 0)) * 100).toFixed(1)}%)
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-soft-gray text-center">
          <div className="text-sm text-brand-navy/70 mb-1 font-medium">
            Industry Average: {data.summary.industryAverage.min}-{data.summary.industryAverage.max}%
          </div>
          <div className="text-xs text-brand-navy/50 mb-2 italic font-book">
            Average across all BookingBoost clients
          </div>
          <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-tropical-aqua/10 text-tropical-teal">
            <Star className="h-3.5 w-3.5 mr-1" />
            {data.summary.performanceBadge}
          </div>
        </div>
      </div>

      {/* Performance Encouragement */}
      {data.summary.performanceRating === 'excellent' && (
        <div className="bg-forest-green/10 border border-forest-green/20 p-5 rounded-xl">
          <div className="flex items-center">
            <TrendingUp className="h-7 w-7 text-forest-green mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-forest-green mb-1.5">Excellent Performance!</h3>
              <p className="text-brand-navy text-sm font-book">
                Your direct booking rate is outstanding! You're saving significant money on commissions
                and building stronger guest relationships.
              </p>
            </div>
          </div>
        </div>
      )}

      {data.summary.performanceRating === 'below-average' && (
        <div className="bg-sunset-orange/10 border border-sunset-orange/20 p-5 rounded-xl">
          <div className="flex items-center">
            <TrendingUp className="h-7 w-7 text-sunset-orange mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-sunset-orange mb-1.5">Opportunity to Save Money</h3>
              <p className="text-brand-navy text-sm font-book">
                Increasing your direct bookings could save you thousands in commission fees.
                Consider improving your website booking experience and offering direct booking incentives.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
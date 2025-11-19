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
    // Set default to current month
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    setStartDate(monthStart.toISOString().split('T')[0])
    setEndDate(monthEnd.toISOString().split('T')[0])
  }, [])

  useEffect(() => {
    if (startDate && endDate) {
      fetchChannelsData()
    }
  }, [startDate, endDate])

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

  const renderCustomizedLabel = (props: any) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, name } = props
    const RADIAN = Math.PI / 180
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="text-sm font-bold"
        style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}
      >
        {name}
      </text>
    )
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-96"></div>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Booking Channels</h1>
          <p className="text-red-600">{error || 'Failed to load channels data'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Booking Channels</h1>
        <p className="text-gray-600 mt-2 text-lg">See where your bookings come from</p>
      </div>

      {/* Date Range Selector */}
      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Date Range</h3>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <span className="text-gray-500 font-medium">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Main Chart */}
      <div className="bg-white p-8 rounded-xl shadow-sm border">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">Your Channel Breakdown</h2>
        <div className="flex justify-center">
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
                label={renderCustomizedLabel}
                labelLine={false}
              >
                {data.chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <CustomLabel cx={200} cy={200} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Simple Channels Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h3 className="text-xl font-semibold text-gray-900">Channel Details</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase">
                  Channel
                </th>
                <th className="px-6 py-4 text-center text-sm font-medium text-gray-500 uppercase">
                  Bookings
                </th>
                <th className="px-6 py-4 text-right text-sm font-medium text-gray-500 uppercase">
                  Revenue
                </th>
                <th className="px-6 py-4 text-right text-sm font-medium text-gray-500 uppercase">
                  Commission Paid
                </th>
                <th className="px-6 py-4 text-right text-sm font-medium text-gray-500 uppercase">
                  Avg Lead Time (days)
                </th>
                <th className="px-6 py-4 text-right text-sm font-medium text-gray-500 uppercase">
                  Avg Length of Stay
                </th>
                <th className="px-6 py-4 text-right text-sm font-medium text-gray-500 uppercase">
                  ADR
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.channels.map((channel, index) => (
                <tr key={index} className={channel.isDirect ? 'bg-green-50' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">{channel.emoji}</span>
                      <span className={`text-lg ${channel.isDirect ? 'font-semibold text-green-800' : 'text-gray-900'}`}>
                        {channel.channel}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="text-lg text-gray-900">
                      {formatNumber(channel.bookings)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <span className="text-lg font-medium text-gray-900">
                      {formatCurrency(channel.revenue, data.currency)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <span className={`text-lg font-medium ${
                      channel.commissionPaid === 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(channel.commissionPaid, data.currency)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <span className="text-lg text-gray-900">
                      {channel.bookings > 0 ? channel.averageLeadTime.toFixed(0) : '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <span className="text-lg text-gray-900">
                      {channel.bookings > 0 ? channel.averageLengthOfStay.toFixed(1) : '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <span className="text-lg font-medium text-gray-900">
                      {channel.bookings > 0 ? formatCurrency(channel.adr, data.currency) : '-'}
                    </span>
                  </td>
                </tr>
              ))}

              {/* Totals Row */}
              <tr className="bg-gray-100 font-bold">
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-lg text-gray-900">TOTAL / AVERAGE</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <span className="text-lg text-gray-900">
                    {formatNumber(data.channels.reduce((sum, ch) => sum + ch.bookings, 0))}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <span className="text-lg text-gray-900">
                    {formatCurrency(data.channels.reduce((sum, ch) => sum + ch.revenue, 0), data.currency)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <span className="text-lg text-red-600">
                    {formatCurrency(data.summary.totalOtaCommissions, data.currency)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <span className="text-lg text-gray-900">
                    {(() => {
                      const totalBookings = data.channels.reduce((sum, ch) => sum + ch.bookings, 0)
                      const weightedLeadTime = data.channels.reduce((sum, ch) => sum + (ch.averageLeadTime * ch.bookings), 0)
                      return totalBookings > 0 ? (weightedLeadTime / totalBookings).toFixed(0) : '-'
                    })()}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <span className="text-lg text-gray-900">
                    {(() => {
                      const totalBookings = data.channels.reduce((sum, ch) => sum + ch.bookings, 0)
                      const weightedLOS = data.channels.reduce((sum, ch) => sum + (ch.averageLengthOfStay * ch.bookings), 0)
                      return totalBookings > 0 ? (weightedLOS / totalBookings).toFixed(1) : '-'
                    })()}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <span className="text-lg text-gray-900">
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border text-center">
          <div className="text-3xl font-bold text-red-600 mb-2">
            {formatCurrency(data.summary.totalOtaCommissions, data.currency)}
          </div>
          <div className="text-sm text-gray-600 mb-1">Total OTA Commissions</div>
          <div className="text-xs text-gray-500">Money paid to booking sites</div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border text-center">
          <div className="text-3xl font-bold text-green-600 mb-2">
            {data.summary.directPercentage.toFixed(0)}%
          </div>
          <div className="text-sm text-gray-600 mb-1">Your Direct %</div>
          <div className="text-xs text-gray-500">By number of bookings</div>
          <div className="text-xs text-gray-400 mt-1 italic">
            (Revenue: {((data.channels.filter(ch => ch.isDirect).reduce((sum, ch) => sum + ch.revenue, 0) / data.channels.reduce((sum, ch) => sum + ch.revenue, 0)) * 100).toFixed(1)}%)
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border text-center">
          <div className="text-lg text-gray-600 mb-2">
            Industry Average: {data.summary.industryAverage.min}-{data.summary.industryAverage.max}%
          </div>
          <div className="text-xs text-gray-500 mb-3 italic">
            Average across all BookingBoost clients
          </div>
          <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
            <Star className="h-4 w-4 mr-1" />
            {data.summary.performanceBadge}
          </div>
        </div>
      </div>

      {/* Performance Encouragement */}
      {data.summary.performanceRating === 'excellent' && (
        <div className="bg-green-50 border border-green-200 p-6 rounded-xl">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-green-600 mr-4" />
            <div>
              <h3 className="text-xl font-semibold text-green-900 mb-2">Excellent Performance! 🎉</h3>
              <p className="text-green-800 text-lg">
                Your direct booking rate is outstanding! You're saving significant money on commissions
                and building stronger guest relationships.
              </p>
            </div>
          </div>
        </div>
      )}

      {data.summary.performanceRating === 'below-average' && (
        <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-xl">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-yellow-600 mr-4" />
            <div>
              <h3 className="text-xl font-semibold text-yellow-900 mb-2">Opportunity to Save Money 💡</h3>
              <p className="text-yellow-800 text-lg">
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
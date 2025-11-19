'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Calendar,
  Filter,
  BarChart3,
  CreditCard,
  Eye
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { ChannelAnalysisData, ChannelAnalysis, calculateCommissionBleed } from '@/lib/channel-analysis'

interface SortConfig {
  key: keyof ChannelAnalysis
  direction: 'asc' | 'desc'
}

export default function ChannelsPage() {
  const params = useParams()
  const router = useRouter()
  const hotelId = params.hotelId as string

  const [data, setData] = useState<ChannelAnalysisData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'totalRevenue', direction: 'desc' })
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  useEffect(() => {
    // Set default date range to current month
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    setStartDate(startOfMonth.toISOString().split('T')[0])
    setEndDate(endOfMonth.toISOString().split('T')[0])
  }, [])

  useEffect(() => {
    if (startDate && endDate) {
      fetchChannelData()
    }
  }, [hotelId, startDate, endDate])

  const fetchChannelData = async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (startDate) params.set('startDate', startDate)
      if (endDate) params.set('endDate', endDate)

      const response = await fetch(`/api/agency/clients/${hotelId}/channels?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Failed to fetch channel data')
      }

      const channelData = await response.json()
      setData(channelData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const handleSort = (key: keyof ChannelAnalysis) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const sortedChannels = data?.channels.sort((a, b) => {
    const aValue = a[sortConfig.key]
    const bValue = b[sortConfig.key]

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortConfig.direction === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue)
    }

    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortConfig.direction === 'asc'
        ? aValue - bValue
        : bValue - aValue
    }

    return 0
  })

  const formatCurrency = (amount: number, currency: string = 'ZAR') => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: currency
    }).format(amount)
  }

  const formatPercentage = (value: number) => `${value.toFixed(1)}%`

  const getSortIcon = (key: keyof ChannelAnalysis) => {
    if (sortConfig.key !== key) return null
    return sortConfig.direction === 'asc' ? '↑' : '↓'
  }

  const commissionBleed = data ? calculateCommissionBleed(data.channels) : null

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center">
          <button
            onClick={() => router.back()}
            className="mr-4 p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Loading...</h1>
          </div>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="space-y-8">
        <div className="flex items-center">
          <button
            onClick={() => router.back()}
            className="mr-4 p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Error</h1>
            <p className="text-red-600">{error || 'Failed to load channel data'}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={() => router.back()}
            className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Channel Analysis</h1>
            <p className="text-gray-600">Detailed breakdown by booking channel</p>
          </div>
        </div>

        {/* Date Range Filters */}
        <div className="flex items-center space-x-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={fetchChannelData}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
            >
              <Filter className="h-4 w-4 mr-2" />
              Apply
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <BarChart3 className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Bookings</p>
              <p className="text-2xl font-bold text-gray-900">{data.summary.totalBookings}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm text-gray-600">Gross Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(data.summary.totalRevenue)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <CreditCard className="h-8 w-8 text-red-600" />
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Commissions</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(data.summary.totalCommissions)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <Eye className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm text-gray-600">Net Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(data.summary.totalNetRevenue)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Commission Bleed Alert */}
      {commissionBleed && commissionBleed.percentageLost > 15 && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-red-600 mr-3 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-red-900">High Commission Bleed Alert</h3>
              <p className="text-sm text-red-800 mt-1">
                You're losing {formatPercentage(commissionBleed.percentageLost)} of revenue ({formatCurrency(commissionBleed.totalLost)}) to commissions.
                Consider focusing on direct bookings to improve profitability.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Revenue vs Commission Chart */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue vs Commission by Channel</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={data.chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="channel"
              angle={-45}
              textAnchor="end"
              height={80}
              interval={0}
            />
            <YAxis />
            <Tooltip
              formatter={(value: number) => [formatCurrency(value), '']}
              labelFormatter={(label) => `Channel: ${label}`}
            />
            <Legend />
            <Bar
              dataKey="grossRevenue"
              stackId="a"
              fill="#3B82F6"
              name="Gross Revenue"
            />
            <Bar
              dataKey="commission"
              stackId="b"
              fill="#EF4444"
              name="Commission"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Commission Bleed Analysis */}
      {commissionBleed && (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Commission Bleed Analysis</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-red-600">
                {formatCurrency(commissionBleed.totalLost)}
              </p>
              <p className="text-sm text-gray-600">Total Lost to Commissions</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-red-600">
                {formatPercentage(commissionBleed.percentageLost)}
              </p>
              <p className="text-sm text-gray-600">Percentage of Revenue</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">
                {formatCurrency(data.summary.totalNetRevenue)}
              </p>
              <p className="text-sm text-gray-600">Net Revenue Retained</p>
            </div>
          </div>

          {commissionBleed.biggestOffenders.length > 0 && (
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-3">Biggest Commission Offenders</h4>
              <div className="space-y-2">
                {commissionBleed.biggestOffenders.map((offender, index) => (
                  <div key={offender.channel} className="flex justify-between items-center p-3 bg-red-50 rounded">
                    <span className="text-sm font-medium text-gray-900">
                      {index + 1}. {offender.channel}
                    </span>
                    <div className="text-right">
                      <p className="text-sm font-bold text-red-600">
                        {formatCurrency(offender.amount)}
                      </p>
                      <p className="text-xs text-gray-600">
                        {formatPercentage(offender.percentage)} commission rate
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Detailed Channels Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Channel Performance Details</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('channel')}
                >
                  Channel {getSortIcon('channel')}
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('bookingsCount')}
                >
                  Bookings {getSortIcon('bookingsCount')}
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('totalRevenue')}
                >
                  Revenue {getSortIcon('totalRevenue')}
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('percentageOfTotal')}
                >
                  % of Total {getSortIcon('percentageOfTotal')}
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('commissionRate')}
                >
                  Commission Rate {getSortIcon('commissionRate')}
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('commissionPaid')}
                >
                  Commission Paid {getSortIcon('commissionPaid')}
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('netRevenue')}
                >
                  Net Revenue {getSortIcon('netRevenue')}
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('avgBookingValue')}
                >
                  Avg Booking {getSortIcon('avgBookingValue')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sortedChannels?.map((channel) => (
                <tr key={channel.channel} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900">{channel.channel}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">{channel.bookingsCount}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">
                      {formatCurrency(channel.totalRevenue)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">
                      {formatPercentage(channel.percentageOfTotal)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm ${channel.commissionRate === 0 ? 'text-green-600 font-semibold' : 'text-gray-900'}`}>
                      {formatPercentage(channel.commissionRate * 100)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm ${channel.commissionPaid === 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(channel.commissionPaid)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900">
                      {formatCurrency(channel.netRevenue)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">
                      {formatCurrency(channel.avgBookingValue)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
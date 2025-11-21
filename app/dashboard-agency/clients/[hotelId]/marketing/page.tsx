'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  DollarSign,
  TrendingUp,
  Users,
  Target,
  Filter,
  Settings,
  AlertCircle,
  ExternalLink
} from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { MarketingAnalysisData } from '@/lib/marketing-analysis-types'
import { formatCurrency, formatPercentage, formatNumber } from '@/lib/marketing-analysis-client'

export default function MarketingPage() {
  const params = useParams()
  const router = useRouter()
  const hotelId = params.hotelId as string

  const [data, setData] = useState<MarketingAnalysisData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  useEffect(() => {
    // Set default date range to last 30 days
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000))

    setStartDate(thirtyDaysAgo.toISOString().split('T')[0])
    setEndDate(now.toISOString().split('T')[0])
  }, [])

  useEffect(() => {
    if (startDate && endDate) {
      fetchMarketingData()
    }
  }, [hotelId, startDate, endDate])

  const fetchMarketingData = async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (startDate) params.set('startDate', startDate)
      if (endDate) params.set('endDate', endDate)

      const response = await fetch(`/api/agency/clients/${hotelId}/marketing?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Failed to fetch marketing data')
      }

      const marketingData = await response.json()
      setData(marketingData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const formatTrendDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' })
  }

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
            <p className="text-red-600">{error || 'Failed to load marketing data'}</p>
          </div>
        </div>
      </div>
    )
  }

  // No marketing data state
  if (!data.hasData) {
    return (
      <div className="space-y-8">
        <div className="flex items-center">
          <button
            onClick={() => router.back()}
            className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Marketing Analytics</h1>
            <p className="text-gray-600">Track marketing performance and ROI</p>
          </div>
        </div>

        {/* No Data State */}
        <div className="bg-white p-12 rounded-lg shadow-sm border text-center">
          <div className="flex justify-center mb-4">
            <AlertCircle className="h-16 w-16 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Marketing Data Yet</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Connect your Google Ads and Meta Ads accounts to start tracking marketing performance and ROI.
          </p>
          <button
            onClick={() => router.push(`/dashboard-agency/settings`)}
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Settings className="h-5 w-5 mr-2" />
            Connect Marketing Accounts
          </button>
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
            <h1 className="text-3xl font-bold text-gray-900">Marketing Analytics</h1>
            <p className="text-gray-600">Track marketing performance and ROI</p>
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
              onClick={fetchMarketingData}
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
            <DollarSign className="h-8 w-8 text-red-600" />
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Marketing Spend</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(data.summary.totalSpend)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm text-gray-600">Blended ROI</p>
              <p className="text-2xl font-bold text-gray-900">
                {data.summary.blendedRoi.toFixed(2)}x
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <Target className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm text-gray-600">Cost Per Booking</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(data.summary.costPerBooking)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm text-gray-600">Direct Bookings</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(data.summary.directBookings)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Marketing Trends Chart */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Marketing Performance Trends</h3>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={data.trendData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickFormatter={formatTrendDate}
            />
            <YAxis yAxisId="spend" orientation="left" />
            <YAxis yAxisId="count" orientation="right" />
            <Tooltip
              labelFormatter={(label) => `Date: ${formatTrendDate(label)}`}
              formatter={(value: number, name: string) => {
                if (name === 'Spend') return [formatCurrency(value), name]
                return [formatNumber(value), name]
              }}
            />
            <Legend />
            <Line
              yAxisId="spend"
              type="monotone"
              dataKey="spend"
              stroke="#EF4444"
              strokeWidth={2}
              name="Spend"
            />
            <Line
              yAxisId="count"
              type="monotone"
              dataKey="clicks"
              stroke="#3B82F6"
              strokeWidth={2}
              name="Clicks"
            />
            <Line
              yAxisId="count"
              type="monotone"
              dataKey="conversions"
              stroke="#10B981"
              strokeWidth={2}
              name="Conversions"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Platform Performance Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Platform Performance</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Platform
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Spend
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Clicks
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  CPC
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Conversions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ROI
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.platforms.map((platform) => (
                <tr key={platform.platform} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-900">{platform.platform}</span>
                      {platform.platform !== 'Email Marketing' && (
                        <ExternalLink className="h-4 w-4 ml-2 text-gray-400" />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">
                      {formatCurrency(platform.spend)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">
                      {formatNumber(platform.clicks)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">
                      {formatCurrency(platform.cpc)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">
                      {formatNumber(platform.conversions)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-medium ${
                      platform.roi >= 3 ? 'text-green-600' :
                      platform.roi >= 2 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {platform.roi.toFixed(2)}x
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button className="text-sm text-blue-600 hover:text-blue-800">
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Performance Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Insights</h3>
          <div className="space-y-3">
            {data.summary.blendedRoi >= 3 && (
              <div className="flex items-start p-3 bg-green-50 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600 mr-3 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-900">Strong ROI Performance</p>
                  <p className="text-sm text-green-700">Your blended ROI of {data.summary.blendedRoi.toFixed(2)}x is excellent!</p>
                </div>
              </div>
            )}

            {data.summary.costPerBooking < 100 && (
              <div className="flex items-start p-3 bg-blue-50 rounded-lg">
                <Target className="h-5 w-5 text-blue-600 mr-3 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900">Efficient Cost Per Booking</p>
                  <p className="text-sm text-blue-700">Cost per booking of {formatCurrency(data.summary.costPerBooking)} is competitive.</p>
                </div>
              </div>
            )}

            {data.platforms.some(p => p.roi < 2) && (
              <div className="flex items-start p-3 bg-yellow-50 rounded-lg">
                <AlertCircle className="h-5 w-5 text-yellow-600 mr-3 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-900">Low ROI Alert</p>
                  <p className="text-sm text-yellow-700">Some platforms have ROI below 2x. Consider optimization.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Metrics Summary</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Clicks</span>
              <span className="text-sm font-medium text-gray-900">
                {formatNumber(data.summary.totalClicks)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Conversions</span>
              <span className="text-sm font-medium text-gray-900">
                {formatNumber(data.summary.totalConversions)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Conversion Rate</span>
              <span className="text-sm font-medium text-gray-900">
                {data.summary.totalClicks > 0
                  ? formatPercentage((data.summary.totalConversions / data.summary.totalClicks) * 100)
                  : '0%'
                }
              </span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t">
              <span className="text-sm font-medium text-gray-900">Overall Performance</span>
              <span className={`text-sm font-bold ${
                data.summary.blendedRoi >= 3 ? 'text-green-600' :
                data.summary.blendedRoi >= 2 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {data.summary.blendedRoi >= 3 ? 'Excellent' :
                 data.summary.blendedRoi >= 2 ? 'Good' : 'Needs Work'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
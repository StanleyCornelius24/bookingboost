'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Target, DollarSign } from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea
} from 'recharts'

interface MonthData {
  revenue: number
  directPercentage: number
  otaCommissions: number
  bookings: number
}

interface ProgressData {
  threeMonthsAgo: MonthData
  lastMonth: MonthData
  thisMonth: MonthData
  historicalData: Array<{
    month: string
    directPercentage: number
  }>
  currency: string
}

export default function ClientProgressPage() {
  const [data, setData] = useState<ProgressData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasData, setHasData] = useState(true)

  useEffect(() => {
    fetchProgressData()
  }, [])

  const fetchProgressData = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/client/progress')
      if (!response.ok) {
        throw new Error('Failed to fetch progress data')
      }

      const progressData = await response.json()

      // Check if there's actual data
      if (progressData.hasData === false) {
        setHasData(false)
        setData(null)
      } else {
        setHasData(true)
        setData(progressData)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load progress data')
      setHasData(false)
    } finally {
      setLoading(false)
    }
  }

  const getMockProgressData = (): ProgressData => {
    return {
      threeMonthsAgo: {
        revenue: 285000,
        directPercentage: 48,
        otaCommissions: 42300,
        bookings: 142
      },
      lastMonth: {
        revenue: 312000,
        directPercentage: 58,
        otaCommissions: 36800,
        bookings: 156
      },
      thisMonth: {
        revenue: 345000,
        directPercentage: 67,
        otaCommissions: 29500,
        bookings: 168
      },
      historicalData: [
        { month: 'Jul', directPercentage: 45 },
        { month: 'Aug', directPercentage: 48 },
        { month: 'Sep', directPercentage: 52 },
        { month: 'Oct', directPercentage: 58 },
        { month: 'Nov', directPercentage: 63 },
        { month: 'Dec', directPercentage: 67 }
      ],
      currency: 'ZAR'
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

  const calculateChange = (current: number, previous: number) => {
    return current - previous
  }

  const calculatePercentageChange = (current: number, previous: number) => {
    if (previous === 0) return 0
    return ((current - previous) / previous) * 100
  }

  const getTrendArrow = (change: number, isCommission: boolean = false) => {
    // For commissions, down is good (green), up is bad (red)
    // For everything else, up is good (green), down is bad (red)
    if (isCommission) {
      if (change < 0) return '📉'
      if (change > 0) return '📈'
      return '➡️'
    } else {
      if (change > 0) return '📈'
      if (change < 0) return '📉'
      return '➡️'
    }
  }

  const getChangeColor = (change: number, isCommission: boolean = false) => {
    // For commissions, down is good (green), up is bad (red)
    if (isCommission) {
      if (change < 0) return 'text-green-600'
      if (change > 0) return 'text-red-600'
      return 'text-gray-600'
    } else {
      if (change > 0) return 'text-green-600'
      if (change < 0) return 'text-red-600'
      return 'text-gray-600'
    }
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

  if (!loading && (!hasData || !data)) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Your Progress</h1>
          <p className="mt-2 text-gray-600">Track your improvements over time</p>
        </div>

        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-12 text-center">
          <div className="max-w-2xl mx-auto">
            <Target className="h-16 w-16 text-blue-600 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-4">No Data Yet</h3>
            <p className="text-lg text-gray-700 mb-6">
              Upload your booking data to start tracking your progress and see how your direct bookings improve over time.
            </p>
            <a
              href="/dashboard-client/upload"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Upload Booking Data
            </a>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">{error}</p>
          </div>
        )}
      </div>
    )
  }

  // Guard to ensure data exists (TypeScript safety)
  if (!data) {
    return null
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Your Progress</h1>
        <p className="text-gray-600 mt-2 text-lg">Track your improvements over time</p>
      </div>

      {/* Comparison Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h3 className="text-xl font-semibold text-gray-900">3-Month Comparison</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase">
                  Metric
                </th>
                <th className="px-6 py-4 text-center text-sm font-medium text-gray-500 uppercase">
                  3 Months Ago
                </th>
                <th className="px-6 py-4 text-center text-sm font-medium text-gray-500 uppercase">
                  Last Month
                </th>
                <th className="px-6 py-4 text-center text-sm font-medium text-gray-500 uppercase">
                  This Month
                </th>
                <th className="px-6 py-4 text-center text-sm font-medium text-gray-500 uppercase">
                  Change
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {/* Revenue Row */}
              <tr>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <DollarSign className="h-5 w-5 text-blue-600 mr-2" />
                    <span className="text-lg font-medium text-gray-900">Revenue</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-lg text-gray-900">
                  {formatCurrency(data.threeMonthsAgo.revenue, data.currency)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-lg text-gray-900">
                  {formatCurrency(data.lastMonth.revenue, data.currency)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-lg font-semibold text-gray-900">
                  {formatCurrency(data.thisMonth.revenue, data.currency)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <div className="flex items-center justify-center space-x-2">
                    <span className="text-2xl">
                      {getTrendArrow(calculateChange(data.thisMonth.revenue, data.threeMonthsAgo.revenue))}
                    </span>
                    <span className={`text-lg font-bold ${getChangeColor(calculateChange(data.thisMonth.revenue, data.threeMonthsAgo.revenue))}`}>
                      {calculatePercentageChange(data.thisMonth.revenue, data.threeMonthsAgo.revenue).toFixed(1)}%
                    </span>
                  </div>
                </td>
              </tr>

              {/* Direct % Row */}
              <tr className="bg-green-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Target className="h-5 w-5 text-green-600 mr-2" />
                    <span className="text-lg font-medium text-gray-900">Direct %</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-lg text-gray-900">
                  {data.threeMonthsAgo.directPercentage}%
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-lg text-gray-900">
                  {data.lastMonth.directPercentage}%
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-lg font-semibold text-green-700">
                  {data.thisMonth.directPercentage}%
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <div className="flex items-center justify-center space-x-2">
                    <span className="text-2xl">
                      {getTrendArrow(calculateChange(data.thisMonth.directPercentage, data.threeMonthsAgo.directPercentage))}
                    </span>
                    <span className={`text-lg font-bold ${getChangeColor(calculateChange(data.thisMonth.directPercentage, data.threeMonthsAgo.directPercentage))}`}>
                      +{calculateChange(data.thisMonth.directPercentage, data.threeMonthsAgo.directPercentage)} pts
                    </span>
                  </div>
                </td>
              </tr>

              {/* OTA Commissions Row */}
              <tr>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <TrendingDown className="h-5 w-5 text-red-600 mr-2" />
                    <span className="text-lg font-medium text-gray-900">OTA Commissions</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-lg text-gray-900">
                  {formatCurrency(data.threeMonthsAgo.otaCommissions, data.currency)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-lg text-gray-900">
                  {formatCurrency(data.lastMonth.otaCommissions, data.currency)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-lg font-semibold text-gray-900">
                  {formatCurrency(data.thisMonth.otaCommissions, data.currency)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <div className="flex items-center justify-center space-x-2">
                    <span className="text-2xl">
                      {getTrendArrow(calculateChange(data.thisMonth.otaCommissions, data.threeMonthsAgo.otaCommissions), true)}
                    </span>
                    <span className={`text-lg font-bold ${getChangeColor(calculateChange(data.thisMonth.otaCommissions, data.threeMonthsAgo.otaCommissions), true)}`}>
                      {calculatePercentageChange(data.thisMonth.otaCommissions, data.threeMonthsAgo.otaCommissions).toFixed(1)}%
                    </span>
                  </div>
                </td>
              </tr>

              {/* Bookings Row */}
              <tr>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <TrendingUp className="h-5 w-5 text-purple-600 mr-2" />
                    <span className="text-lg font-medium text-gray-900">Bookings</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-lg text-gray-900">
                  {formatNumber(data.threeMonthsAgo.bookings)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-lg text-gray-900">
                  {formatNumber(data.lastMonth.bookings)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-lg font-semibold text-gray-900">
                  {formatNumber(data.thisMonth.bookings)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <div className="flex items-center justify-center space-x-2">
                    <span className="text-2xl">
                      {getTrendArrow(calculateChange(data.thisMonth.bookings, data.threeMonthsAgo.bookings))}
                    </span>
                    <span className={`text-lg font-bold ${getChangeColor(calculateChange(data.thisMonth.bookings, data.threeMonthsAgo.bookings))}`}>
                      {calculatePercentageChange(data.thisMonth.bookings, data.threeMonthsAgo.bookings).toFixed(1)}%
                    </span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Direct Booking % Chart */}
      <div className="bg-white p-8 rounded-xl shadow-sm border">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Direct Booking % Progress</h3>
        <p className="text-gray-600 mb-6">Last 6 months - Target: 70%</p>

        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={data.historicalData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="month"
              axisLine={{ stroke: '#9ca3af' }}
              tick={{ fontSize: 14, fill: '#6b7280' }}
            />
            <YAxis
              domain={[0, 100]}
              axisLine={{ stroke: '#9ca3af' }}
              tick={{ fontSize: 14, fill: '#6b7280' }}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip
              formatter={(value: number) => [`${value}%`, 'Direct %']}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                fontSize: '16px'
              }}
            />

            {/* Shaded "good zone" above 60% */}
            <ReferenceArea
              y1={60}
              y2={100}
              fill="#10b981"
              fillOpacity={0.1}
              label={{ value: 'Good Zone', position: 'insideTopRight', fill: '#059669', fontSize: 14 }}
            />

            {/* Reference line at 70% target */}
            <ReferenceLine
              y={70}
              stroke="#10b981"
              strokeWidth={2}
              strokeDasharray="5 5"
              label={{ value: 'Target: 70%', position: 'right', fill: '#059669', fontSize: 14, fontWeight: 'bold' }}
            />

            {/* Main data line */}
            <Line
              type="monotone"
              dataKey="directPercentage"
              stroke="#3b82f6"
              strokeWidth={4}
              dot={{ fill: '#3b82f6', r: 6 }}
              activeDot={{ r: 8 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Performance Summary */}
      {data.thisMonth.directPercentage >= 70 && (
        <div className="bg-green-50 border border-green-200 p-6 rounded-xl">
          <div className="flex items-center">
            <Target className="h-8 w-8 text-green-600 mr-4" />
            <div>
              <h3 className="text-xl font-semibold text-green-900 mb-2">🎉 Target Achieved!</h3>
              <p className="text-green-800 text-lg">
                Congratulations! You've reached the 70% direct booking target. Keep up the excellent work!
              </p>
            </div>
          </div>
        </div>
      )}

      {data.thisMonth.directPercentage >= 60 && data.thisMonth.directPercentage < 70 && (
        <div className="bg-blue-50 border border-blue-200 p-6 rounded-xl">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-blue-600 mr-4" />
            <div>
              <h3 className="text-xl font-semibold text-blue-900 mb-2">Great Progress!</h3>
              <p className="text-blue-800 text-lg">
                You're in the good zone! Just {(70 - data.thisMonth.directPercentage).toFixed(0)} percentage points
                away from your 70% target. Keep investing in direct bookings!
              </p>
            </div>
          </div>
        </div>
      )}

      {data.thisMonth.directPercentage < 60 && (
        <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-xl">
          <div className="flex items-center">
            <Target className="h-8 w-8 text-yellow-600 mr-4" />
            <div>
              <h3 className="text-xl font-semibold text-yellow-900 mb-2">Room for Improvement</h3>
              <p className="text-yellow-800 text-lg">
                Focus on increasing your direct bookings to save more on commissions. Consider improving
                your website booking experience and offering direct booking incentives.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

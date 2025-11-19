'use client'

import { useState, useEffect } from 'react'
import { Calendar, TrendingUp, TrendingDown, DollarSign, Target } from 'lucide-react'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

interface PeriodData {
  totalRevenue: number
  directRevenue: number
  otaRevenue: number
  totalBookings: number
  directBookings: number
  otaBookings: number
  totalCommissions: number
  directPercentage: number
  monthlyData: Array<{
    month: string
    directRevenue: number
    otaRevenue: number
    directBookings: number
    otaBookings: number
    directPercentage: number
  }>
}

interface ComparisonData {
  periodA: PeriodData
  periodB: PeriodData
  currency: string
}

export default function AnalyticsPage() {
  const [data, setData] = useState<ComparisonData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Period A (current selection)
  const [periodAStart, setPeriodAStart] = useState('')
  const [periodAEnd, setPeriodAEnd] = useState('')

  // Period B (comparison period)
  const [periodBStart, setPeriodBStart] = useState('')
  const [periodBEnd, setPeriodBEnd] = useState('')

  useEffect(() => {
    // Set default dates: This Year vs Last Year
    const now = new Date()
    const thisYearStart = new Date(now.getFullYear(), 0, 1)
    const thisYearEnd = now
    const lastYearStart = new Date(now.getFullYear() - 1, 0, 1)
    const lastYearEnd = new Date(now.getFullYear() - 1, 11, 31)

    setPeriodAStart(formatDateForInput(thisYearStart))
    setPeriodAEnd(formatDateForInput(thisYearEnd))
    setPeriodBStart(formatDateForInput(lastYearStart))
    setPeriodBEnd(formatDateForInput(lastYearEnd))
  }, [])

  useEffect(() => {
    if (periodAStart && periodAEnd && periodBStart && periodBEnd) {
      fetchComparisonData()
    }
  }, [periodAStart, periodAEnd, periodBStart, periodBEnd])

  const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0]
  }

  const fetchComparisonData = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/client/analytics/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          periodA: { start: periodAStart, end: periodAEnd },
          periodB: { start: periodBStart, end: periodBEnd }
        })
      })

      if (!response.ok) {
        throw new Error('Failed to fetch comparison data')
      }

      const comparisonData = await response.json()
      setData(comparisonData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const setQuickPeriod = (type: string) => {
    const now = new Date()

    switch (type) {
      case 'this-vs-last-month':
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
        const thisMonthEnd = now
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)

        setPeriodAStart(formatDateForInput(thisMonthStart))
        setPeriodAEnd(formatDateForInput(thisMonthEnd))
        setPeriodBStart(formatDateForInput(lastMonthStart))
        setPeriodBEnd(formatDateForInput(lastMonthEnd))
        break

      case 'this-vs-last-year':
        const thisYearStart = new Date(now.getFullYear(), 0, 1)
        const thisYearEnd = now
        const lastYearStart = new Date(now.getFullYear() - 1, 0, 1)
        const lastYearEnd = new Date(now.getFullYear() - 1, 11, 31)

        setPeriodAStart(formatDateForInput(thisYearStart))
        setPeriodAEnd(formatDateForInput(thisYearEnd))
        setPeriodBStart(formatDateForInput(lastYearStart))
        setPeriodBEnd(formatDateForInput(lastYearEnd))
        break

      case 'ytd-comparison':
        const currentYTDStart = new Date(now.getFullYear(), 0, 1)
        const currentYTDEnd = now
        const lastYTDStart = new Date(now.getFullYear() - 1, 0, 1)
        const lastYTDEnd = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())

        setPeriodAStart(formatDateForInput(currentYTDStart))
        setPeriodAEnd(formatDateForInput(currentYTDEnd))
        setPeriodBStart(formatDateForInput(lastYTDStart))
        setPeriodBEnd(formatDateForInput(lastYTDEnd))
        break
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

  const calculateChange = (currentValue: number, previousValue: number) => {
    if (previousValue === 0) return { percentage: 0, isPositive: true }
    const change = ((currentValue - previousValue) / previousValue) * 100
    return { percentage: Math.abs(change), isPositive: change >= 0 }
  }

  const MetricCard = ({
    title,
    periodAValue,
    periodBValue,
    format = 'number',
    suffix = '',
    icon: Icon
  }: {
    title: string
    periodAValue: number
    periodBValue: number
    format?: 'number' | 'currency' | 'percentage'
    suffix?: string
    icon: any
  }) => {
    const change = calculateChange(periodAValue, periodBValue)

    const formatValue = (value: number) => {
      if (format === 'currency') return formatCurrency(value, data?.currency)
      if (format === 'percentage') return `${value.toFixed(1)}%`
      return value.toLocaleString()
    }

    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-600">{title}</h3>
          <Icon className="h-5 w-5 text-gray-400" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500 mb-1">Period A</p>
            <p className="text-2xl font-bold text-gray-900">{formatValue(periodAValue)}{suffix}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Period B</p>
            <p className="text-2xl font-bold text-gray-400">{formatValue(periodBValue)}{suffix}</p>
          </div>
        </div>

        <div className={`mt-3 flex items-center text-sm ${change.isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {change.isPositive ? (
            <TrendingUp className="h-4 w-4 mr-1" />
          ) : (
            <TrendingDown className="h-4 w-4 mr-1" />
          )}
          <span>{change.percentage.toFixed(1)}% {change.isPositive ? 'increase' : 'decrease'}</span>
        </div>
      </div>
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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Period Comparison</h1>
        <p className="text-gray-600 mt-2 text-lg">Compare booking performance across different time periods</p>
      </div>

      {/* Quick Period Selectors */}
      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Comparisons</h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setQuickPeriod('this-vs-last-month')}
            className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 font-medium"
          >
            This Month vs Last Month
          </button>
          <button
            onClick={() => setQuickPeriod('this-vs-last-year')}
            className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 font-medium"
          >
            This Year vs Last Year
          </button>
          <button
            onClick={() => setQuickPeriod('ytd-comparison')}
            className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 font-medium"
          >
            YTD Comparison
          </button>
        </div>
      </div>

      {/* Custom Date Range Selectors */}
      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Custom Date Ranges</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Period A */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Period A (Current)
            </label>
            <div className="flex gap-3">
              <input
                type="date"
                value={periodAStart}
                onChange={(e) => setPeriodAStart(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <span className="self-center text-gray-500">to</span>
              <input
                type="date"
                value={periodAEnd}
                onChange={(e) => setPeriodAEnd(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Period B */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Period B (Comparison)
            </label>
            <div className="flex gap-3">
              <input
                type="date"
                value={periodBStart}
                onChange={(e) => setPeriodBStart(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <span className="self-center text-gray-500">to</span>
              <input
                type="date"
                value={periodBEnd}
                onChange={(e) => setPeriodBEnd(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {data && (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              title="Total Revenue"
              periodAValue={data.periodA.totalRevenue}
              periodBValue={data.periodB.totalRevenue}
              format="currency"
              icon={DollarSign}
            />
            <MetricCard
              title="Direct Bookings %"
              periodAValue={data.periodA.directPercentage}
              periodBValue={data.periodB.directPercentage}
              format="percentage"
              icon={Target}
            />
            <MetricCard
              title="Total Bookings"
              periodAValue={data.periodA.totalBookings}
              periodBValue={data.periodB.totalBookings}
              icon={Calendar}
            />
            <MetricCard
              title="OTA Commissions"
              periodAValue={data.periodA.totalCommissions}
              periodBValue={data.periodB.totalCommissions}
              format="currency"
              icon={TrendingDown}
            />
          </div>

          {/* Revenue Comparison Chart */}
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Revenue: Direct vs OTA</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={[
                {
                  name: 'Period A',
                  Direct: data.periodA.directRevenue,
                  OTA: data.periodA.otaRevenue
                },
                {
                  name: 'Period B',
                  Direct: data.periodB.directRevenue,
                  OTA: data.periodB.otaRevenue
                }
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(value) => formatCurrency(value, data.currency)} />
                <Tooltip formatter={(value: number) => formatCurrency(value, data.currency)} />
                <Legend />
                <Bar dataKey="Direct" fill="#10B981" />
                <Bar dataKey="OTA" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Direct Booking % Trend */}
          {data.periodA.monthlyData.length > 0 && (
            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Direct Booking % Trend</h3>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={data.periodA.monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => `${value}%`} />
                  <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="directPercentage"
                    stroke="#10B981"
                    strokeWidth={3}
                    name="Direct Booking %"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Monthly Breakdown Table */}
          {data.periodA.monthlyData.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="px-6 py-4 border-b">
                <h3 className="text-xl font-semibold text-gray-900">Period A - Monthly Breakdown</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase">Month</th>
                      <th className="px-6 py-4 text-right text-sm font-medium text-gray-500 uppercase">Direct Revenue</th>
                      <th className="px-6 py-4 text-right text-sm font-medium text-gray-500 uppercase">OTA Revenue</th>
                      <th className="px-6 py-4 text-center text-sm font-medium text-gray-500 uppercase">Direct %</th>
                      <th className="px-6 py-4 text-center text-sm font-medium text-gray-500 uppercase">Direct Bookings</th>
                      <th className="px-6 py-4 text-center text-sm font-medium text-gray-500 uppercase">OTA Bookings</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {data.periodA.monthlyData.map((month, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-900 font-medium">{month.month}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-green-600 font-medium">
                          {formatCurrency(month.directRevenue, data.currency)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-blue-600 font-medium">
                          {formatCurrency(month.otaRevenue, data.currency)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            month.directPercentage >= 50 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {month.directPercentage.toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-gray-900">{month.directBookings}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-gray-900">{month.otaBookings}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

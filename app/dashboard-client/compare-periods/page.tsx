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

export default function ComparePeriodsPage() {
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
    // Set default dates: This Year vs Last Year (same date range)
    const now = new Date()
    const thisYearStart = new Date(now.getFullYear(), 0, 1)
    const thisYearEnd = now
    const lastYearStart = new Date(now.getFullYear() - 1, 0, 1)
    // Use the same date last year instead of December 31st
    const lastYearEnd = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())

    setPeriodAStart(formatDateForInput(thisYearStart))
    setPeriodAEnd(formatDateForInput(thisYearEnd))
    setPeriodBStart(formatDateForInput(lastYearStart))
    setPeriodBEnd(formatDateForInput(lastYearEnd))
  }, [])

  useEffect(() => {
    if (periodAStart && periodAEnd && periodBStart && periodBEnd) {
      fetchComparisonData()
    }
  }, [])

  const formatDateForInput = (date: Date) => {
    // Format date without timezone conversion
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
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

  const setQuickPeriod = async (type: string) => {
    const now = new Date()
    let periodAStartDate, periodAEndDate, periodBStartDate, periodBEndDate

    switch (type) {
      case 'last-vs-previous-month':
        // Last month (Period A)
        periodAStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        periodAEndDate = new Date(now.getFullYear(), now.getMonth(), 0)
        // Previous month (Period B)
        periodBStartDate = new Date(now.getFullYear(), now.getMonth() - 2, 1)
        periodBEndDate = new Date(now.getFullYear(), now.getMonth() - 1, 0)
        break

      case 'this-vs-last-year':
        periodAStartDate = new Date(now.getFullYear(), 0, 1)
        periodAEndDate = now
        periodBStartDate = new Date(now.getFullYear() - 1, 0, 1)
        // Use the same date last year instead of December 31st
        periodBEndDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
        break

      case 'ytd-comparison':
        periodAStartDate = new Date(now.getFullYear(), 0, 1)
        periodAEndDate = now
        periodBStartDate = new Date(now.getFullYear() - 1, 0, 1)
        periodBEndDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
        break

      default:
        return
    }

    // Set the dates
    const formattedAStart = formatDateForInput(periodAStartDate)
    const formattedAEnd = formatDateForInput(periodAEndDate)
    const formattedBStart = formatDateForInput(periodBStartDate)
    const formattedBEnd = formatDateForInput(periodBEndDate)

    setPeriodAStart(formattedAStart)
    setPeriodAEnd(formattedAEnd)
    setPeriodBStart(formattedBStart)
    setPeriodBEnd(formattedBEnd)

    // Immediately fetch with the new dates
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/client/analytics/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          periodA: { start: formattedAStart, end: formattedAEnd },
          periodB: { start: formattedBStart, end: formattedBEnd }
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
      <div className="bg-white p-4 rounded-xl shadow-sm border border-soft-gray">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[15px] font-semibold text-brand-navy/60 uppercase tracking-tight">{title}</h3>
          <Icon className="h-4 w-4 text-brand-navy/40" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-brand-navy/50 mb-1 font-book">Period A</p>
            <p className="text-xl font-bold text-brand-navy">{formatValue(periodAValue)}{suffix}</p>
          </div>
          <div>
            <p className="text-xs text-brand-navy/50 mb-1 font-book">Period B</p>
            <p className="text-xl font-semibold text-brand-navy/40">{formatValue(periodBValue)}{suffix}</p>
          </div>
        </div>

        <div className={`mt-2 flex items-center text-xs font-medium ${change.isPositive ? 'text-forest-green' : 'text-sunset-orange'}`}>
          {change.isPositive ? (
            <TrendingUp className="h-3.5 w-3.5 mr-1" />
          ) : (
            <TrendingDown className="h-3.5 w-3.5 mr-1" />
          )}
          <span>{change.percentage.toFixed(1)}% {change.isPositive ? 'increase' : 'decrease'}</span>
        </div>
      </div>
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-brand-navy">Compare Periods</h1>
        <p className="text-brand-navy/60 mt-1 text-sm font-book">Compare booking performance across different time periods</p>
      </div>

      {/* Quick Period Selectors */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-soft-gray">
        <h3 className="text-base font-semibold text-brand-navy mb-3">Quick Comparisons</h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setQuickPeriod('last-vs-previous-month')}
            className="px-3 py-2 text-sm bg-brand-gold/10 text-brand-navy rounded-lg hover:bg-brand-gold/20 transition-colors font-medium"
          >
            Last Month vs Previous Month
          </button>
          <button
            onClick={() => setQuickPeriod('this-vs-last-year')}
            className="px-3 py-2 text-sm bg-brand-gold/10 text-brand-navy rounded-lg hover:bg-brand-gold/20 transition-colors font-medium"
          >
            This Year vs Last Year
          </button>
          <button
            onClick={() => setQuickPeriod('ytd-comparison')}
            className="px-3 py-2 text-sm bg-brand-gold/10 text-brand-navy rounded-lg hover:bg-brand-gold/20 transition-colors font-medium"
          >
            YTD Comparison
          </button>
        </div>
      </div>

      {/* Custom Date Range Selectors */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-soft-gray">
        <h3 className="text-base font-semibold text-brand-navy mb-3">Custom Date Ranges</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Period A */}
          <div>
            <label className="block text-xs font-semibold text-brand-navy/60 uppercase tracking-wider mb-2">
              Period A (Current)
            </label>
            <div className="flex gap-2 items-center">
              <input
                type="date"
                value={periodAStart}
                onChange={(e) => setPeriodAStart(e.target.value)}
                className="flex-1 px-3 py-2 text-sm border border-soft-gray rounded-lg focus:ring-2 focus:ring-brand-gold focus:border-transparent"
              />
              <span className="text-brand-navy/60 text-sm font-medium">to</span>
              <input
                type="date"
                value={periodAEnd}
                onChange={(e) => setPeriodAEnd(e.target.value)}
                className="flex-1 px-3 py-2 text-sm border border-soft-gray rounded-lg focus:ring-2 focus:ring-brand-gold focus:border-transparent"
              />
            </div>
          </div>

          {/* Period B */}
          <div>
            <label className="block text-xs font-semibold text-brand-navy/60 uppercase tracking-wider mb-2">
              Period B (Comparison)
            </label>
            <div className="flex gap-2 items-center">
              <input
                type="date"
                value={periodBStart}
                onChange={(e) => setPeriodBStart(e.target.value)}
                className="flex-1 px-3 py-2 text-sm border border-soft-gray rounded-lg focus:ring-2 focus:ring-brand-gold focus:border-transparent"
              />
              <span className="text-brand-navy/60 text-sm font-medium">to</span>
              <input
                type="date"
                value={periodBEnd}
                onChange={(e) => setPeriodBEnd(e.target.value)}
                className="flex-1 px-3 py-2 text-sm border border-soft-gray rounded-lg focus:ring-2 focus:ring-brand-gold focus:border-transparent"
              />
            </div>
          </div>
        </div>
        <div className="mt-3">
          <button
            onClick={fetchComparisonData}
            disabled={loading}
            className="px-4 py-2 text-sm font-semibold bg-brand-gold text-brand-navy rounded-lg hover:bg-brand-gold/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Updating...' : 'Update Comparison'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-sunset-orange/10 border border-sunset-orange/20 rounded-xl p-4">
          <p className="text-sunset-orange text-sm font-medium">{error}</p>
        </div>
      )}

      {data && (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
          <div className="bg-white p-5 rounded-xl shadow-sm border border-soft-gray">
            <h3 className="text-lg font-bold text-brand-navy mb-4">Revenue: Direct vs OTA</h3>
            <ResponsiveContainer width="100%" height={350}>
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
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="name" tick={{ fill: '#1E3A5F', fontSize: 12 }} />
                <YAxis tickFormatter={(value) => formatCurrency(value, data.currency)} tick={{ fill: '#1E3A5F', fontSize: 12 }} />
                <Tooltip formatter={(value: number) => formatCurrency(value, data.currency)} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Direct" fill="#2D5F3F" />
                <Bar dataKey="OTA" fill="#E07B39" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Direct Booking % Trend */}
          {data.periodA.monthlyData.length > 0 && (
            <div className="bg-white p-5 rounded-xl shadow-sm border border-soft-gray">
              <h3 className="text-lg font-bold text-brand-navy mb-4">Direct Booking % Trend</h3>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={data.periodA.monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="month" tick={{ fill: '#1E3A5F', fontSize: 12 }} />
                  <YAxis tickFormatter={(value) => `${value}%`} tick={{ fill: '#1E3A5F', fontSize: 12 }} />
                  <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line
                    type="monotone"
                    dataKey="directPercentage"
                    stroke="#2D5F3F"
                    strokeWidth={3}
                    name="Direct Booking %"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Monthly Breakdown Table */}
          {data.periodA.monthlyData.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-soft-gray overflow-hidden">
              <div className="px-6 py-4 border-b border-soft-gray">
                <h3 className="text-lg font-bold text-brand-navy">Period A - Monthly Breakdown</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-off-white">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-brand-navy/60 uppercase tracking-wider">Month</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-brand-navy/60 uppercase tracking-wider">Direct Revenue</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-brand-navy/60 uppercase tracking-wider">OTA Revenue</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-brand-navy/60 uppercase tracking-wider">Direct %</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-brand-navy/60 uppercase tracking-wider">Direct Bookings</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-brand-navy/60 uppercase tracking-wider">OTA Bookings</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-soft-gray">
                    {data.periodA.monthlyData.map((month, index) => (
                      <tr key={index} className="hover:bg-off-white transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap text-brand-navy font-medium text-sm">{month.month}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-forest-green font-medium text-sm">
                          {formatCurrency(month.directRevenue, data.currency)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sunset-orange font-medium text-sm">
                          {formatCurrency(month.otaRevenue, data.currency)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            month.directPercentage >= 50 ? 'bg-forest-green/10 text-forest-green' : 'bg-brand-gold/20 text-brand-navy'
                          }`}>
                            {month.directPercentage.toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-center text-brand-navy text-sm">{month.directBookings}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-center text-brand-navy text-sm">{month.otaBookings}</td>
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

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Info,
  BarChart3
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts'
import { ClientDashboardData } from '@/lib/client-dashboard-data'

export default function ClientDashboardPage() {
  const router = useRouter()
  const [data, setData] = useState<ClientDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/client/dashboard')
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data')
      }

      const dashboardData = await response.json()
      setData(dashboardData)
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

  const CircularProgress = ({ percentage, goal }: { percentage: number; goal: number }) => {
    const radius = 40
    const strokeWidth = 7
    const normalizedRadius = radius - strokeWidth * 2
    const circumference = normalizedRadius * 2 * Math.PI
    const strokeDasharray = `${circumference} ${circumference}`
    const strokeDashoffset = circumference - (percentage / 100) * circumference

    return (
      <div className="relative w-24 h-24">
        <svg
          height={radius * 2}
          width={radius * 2}
          className="transform -rotate-90"
        >
          <circle
            stroke="#e5e5e0"
            fill="transparent"
            strokeWidth={strokeWidth}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          <circle
            stroke={percentage >= goal ? "#2d5f4d" : "#ffcc4e"}
            fill="transparent"
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDasharray}
            style={{ strokeDashoffset }}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold text-brand-navy">
            {percentage.toFixed(0)}%
          </span>
        </div>
      </div>
    )
  }

  const getInsightIcon = (type: 'success' | 'warning' | 'info') => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-forest-green" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-sunset-orange" />
      case 'info':
      default:
        return <Info className="h-5 w-5 text-tropical-teal" />
    }
  }

  const getInsightBgColor = (type: 'success' | 'warning' | 'info') => {
    switch (type) {
      case 'success':
        return 'bg-sage-green/10 border-sage-green/30'
      case 'warning':
        return 'bg-sunset-peach/10 border-sunset-orange/30'
      case 'info':
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

  if (error || !data) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">Dashboard Error</h1>
          <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl">
            <p className="font-medium">{error || 'Failed to load dashboard data'}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Compare Button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">Booking Performance</h1>
          <p className="text-brand-navy/60 mt-1 text-sm font-book">Track your revenue and booking trends</p>
        </div>
        <button
          onClick={() => router.push('/dashboard-client/compare-periods')}
          className="flex items-center px-4 py-2 text-sm font-semibold bg-brand-gold text-brand-navy rounded-lg hover:bg-brand-gold/90 transition-colors shadow-sm"
        >
          <BarChart3 className="h-4 w-4 mr-2" />
          Compare Periods
        </button>
      </div>

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-brand-navy via-brand-navy to-ocean-blue rounded-2xl p-6 md:p-8 text-white shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex-1">
            <p className="text-brand-gold text-xs font-semibold uppercase tracking-wider mb-2">Last Month</p>
            <h1 className="text-3xl md:text-4xl font-bold mb-2 tracking-tight !text-white">
              {formatCurrency(data.hero.thisMonthRevenue, data.hero.currency)}
            </h1>
            <div className="flex items-center space-x-2">
              {data.hero.percentageChange >= 0 ? (
                <TrendingUp className="h-5 w-5 text-brand-gold" />
              ) : (
                <TrendingDown className="h-5 w-5 text-brand-gold" />
              )}
              <span className="text-base font-semibold text-brand-gold">
                {data.hero.percentageChange >= 0 ? '+' : ''}{data.hero.percentageChange.toFixed(1)}% vs previous month
              </span>
            </div>
            <p className="text-white/90 text-sm mt-2 font-book">
              {data.hero.bestMonthThisYear
                ? "Your best month this year!"
                : "Last month's revenue"
              }
            </p>
          </div>
          <div className="md:text-right border-t md:border-t-0 md:border-l border-white/20 pt-6 md:pt-0 md:pl-8">
            <p className="text-brand-gold text-xs font-semibold uppercase tracking-wider mb-2">Previous Month</p>
            <p className="text-2xl md:text-3xl font-bold !text-white">
              {formatCurrency(data.hero.lastMonthRevenue, data.hero.currency)}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Direct Bookings % */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-soft-gray hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-brand-navy/60 uppercase tracking-wider">Direct Bookings</p>
              <p className="text-3xl font-bold text-brand-navy mt-2">
                {data.stats.directBookingsPercentage.toFixed(1)}%
              </p>
              <p className="text-xs text-brand-navy/50 mt-1 font-book">Goal: {data.stats.directBookingsGoal}%</p>
            </div>
            <CircularProgress
              percentage={data.stats.directBookingsPercentage}
              goal={data.stats.directBookingsGoal}
            />
          </div>
        </div>

        {/* Total Bookings */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-soft-gray hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="w-14 h-14 bg-brand-gold/20 rounded-xl flex items-center justify-center mr-4">
              <Calendar className="h-7 w-7 text-brand-navy" />
            </div>
            <div>
              <p className="text-xs font-semibold text-brand-navy/60 uppercase tracking-wider">Total Bookings</p>
              <p className="text-3xl font-bold text-brand-navy mt-1">
                {formatNumber(data.stats.totalBookings)}
              </p>
              <p className="text-xs text-brand-navy/50 mt-0.5 font-book">last month</p>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-soft-gray">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-brand-navy">Revenue Trend</h3>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-forest-green"></div>
              <span className="text-xs font-medium text-brand-navy">Direct</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-sunset-orange"></div>
              <span className="text-xs font-medium text-brand-navy">OTA</span>
            </div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data.revenueHistory}>
            <defs>
              <linearGradient id="directGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2d5f4d" stopOpacity={0.6}/>
                <stop offset="95%" stopColor="#2d5f4d" stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="otaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ff6b35" stopOpacity={0.6}/>
                <stop offset="95%" stopColor="#ff6b35" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#28384d', fontWeight: 500 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#28384d', fontWeight: 500 }}
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
            />
            <Tooltip
              formatter={(value: number, name: string) => {
                const label = name === 'directRevenue' ? 'Direct' : name === 'otaRevenue' ? 'OTA' : 'Total'
                return [formatCurrency(value, data.hero.currency), label]
              }}
              labelFormatter={(label) => `Month: ${label}`}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e5e0',
                borderRadius: '12px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                fontSize: '13px',
                padding: '12px'
              }}
            />
            <Area
              type="monotone"
              dataKey="directRevenue"
              stackId="1"
              stroke="#2d5f4d"
              strokeWidth={2}
              fill="url(#directGradient)"
            />
            <Area
              type="monotone"
              dataKey="otaRevenue"
              stackId="1"
              stroke="#ff6b35"
              strokeWidth={2}
              fill="url(#otaGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Monthly Breakdown Table */}
      <MonthlyBreakdownTable
        monthlyData={data.monthlyBreakdown}
        currency={data.hero.currency}
      />

      {/* Insight Box */}
      <div className={`p-6 rounded-xl border shadow-sm ${getInsightBgColor(data.insight.type)}`}>
        <div className="flex items-start">
          <div className="mr-4 mt-0.5">
            {getInsightIcon(data.insight.type)}
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-brand-navy mb-2">
              {data.insight.title}
            </h3>
            <p className="text-brand-navy/80 text-sm font-book leading-relaxed">
              {data.insight.description}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

interface MonthlyBreakdownTableProps {
  monthlyData: {
    month: string
    monthKey: string
    directBookings: number
    directRevenue: number
    otaBookings: number
    otaRevenue: number
    totalBookings: number
    totalRevenue: number
  }[]
  currency: string
}

function MonthlyBreakdownTable({ monthlyData, currency }: MonthlyBreakdownTableProps) {
  const [showAll, setShowAll] = useState(false)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  // Show last 6 months by default
  const visibleData = showAll ? monthlyData : monthlyData.slice(-6)

  // Calculate totals
  const totals = visibleData.reduce((acc, month) => ({
    directBookings: acc.directBookings + month.directBookings,
    directRevenue: acc.directRevenue + month.directRevenue,
    otaBookings: acc.otaBookings + month.otaBookings,
    otaRevenue: acc.otaRevenue + month.otaRevenue,
    totalBookings: acc.totalBookings + month.totalBookings,
    totalRevenue: acc.totalRevenue + month.totalRevenue
  }), {
    directBookings: 0,
    directRevenue: 0,
    otaBookings: 0,
    otaRevenue: 0,
    totalBookings: 0,
    totalRevenue: 0
  })

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-soft-gray">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-bold text-brand-navy">Monthly Breakdown</h3>
        {monthlyData.length > 6 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-sm text-brand-navy hover:text-brand-gold font-semibold transition-colors"
          >
            {showAll ? 'Show Less' : `View More (${monthlyData.length - 6} months)`}
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-soft-gray">
              <th className="text-left py-3 px-4 text-xs font-semibold text-brand-navy/60 uppercase tracking-wider">
                Month
              </th>
              <th className="text-right py-3 px-4 text-xs font-semibold text-brand-navy/60 uppercase tracking-wider">
                Direct Bookings
              </th>
              <th className="text-right py-3 px-4 text-xs font-semibold text-brand-navy/60 uppercase tracking-wider">
                Direct Revenue
              </th>
              <th className="text-right py-3 px-4 text-xs font-semibold text-brand-navy/60 uppercase tracking-wider">
                OTA Bookings
              </th>
              <th className="text-right py-3 px-4 text-xs font-semibold text-brand-navy/60 uppercase tracking-wider">
                OTA Revenue
              </th>
              <th className="text-right py-3 px-4 text-xs font-semibold text-brand-navy/60 uppercase tracking-wider">
                Total Bookings
              </th>
              <th className="text-right py-3 px-4 text-xs font-semibold text-brand-navy/60 uppercase tracking-wider">
                Total Revenue
              </th>
            </tr>
          </thead>
          <tbody>
            {visibleData.map((month, index) => (
              <tr key={month.monthKey} className={`border-b border-soft-gray/50 hover:bg-off-white transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-off-white/30'}`}>
                <td className="py-3 px-4 text-sm font-semibold text-brand-navy">
                  {month.month}
                </td>
                <td className="py-3 px-4 text-sm text-right text-brand-navy">
                  {month.directBookings}
                </td>
                <td className="py-3 px-4 text-sm text-right text-brand-navy font-medium">
                  {formatCurrency(month.directRevenue)}
                </td>
                <td className="py-3 px-4 text-sm text-right text-brand-navy">
                  {month.otaBookings}
                </td>
                <td className="py-3 px-4 text-sm text-right text-brand-navy font-medium">
                  {formatCurrency(month.otaRevenue)}
                </td>
                <td className="py-3 px-4 text-sm text-right text-brand-navy font-semibold">
                  {month.totalBookings}
                </td>
                <td className="py-3 px-4 text-sm text-right text-brand-navy font-bold">
                  {formatCurrency(month.totalRevenue)}
                </td>
              </tr>
            ))}
            <tr className="bg-brand-navy/5 border-t-2 border-brand-navy">
              <td className="py-3 px-4 text-sm font-bold text-brand-navy">
                TOTAL
              </td>
              <td className="py-3 px-4 text-sm text-right font-bold text-brand-navy">
                {totals.directBookings}
              </td>
              <td className="py-3 px-4 text-sm text-right font-bold text-brand-navy">
                {formatCurrency(totals.directRevenue)}
              </td>
              <td className="py-3 px-4 text-sm text-right font-bold text-brand-navy">
                {totals.otaBookings}
              </td>
              <td className="py-3 px-4 text-sm text-right font-bold text-brand-navy">
                {formatCurrency(totals.otaRevenue)}
              </td>
              <td className="py-3 px-4 text-sm text-right font-bold text-brand-navy">
                {totals.totalBookings}
              </td>
              <td className="py-3 px-4 text-sm text-right font-bold text-brand-navy">
                {formatCurrency(totals.totalRevenue)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
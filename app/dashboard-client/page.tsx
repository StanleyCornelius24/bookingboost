'use client'

import { useState, useEffect } from 'react'
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Info
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
    const radius = 45
    const strokeWidth = 8
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
            stroke="#e5e7eb"
            fill="transparent"
            strokeWidth={strokeWidth}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          <circle
            stroke={percentage >= goal ? "#10b981" : "#3b82f6"}
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
          <span className="text-lg font-bold text-gray-900">
            {percentage.toFixed(0)}%
          </span>
        </div>
      </div>
    )
  }

  const getInsightIcon = (type: 'success' | 'warning' | 'info') => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-6 w-6 text-green-600" />
      case 'warning':
        return <AlertTriangle className="h-6 w-6 text-yellow-600" />
      case 'info':
      default:
        return <Info className="h-6 w-6 text-blue-600" />
    }
  }

  const getInsightBgColor = (type: 'success' | 'warning' | 'info') => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200'
      case 'info':
      default:
        return 'bg-blue-50 border-blue-200'
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

  if (error || !data) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Error</h1>
          <p className="text-red-600">{error || 'Failed to load dashboard data'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">
              {formatCurrency(data.hero.thisMonthRevenue, data.hero.currency)}
            </h1>
            <div className="flex items-center space-x-2 text-blue-100">
              {data.hero.percentageChange >= 0 ? (
                <TrendingUp className="h-5 w-5" />
              ) : (
                <TrendingDown className="h-5 w-5" />
              )}
              <span className="text-lg">
                {data.hero.percentageChange >= 0 ? '+' : ''}{data.hero.percentageChange.toFixed(1)}% vs last month
              </span>
            </div>
            <p className="text-blue-100 mt-2">
              {data.hero.bestMonthThisYear
                ? "🎉 Your best month this year!"
                : "This month's revenue"
              }
            </p>
          </div>
          <div className="text-right">
            <p className="text-blue-100 text-sm">Last Month</p>
            <p className="text-2xl font-semibold">
              {formatCurrency(data.hero.lastMonthRevenue, data.hero.currency)}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Direct Bookings % */}
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-600">Direct Bookings</p>
              <p className="text-xl font-bold text-gray-900">
                {data.stats.directBookingsPercentage.toFixed(1)}%
              </p>
              <p className="text-xs text-gray-500">Goal: {data.stats.directBookingsGoal}%</p>
            </div>
            <CircularProgress
              percentage={data.stats.directBookingsPercentage}
              goal={data.stats.directBookingsGoal}
            />
          </div>
        </div>

        {/* Total Bookings */}
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center">
            <Calendar className="h-10 w-10 text-blue-600 mr-4" />
            <div>
              <p className="text-sm text-gray-600">Total Bookings</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(data.stats.totalBookings)}
              </p>
              <p className="text-xs text-gray-500">this month</p>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Revenue Trend</h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data.revenueHistory}>
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.05}/>
              </linearGradient>
            </defs>
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#6B7280' }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#6B7280' }}
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
            />
            <Tooltip
              formatter={(value: number) => [formatCurrency(value, data.hero.currency), 'Revenue']}
              labelFormatter={(label) => `Month: ${label}`}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#3B82F6"
              strokeWidth={3}
              fill="url(#revenueGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Insight Box */}
      <div className={`p-6 rounded-xl border ${getInsightBgColor(data.insight.type)}`}>
        <div className="flex items-start">
          <div className="mr-4 mt-1">
            {getInsightIcon(data.insight.type)}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {data.insight.title}
            </h3>
            <p className="text-gray-700 text-base leading-relaxed">
              {data.insight.description}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
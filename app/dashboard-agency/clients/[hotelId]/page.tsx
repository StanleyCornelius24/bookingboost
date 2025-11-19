'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  DollarSign,
  TrendingUp,
  CreditCard,
  Target,
  Calendar,
  Users,
  ChevronUp,
  ChevronDown
} from 'lucide-react'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { HotelDetailMetrics } from '@/lib/hotel-detail-data'

export default function ClientDetailPage() {
  const params = useParams()
  const router = useRouter()
  const hotelId = params.hotelId as string

  const [data, setData] = useState<HotelDetailMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchHotelData()
  }, [hotelId])

  const fetchHotelData = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/agency/clients/${hotelId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch hotel data')
      }

      const hotelData = await response.json()
      setData(hotelData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number, currency: string = 'ZAR') => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: currency
    }).format(amount)
  }

  const formatPercentage = (value: number) => `${value.toFixed(1)}%`

  const getChangeIcon = (change: number) => {
    if (change > 0) return <ChevronUp className="h-4 w-4 text-green-500" />
    if (change < 0) return <ChevronDown className="h-4 w-4 text-red-500" />
    return <span className="h-4 w-4" />
  }

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600'
    if (change < 0) return 'text-red-600'
    return 'text-gray-600'
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
            <p className="text-red-600">{error || 'Hotel not found'}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center">
        <button
          onClick={() => router.back()}
          className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{data.hotel.name}</h1>
          <p className="text-gray-600">{data.hotel.email}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(data.totalRevenue, data.hotel.currency)}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Direct Booking %</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatPercentage(data.directPercentage)}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">OTA Commissions</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(data.otaCommission, data.hotel.currency)}
              </p>
            </div>
            <CreditCard className="h-8 w-8 text-red-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Marketing ROI</p>
              <p className="text-2xl font-bold text-gray-900">
                {data.marketingRoi > 0 ? `${data.marketingRoi.toFixed(1)}x` : 'N/A'}
              </p>
            </div>
            <Target className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend Chart */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data.revenueHistory}>
              <defs>
                <linearGradient id="totalRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="directRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="otaRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip
                formatter={(value: number) => [formatCurrency(value, data.hotel.currency), '']}
                labelFormatter={(label) => `Month: ${label}`}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="totalRevenue"
                stroke="#3B82F6"
                fillOpacity={1}
                fill="url(#totalRevenue)"
                name="Total Revenue"
              />
              <Area
                type="monotone"
                dataKey="directRevenue"
                stroke="#10B981"
                fillOpacity={1}
                fill="url(#directRevenue)"
                name="Direct Revenue"
              />
              <Area
                type="monotone"
                dataKey="otaRevenue"
                stroke="#F59E0B"
                fillOpacity={1}
                fill="url(#otaRevenue)"
                name="OTA Revenue"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Channel Breakdown Pie Chart */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Channel Breakdown</h3>
          <div className="relative">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.channelBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {data.channelBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => [formatCurrency(value, data.hotel.currency), '']}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>

            {/* Center text showing Direct % */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">
                  {formatPercentage(data.directPercentage)}
                </p>
                <p className="text-sm text-gray-600">Direct</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Comparison Table */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Comparison</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-medium text-gray-900">Metric</th>
                <th className="text-right py-3 px-4 font-medium text-gray-900">This Month</th>
                <th className="text-right py-3 px-4 font-medium text-gray-900">Last Month</th>
                <th className="text-right py-3 px-4 font-medium text-gray-900">Change</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr>
                <td className="py-3 px-4 text-gray-900">Bookings</td>
                <td className="py-3 px-4 text-right text-gray-900">{data.monthlyComparison.thisMonth.bookings}</td>
                <td className="py-3 px-4 text-right text-gray-900">{data.monthlyComparison.lastMonth.bookings}</td>
                <td className={`py-3 px-4 text-right flex items-center justify-end ${getChangeColor(data.monthlyComparison.changes.bookingsChange)}`}>
                  {getChangeIcon(data.monthlyComparison.changes.bookingsChange)}
                  {Math.abs(data.monthlyComparison.changes.bookingsChange).toFixed(1)}%
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-gray-900">Revenue</td>
                <td className="py-3 px-4 text-right text-gray-900">
                  {formatCurrency(data.monthlyComparison.thisMonth.revenue, data.hotel.currency)}
                </td>
                <td className="py-3 px-4 text-right text-gray-900">
                  {formatCurrency(data.monthlyComparison.lastMonth.revenue, data.hotel.currency)}
                </td>
                <td className={`py-3 px-4 text-right flex items-center justify-end ${getChangeColor(data.monthlyComparison.changes.revenueChange)}`}>
                  {getChangeIcon(data.monthlyComparison.changes.revenueChange)}
                  {Math.abs(data.monthlyComparison.changes.revenueChange).toFixed(1)}%
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-gray-900">Direct %</td>
                <td className="py-3 px-4 text-right text-gray-900">
                  {formatPercentage(data.monthlyComparison.thisMonth.directPercentage)}
                </td>
                <td className="py-3 px-4 text-right text-gray-900">
                  {formatPercentage(data.monthlyComparison.lastMonth.directPercentage)}
                </td>
                <td className={`py-3 px-4 text-right flex items-center justify-end ${getChangeColor(data.monthlyComparison.changes.directPercentageChange)}`}>
                  {getChangeIcon(data.monthlyComparison.changes.directPercentageChange)}
                  {Math.abs(data.monthlyComparison.changes.directPercentageChange).toFixed(1)}pp
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-gray-900">Commissions</td>
                <td className="py-3 px-4 text-right text-gray-900">
                  {formatCurrency(data.monthlyComparison.thisMonth.commissions, data.hotel.currency)}
                </td>
                <td className="py-3 px-4 text-right text-gray-900">
                  {formatCurrency(data.monthlyComparison.lastMonth.commissions, data.hotel.currency)}
                </td>
                <td className={`py-3 px-4 text-right flex items-center justify-end ${getChangeColor(data.monthlyComparison.changes.commissionsChange)}`}>
                  {getChangeIcon(data.monthlyComparison.changes.commissionsChange)}
                  {Math.abs(data.monthlyComparison.changes.commissionsChange).toFixed(1)}%
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
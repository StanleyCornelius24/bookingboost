'use client'

import { useState, useEffect } from 'react'
import { RefreshCw, Calendar, TrendingUp, TrendingDown, Minus, Download, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'

interface HotelReport {
  id: string
  name: string
  currentUsers: number
  previousUsers: number
  usersChange: number
  currentAdSpend: number
  previousAdSpend: number
  adSpendChange: number
  currentDirectRevenue: number
  previousDirectRevenue: number
  directRevenueChange: number
  currentTotalRevenue: number
  previousTotalRevenue: number
  totalRevenueChange: number
  currency: string
  lastSyncDate: string | null
}

interface ReportPeriod {
  currentMonth: { start: string; end: string }
  previousMonth: { start: string; end: string }
}

type DateMode = 'booked' | 'stayed'
type SortField = 'name' | 'currentUsers' | 'currentAdSpend' | 'currentDirectRevenue' | 'currentTotalRevenue'
type SortDirection = 'asc' | 'desc'

export default function AdminReportsPage() {
  const [hotels, setHotels] = useState<HotelReport[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [period, setPeriod] = useState<ReportPeriod | null>(null)
  const [selectedMonth, setSelectedMonth] = useState<string>('')
  const [dateMode, setDateMode] = useState<DateMode>('booked')
  const [sortField, setSortField] = useState<SortField>('currentTotalRevenue')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  // Initialize selectedMonth to current month
  useEffect(() => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    setSelectedMonth(`${year}-${month}`)
  }, [])

  const fetchReportData = async () => {
    setLoading(true)
    setError(null)
    try {
      const url = `/api/admin/reports?month=${selectedMonth}&dateMode=${dateMode}`
      const response = await fetch(url)
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to fetch report data')
      }
      const data = await response.json()
      setHotels(data.hotels)
      setPeriod(data.period)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (selectedMonth) {
      fetchReportData()
    }
  }, [selectedMonth, dateMode])

  const formatCurrency = (value: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value)
  }

  const renderChangeIndicator = (change: number) => {
    if (change === 0) {
      return (
        <span className="inline-flex items-center text-gray-500 text-xs">
          <Minus className="h-3 w-3 mr-1" />
          0%
        </span>
      )
    }

    const isPositive = change > 0
    const Icon = isPositive ? TrendingUp : TrendingDown
    const colorClass = isPositive ? 'text-green-600' : 'text-red-600'

    return (
      <span className={`inline-flex items-center ${colorClass} text-xs`}>
        <Icon className="h-3 w-3 mr-1" />
        {Math.abs(change).toFixed(1)}%
      </span>
    )
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      // Default to desc for new field (except name)
      setSortField(field)
      setSortDirection(field === 'name' ? 'asc' : 'desc')
    }
  }

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 ml-1 opacity-50" />
    }
    return sortDirection === 'asc'
      ? <ArrowUp className="h-4 w-4 ml-1" />
      : <ArrowDown className="h-4 w-4 ml-1" />
  }

  const sortedHotels = [...hotels].sort((a, b) => {
    let aVal = a[sortField]
    let bVal = b[sortField]

    // Handle string comparison for name
    if (sortField === 'name') {
      return sortDirection === 'asc'
        ? aVal.toString().localeCompare(bVal.toString())
        : bVal.toString().localeCompare(aVal.toString())
    }

    // Handle numeric comparison
    const aNum = Number(aVal) || 0
    const bNum = Number(bVal) || 0
    return sortDirection === 'asc' ? aNum - bNum : bNum - aNum
  })

  const exportToCSV = () => {
    const headers = ['Hotel', 'Sessions', 'Sessions Change', 'Ad Spend', 'Ad Spend Change', 'Direct Revenue', 'Direct Revenue Change', 'Total Revenue', 'Total Revenue Change']
    const rows = sortedHotels.map(hotel => [
      hotel.name,
      hotel.currentUsers,
      `${hotel.usersChange.toFixed(1)}%`,
      hotel.currentAdSpend,
      `${hotel.adSpendChange.toFixed(1)}%`,
      hotel.currentDirectRevenue,
      `${hotel.directRevenueChange.toFixed(1)}%`,
      hotel.currentTotalRevenue,
      `${hotel.totalRevenueChange.toFixed(1)}%`
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `hotel-report-${selectedMonth}-${dateMode}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (loading && !period) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Hotel Performance Reports</h1>
        <p className="text-sm text-gray-600 mt-1">
          Compare hotel performance metrics month-over-month
        </p>
      </div>

      {/* Controls */}
      <div className="mb-6 bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Month
            </label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date Mode
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setDateMode('booked')}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                  dateMode === 'booked'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Booked Date
              </button>
              <button
                onClick={() => setDateMode('stayed')}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                  dateMode === 'stayed'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Stayed Date
              </button>
            </div>
          </div>

          <div className="flex items-end gap-2">
            <button
              onClick={fetchReportData}
              disabled={loading}
              className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={exportToCSV}
              disabled={loading || hotels.length === 0}
              className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </button>
          </div>
        </div>

        {period && (
          <div className="mt-4 text-sm text-gray-600">
            Comparing: <span className="font-medium">{new Date(period.currentMonth.start).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span> vs <span className="font-medium">{new Date(period.previousMonth.start).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Summary Cards */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-xs font-medium text-gray-500 mb-1">Total Sessions</h3>
          <p className="text-xl font-bold text-gray-900">
            {formatNumber(hotels.reduce((sum, h) => sum + h.currentUsers, 0))}
          </p>
          <div className="mt-1">
            {renderChangeIndicator(
              hotels.reduce((sum, h) => sum + h.usersChange * h.currentUsers, 0) /
              hotels.reduce((sum, h) => sum + h.currentUsers, 0) || 0
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-xs font-medium text-gray-500 mb-1">Total Ad Spend</h3>
          <p className="text-xl font-bold text-gray-900">
            {formatCurrency(
              hotels.reduce((sum, h) => sum + h.currentAdSpend, 0),
              hotels[0]?.currency || 'USD'
            )}
          </p>
          <div className="mt-1">
            {renderChangeIndicator(
              hotels.reduce((sum, h) => sum + h.adSpendChange * h.currentAdSpend, 0) /
              hotels.reduce((sum, h) => sum + h.currentAdSpend, 0) || 0
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-xs font-medium text-gray-500 mb-1">Total Direct Revenue</h3>
          <p className="text-xl font-bold text-gray-900">
            {formatCurrency(
              hotels.reduce((sum, h) => sum + h.currentDirectRevenue, 0),
              hotels[0]?.currency || 'USD'
            )}
          </p>
          <div className="mt-1">
            {renderChangeIndicator(
              hotels.reduce((sum, h) => sum + h.directRevenueChange * h.currentDirectRevenue, 0) /
              hotels.reduce((sum, h) => sum + h.currentDirectRevenue, 0) || 0
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-xs font-medium text-gray-500 mb-1">Total Revenue</h3>
          <p className="text-xl font-bold text-gray-900">
            {formatCurrency(
              hotels.reduce((sum, h) => sum + h.currentTotalRevenue, 0),
              hotels[0]?.currency || 'USD'
            )}
          </p>
          <div className="mt-1">
            {renderChangeIndicator(
              hotels.reduce((sum, h) => sum + h.totalRevenueChange * h.currentTotalRevenue, 0) /
              hotels.reduce((sum, h) => sum + h.currentTotalRevenue, 0) || 0
            )}
          </div>
        </div>
      </div>

      {/* Hotels Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <button
                    onClick={() => handleSort('name')}
                    className="inline-flex items-center text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700 transition-colors"
                  >
                    Hotel
                    {getSortIcon('name')}
                  </button>
                </th>
                <th className="px-6 py-3 text-right">
                  <button
                    onClick={() => handleSort('currentUsers')}
                    className="inline-flex items-center text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700 transition-colors"
                  >
                    Sessions
                    {getSortIcon('currentUsers')}
                  </button>
                </th>
                <th className="px-6 py-3 text-right">
                  <button
                    onClick={() => handleSort('currentAdSpend')}
                    className="inline-flex items-center text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700 transition-colors"
                  >
                    Ad Spend
                    {getSortIcon('currentAdSpend')}
                  </button>
                </th>
                <th className="px-6 py-3 text-right">
                  <button
                    onClick={() => handleSort('currentDirectRevenue')}
                    className="inline-flex items-center text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700 transition-colors"
                  >
                    Direct Revenue
                    {getSortIcon('currentDirectRevenue')}
                  </button>
                </th>
                <th className="px-6 py-3 text-right">
                  <button
                    onClick={() => handleSort('currentTotalRevenue')}
                    className="inline-flex items-center text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700 transition-colors"
                  >
                    Total Revenue
                    {getSortIcon('currentTotalRevenue')}
                  </button>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {sortedHotels.map((hotel) => (
                <tr key={hotel.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{hotel.name}</div>
                    {hotel.lastSyncDate && (
                      <div className="text-xs text-gray-500">
                        Last sync: {new Date(hotel.lastSyncDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {formatNumber(hotel.currentUsers)}
                    </div>
                    <div>{renderChangeIndicator(hotel.usersChange)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(hotel.currentAdSpend, hotel.currency)}
                    </div>
                    <div>{renderChangeIndicator(hotel.adSpendChange)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(hotel.currentDirectRevenue, hotel.currency)}
                    </div>
                    <div>{renderChangeIndicator(hotel.directRevenueChange)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(hotel.currentTotalRevenue, hotel.currency)}
                    </div>
                    <div>{renderChangeIndicator(hotel.totalRevenueChange)}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {hotels.length === 0 && !loading && (
          <div className="text-center py-12">
            <Calendar className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-gray-500">No data available for selected period</p>
          </div>
        )}
      </div>
    </div>
  )
}

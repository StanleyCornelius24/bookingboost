'use client'

import { useState, useEffect, useMemo } from 'react'
import { RefreshCw, TrendingUp, TrendingDown, Minus, Search, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import Link from 'next/link'

interface HotelMetrics {
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
}

type SortField = 'name' | 'currentUsers' | 'currentAdSpend' | 'currentDirectRevenue' | 'currentTotalRevenue'
type SortDirection = 'asc' | 'desc'

export default function AdminDashboardPage() {
  const [hotels, setHotels] = useState<HotelMetrics[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [period, setPeriod] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortField, setSortField] = useState<SortField>('currentUsers')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/admin/dashboard-overview')
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to fetch dashboard data')
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

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction if clicking the same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      // Set new field with default desc direction
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-3 w-3 ml-1 inline opacity-0 group-hover:opacity-50" />
    }
    return sortDirection === 'asc'
      ? <ArrowUp className="h-3 w-3 ml-1 inline" />
      : <ArrowDown className="h-3 w-3 ml-1 inline" />
  }

  // Filter and sort hotels
  const filteredAndSortedHotels = useMemo(() => {
    let filtered = hotels

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(hotel =>
        hotel.name.toLowerCase().includes(query)
      )
    }

    // Sort hotels
    return filtered.sort((a, b) => {
      const aValue = a[sortField]
      const bValue = b[sortField]

      // Handle string vs number comparison
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      }

      // Number comparison
      return sortDirection === 'asc'
        ? (aValue as number) - (bValue as number)
        : (bValue as number) - (aValue as number)
    })
  }, [hotels, searchQuery, sortField, sortDirection])

  const renderChangeIndicator = (change: number) => {
    if (change === 0) {
      return (
        <span className="inline-flex items-center text-gray-500">
          <Minus className="h-3 w-3 mr-1" />
          0%
        </span>
      )
    }

    const isPositive = change > 0
    const Icon = isPositive ? TrendingUp : TrendingDown
    const colorClass = isPositive ? 'text-green-600' : 'text-red-600'

    return (
      <span className={`inline-flex items-center ${colorClass}`}>
        <Icon className="h-3 w-3 mr-1" />
        {Math.abs(change).toFixed(1)}%
      </span>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          {period && (
            <p className="text-sm text-gray-600 mt-1">
              Showing: {new Date(period.currentMonth.start).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} vs {new Date(period.previousMonth.start).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </p>
          )}
        </div>
        <button
          onClick={fetchDashboardData}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search hotels by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-xs font-medium text-gray-500 mb-1">Total Hotels</h3>
          <p className="text-xl font-bold text-gray-900">{filteredAndSortedHotels.length}</p>
          {searchQuery && (
            <p className="text-[10px] text-gray-500 mt-0.5">of {hotels.length} total</p>
          )}
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-xs font-medium text-gray-500 mb-1">Total Sessions Last Month</h3>
          <p className="text-xl font-bold text-gray-900">
            {formatNumber(filteredAndSortedHotels.reduce((sum, h) => sum + h.currentUsers, 0))}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-xs font-medium text-gray-500 mb-1">Total Ad Spend</h3>
          <p className="text-xl font-bold text-gray-900">
            {formatCurrency(
              filteredAndSortedHotels.reduce((sum, h) => sum + h.currentAdSpend, 0),
              filteredAndSortedHotels[0]?.currency || 'USD'
            )}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-xs font-medium text-gray-500 mb-1">Total Direct Revenue</h3>
          <p className="text-xl font-bold text-gray-900">
            {formatCurrency(
              filteredAndSortedHotels.reduce((sum, h) => sum + h.currentDirectRevenue, 0),
              filteredAndSortedHotels[0]?.currency || 'USD'
            )}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-xs font-medium text-gray-500 mb-1">Total Revenue</h3>
          <p className="text-xl font-bold text-gray-900">
            {formatCurrency(
              filteredAndSortedHotels.reduce((sum, h) => sum + h.currentTotalRevenue, 0),
              filteredAndSortedHotels[0]?.currency || 'USD'
            )}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 cursor-pointer hover:bg-gray-100 group"
                  onClick={() => handleSort('name')}
                >
                  Hotel
                  <SortIcon field="name" />
                </th>
                <th
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 group"
                  onClick={() => handleSort('currentUsers')}
                >
                  Sessions
                  <SortIcon field="currentUsers" />
                </th>
                <th
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 group"
                  onClick={() => handleSort('currentAdSpend')}
                >
                  Ad Spend
                  <SortIcon field="currentAdSpend" />
                </th>
                <th
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 group"
                  onClick={() => handleSort('currentDirectRevenue')}
                >
                  Direct Revenue
                  <SortIcon field="currentDirectRevenue" />
                </th>
                <th
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 group"
                  onClick={() => handleSort('currentTotalRevenue')}
                >
                  Total Revenue
                  <SortIcon field="currentTotalRevenue" />
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredAndSortedHotels.map((hotel) => (
                <tr key={hotel.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap sticky left-0 bg-white">
                    <Link
                      href={`/dashboard-admin/hotels?hotelId=${hotel.id}`}
                      className="text-sm font-medium text-blue-600 hover:text-blue-800"
                    >
                      {hotel.name}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {formatNumber(hotel.currentUsers)}
                    </div>
                    <div className="text-xs">
                      {renderChangeIndicator(hotel.usersChange)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(hotel.currentAdSpend, hotel.currency)}
                    </div>
                    <div className="text-xs">
                      {renderChangeIndicator(hotel.adSpendChange)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(hotel.currentDirectRevenue, hotel.currency)}
                    </div>
                    <div className="text-xs">
                      {renderChangeIndicator(hotel.directRevenueChange)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(hotel.currentTotalRevenue, hotel.currency)}
                    </div>
                    <div className="text-xs">
                      {renderChangeIndicator(hotel.totalRevenueChange)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <Link
                      href={`/dashboard-admin/hotels?hotelId=${hotel.id}`}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      View Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredAndSortedHotels.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">
              {searchQuery ? 'No hotels match your search' : 'No hotels found'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

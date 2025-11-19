'use client'

import { useState, useEffect } from 'react'
import {
  Search,
  Filter,
  Eye,
  Calendar,
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  DollarSign,
  Percent,
  CreditCard
} from 'lucide-react'
import { ClientMetrics, AgencySummary } from '@/lib/agency-data'

interface SortConfig {
  key: keyof ClientMetrics
  direction: 'asc' | 'desc'
}

export default function ClientsOverviewPage() {
  const [clients, setClients] = useState<ClientMetrics[]>([])
  const [summary, setSummary] = useState<AgencySummary>({
    totalClients: 0,
    totalRevenue: 0,
    avgDirectPercentage: 0,
    totalOtaCommissions: 0
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
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
      fetchData()
    }
  }, [startDate, endDate])

  const fetchData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (startDate) params.set('startDate', startDate)
      if (endDate) params.set('endDate', endDate)

      const response = await fetch(`/api/agency/clients?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Failed to fetch clients data')
      }

      const data = await response.json()
      setClients(data.clients)
      setSummary(data.summary)
    } catch (error) {
      console.error('Error fetching clients data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSort = (key: keyof ClientMetrics) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const filteredAndSortedClients = clients
    .filter(client => {
      const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === 'all' || client.status === statusFilter
      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
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

  const getStatusBadge = (status: string, directPercentage: number) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-semibold"

    switch (status) {
      case 'excellent':
        return (
          <span className={`${baseClasses} bg-green-100 text-green-800 flex items-center`}>
            <TrendingUp className="w-3 h-3 mr-1" />
            Excellent ({directPercentage.toFixed(1)}%)
          </span>
        )
      case 'good':
        return (
          <span className={`${baseClasses} bg-yellow-100 text-yellow-800 flex items-center`}>
            <Minus className="w-3 h-3 mr-1" />
            Good ({directPercentage.toFixed(1)}%)
          </span>
        )
      case 'needs-attention':
        return (
          <span className={`${baseClasses} bg-red-100 text-red-800 flex items-center`}>
            <TrendingDown className="w-3 h-3 mr-1" />
            Needs Attention ({directPercentage.toFixed(1)}%)
          </span>
        )
      default:
        return <span className={`${baseClasses} bg-gray-100 text-gray-800`}>Unknown</span>
    }
  }

  const formatCurrency = (amount: number, currency: string = 'ZAR') => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: currency
    }).format(amount)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getSortIcon = (key: keyof ClientMetrics) => {
    if (sortConfig.key !== key) return null
    return sortConfig.direction === 'asc' ? '↑' : '↓'
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Clients Overview</h1>
        <p className="text-gray-600 mt-1">Manage and monitor all client hotels</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Clients</p>
              <p className="text-2xl font-bold text-gray-900">{summary.totalClients}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(summary.totalRevenue)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <Percent className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm text-gray-600">Avg Direct %</p>
              <p className="text-2xl font-bold text-gray-900">
                {summary.avgDirectPercentage.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <CreditCard className="h-8 w-8 text-red-600" />
            <div className="ml-4">
              <p className="text-sm text-gray-600">OTA Commissions</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(summary.totalOtaCommissions)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search clients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="excellent">Excellent</option>
              <option value="good">Good</option>
              <option value="needs-attention">Needs Attention</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={fetchData}
              disabled={loading}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
            >
              <Filter className="h-4 w-4 mr-2" />
              {loading ? 'Loading...' : 'Apply Filters'}
            </button>
          </div>
        </div>
      </div>

      {/* Clients Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('name')}
                >
                  Client Name {getSortIcon('name')}
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('totalRevenue')}
                >
                  Revenue {getSortIcon('totalRevenue')}
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('directPercentage')}
                >
                  Direct % {getSortIcon('directPercentage')}
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('otaCommission')}
                >
                  OTA Commission {getSortIcon('otaCommission')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('lastDataUpload')}
                >
                  Last Upload {getSortIcon('lastDataUpload')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    Loading clients data...
                  </td>
                </tr>
              ) : filteredAndSortedClients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No clients found matching your criteria
                  </td>
                </tr>
              ) : (
                filteredAndSortedClients.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{client.name}</p>
                        <p className="text-sm text-gray-500">{client.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {formatCurrency(client.totalRevenue, client.currency)}
                        </p>
                        <p className="text-sm text-gray-500">{client.totalBookings} bookings</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {client.directPercentage.toFixed(1)}%
                        </p>
                        <p className="text-sm text-gray-500">{client.directBookings}/{client.totalBookings}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm font-medium text-gray-900">
                        {formatCurrency(client.otaCommission, client.currency)}
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(client.status, client.directPercentage)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm text-gray-900">{formatDate(client.lastDataUpload)}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => window.location.href = `/dashboard-agency/clients/${client.id}`}
                        className="inline-flex items-center px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
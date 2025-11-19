/**
 * DateRangeSelector Usage Examples
 *
 * Shows how to integrate the DateRangeSelector into layouts and pages,
 * and how to use the date range in data fetching.
 */

'use client'

import { DateRangeSelector, useDateRange, formatDateRangeForAPI } from './DateRangeSelector'
import { useEffect, useState } from 'react'

// ============================================================================
// Example 1: Add to Client Dashboard Layout Header
// ============================================================================

export function ClientDashboardWithDateRange() {
  return (
    <div className="space-y-8">
      {/* Header with Date Range Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-gray-600 mt-2 text-lg">Your performance at a glance</p>
        </div>

        {/* Client variant - simpler, fewer options */}
        <DateRangeSelector variant="client" />
      </div>

      {/* Rest of your dashboard content */}
      <DashboardContent />
    </div>
  )
}

// ============================================================================
// Example 2: Add to Agency Dashboard Layout Header
// ============================================================================

export function AgencyDashboardWithDateRange() {
  return (
    <div className="space-y-6">
      {/* Header with Date Range Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hotel Analytics</h1>
          <p className="text-gray-600 text-sm">Detailed performance metrics</p>
        </div>

        {/* Agency variant - more options, compact */}
        <DateRangeSelector variant="agency" />
      </div>

      {/* Rest of your dashboard content */}
      <AgencyDashboardContent />
    </div>
  )
}

// ============================================================================
// Example 3: Use Date Range in Data Fetching
// ============================================================================

function DashboardContent() {
  const dateRange = useDateRange() // Get current date range from URL
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [dateRange.from, dateRange.to]) // Refetch when date range changes

  const fetchDashboardData = async () => {
    setLoading(true)

    try {
      // Format date range for API
      const { from, to } = formatDateRangeForAPI(dateRange)

      // Pass to API
      const response = await fetch(
        `/api/client/dashboard?from=${from}&to=${to}`
      )
      const dashboardData = await response.json()
      setData(dashboardData)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div>Loading...</div>

  return (
    <div>
      {/* Your dashboard components using filtered data */}
    </div>
  )
}

// ============================================================================
// Example 4: Server-Side Data Fetching with Date Range
// ============================================================================

// In your API route: app/api/client/dashboard/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const from = searchParams.get('from') || getDefaultFrom()
  const to = searchParams.get('to') || getDefaultTo()

  // Use date range in database query
  const { data: bookings } = await supabase
    .from('bookings')
    .select('*')
    .eq('hotel_id', hotelId)
    .gte('booking_date', from)
    .lte('booking_date', to)

  // Process and return data
  return Response.json({ bookings })
}

function getDefaultFrom() {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
}

function getDefaultTo() {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
}

// ============================================================================
// Example 5: Add to Layout File
// ============================================================================

// In app/(dashboard-client)/layout.tsx - Add to header/nav area
/*
import { DateRangeSelector } from '@/components/dashboard/DateRangeSelector'

export default async function ClientDashboardLayout({ children }) {
  // ... existing code

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="fixed inset-y-0 left-0 w-64 bg-white border-r">
        {/* ... sidebar ... *\/}
      </div>

      <div className="pl-64">
        {/* Add date range selector to top bar *\/}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Filter by date range:
            </div>
            <DateRangeSelector variant="client" />
          </div>
        </div>

        <main className="p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
*/

// ============================================================================
// Example 6: Use with onChange Handler
// ============================================================================

export function DashboardWithCustomHandler() {
  const handleDateRangeChange = (range: { from: Date; to: Date }) => {
    console.log('Date range changed:', range)

    // Custom logic when date changes
    // e.g., analytics tracking, notifications, etc.
    trackAnalytics('date_range_changed', {
      from: range.from,
      to: range.to
    })
  }

  return (
    <div>
      <DateRangeSelector
        variant="client"
        onChange={handleDateRangeChange}
      />
    </div>
  )
}

// ============================================================================
// Example 7: Integrate with Existing Data Hooks
// ============================================================================

// Create a custom hook that combines date range with data fetching
function useDashboardData() {
  const dateRange = useDateRange()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const { from, to } = formatDateRangeForAPI(dateRange)
        const response = await fetch(`/api/dashboard?from=${from}&to=${to}`)
        const result = await response.json()
        setData(result)
      } catch (error) {
        console.error('Error:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [dateRange.from, dateRange.to])

  return { data, loading, dateRange }
}

// Use in your component
export function DashboardPage() {
  const { data, loading, dateRange } = useDashboardData()

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1>Dashboard</h1>
        <DateRangeSelector variant="client" />
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <div>
          {/* Display data filtered by date range */}
          <p>Showing data from {dateRange.from.toLocaleDateString()} to {dateRange.to.toLocaleDateString()}</p>
          {/* ... rest of dashboard ... */}
        </div>
      )}
    </div>
  )
}

// ============================================================================
// Example 8: Agency Dashboard with All Pages
// ============================================================================

// Show date range selector on all agency pages
export function AgencyLayoutWithDateRange() {
  return (
    <>
      {/* Sticky top bar with date range */}
      <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-900 to-blue-800 px-6 py-3 border-b border-blue-700">
        <div className="flex items-center justify-between">
          <div className="text-sm text-blue-200">
            Data Period:
          </div>
          <DateRangeSelector variant="agency" />
        </div>
      </div>

      {/* Page content */}
      <main className="p-6">
        {/* All pages will respect the date range from URL params */}
      </main>
    </>
  )
}

// ============================================================================
// Helper: Track Analytics
// ============================================================================

function trackAnalytics(event: string, data: any) {
  // Your analytics implementation
  console.log('Analytics:', event, data)
}

// ============================================================================
// Example 9: Display Active Range Info
// ============================================================================

export function DateRangeInfo() {
  const dateRange = useDateRange()

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <div className="text-sm text-gray-600">
      Showing data from <strong>{formatDate(dateRange.from)}</strong> to{' '}
      <strong>{formatDate(dateRange.to)}</strong>
    </div>
  )
}

// Use above component in your pages
export function PageWithDateInfo() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <DateRangeInfo />
        <DateRangeSelector variant="client" />
      </div>

      {/* Rest of page */}
    </div>
  )
}

// ============================================================================
// Example 10: Client vs Agency Comparison
// ============================================================================

export function VariantComparison() {
  return (
    <div className="space-y-8 p-8">
      <div>
        <h2 className="text-xl font-bold mb-4">Client Variant</h2>
        <p className="text-sm text-gray-600 mb-4">
          Simpler, larger, fewer options. Perfect for hotel owners.
        </p>
        <DateRangeSelector variant="client" />
      </div>

      <div>
        <h2 className="text-xl font-bold mb-4">Agency Variant</h2>
        <p className="text-sm text-gray-600 mb-4">
          More compact, more options (This Year, Last Year, Last 12 Months).
          Perfect for agencies analyzing multiple properties.
        </p>
        <DateRangeSelector variant="agency" />
      </div>
    </div>
  )
}

// Placeholder components
function AgencyDashboardContent() {
  return <div>Agency Dashboard Content</div>
}

function trackAnalytics(event: string, data: any) {
  console.log('Analytics:', event, data)
}

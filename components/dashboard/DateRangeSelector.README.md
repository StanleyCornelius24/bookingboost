# DateRangeSelector Component

A comprehensive date range picker with URL state management, quick presets, and agency/client variants.

## Features

✅ **URL State Management** - Date range stored in URL params (shareable links)
✅ **Quick Presets** - Common date ranges with one click
✅ **Custom Range** - Interactive calendar for custom selections
✅ **Variants** - Agency (compact, more options) vs Client (spacious, simple)
✅ **Auto-Refresh** - Data automatically refetches when range changes
✅ **Responsive** - Works on all screen sizes

## Installation

Already installed with the required dependencies:
- `components/ui/button.tsx`
- `components/ui/popover.tsx`
- `components/ui/calendar.tsx`

## Basic Usage

```tsx
import { DateRangeSelector } from '@/components/dashboard/DateRangeSelector'

export function MyPage() {
  return (
    <div>
      <h1>Dashboard</h1>
      <DateRangeSelector variant="client" />
    </div>
  )
}
```

## Props

```typescript
interface DateRangeSelectorProps {
  variant?: 'agency' | 'client'  // Default: 'client'
  onChange?: (range: DateRange) => void
  className?: string
}

interface DateRange {
  from: Date
  to: Date
}
```

## Variants

### Client Variant
**Best for:** Hotel owners, simple dashboards

**Features:**
- Larger, more spacious design
- 4 preset options:
  - This Month
  - Last Month
  - Last 3 Months
  - Last 6 Months
- 2-month calendar view
- Easier to use, less overwhelming

```tsx
<DateRangeSelector variant="client" />
```

### Agency Variant
**Best for:** Agencies, power users, detailed analytics

**Features:**
- Compact, dense design
- 7 preset options:
  - This Month
  - Last Month
  - Last 3 Months
  - Last 6 Months
  - This Year
  - Last Year
  - Last 12 Months
- 1-month calendar view (saves space)
- More technical feel

```tsx
<DateRangeSelector variant="agency" />
```

## Quick Presets

| Preset | Description | Available In |
|--------|-------------|--------------|
| This Month | First day to last day of current month | Both |
| Last Month | Previous month's full date range | Both |
| Last 3 Months | Previous 3 months | Both |
| Last 6 Months | Previous 6 months | Both |
| This Year | Jan 1 to Dec 31 of current year | Agency only |
| Last Year | Full previous year | Agency only |
| Last 12 Months | Rolling 12 months | Agency only |

## Hooks

### useDateRange()

Get the current date range from URL parameters.

```tsx
import { useDateRange } from '@/components/dashboard/DateRangeSelector'

function MyComponent() {
  const dateRange = useDateRange()
  // { from: Date, to: Date }

  console.log(dateRange.from) // 2024-01-01
  console.log(dateRange.to)   // 2024-01-31

  return <div>...</div>
}
```

**Auto-updates** when URL changes, triggering component re-renders.

### formatDateRangeForAPI()

Format date range for API queries.

```tsx
import { formatDateRangeForAPI } from '@/components/dashboard/DateRangeSelector'

const dateRange = useDateRange()
const { from, to } = formatDateRangeForAPI(dateRange)
// { from: '2024-01-01', to: '2024-01-31' }

// Use in fetch
const response = await fetch(`/api/data?from=${from}&to=${to}`)
```

## Integration Examples

### 1. Add to Page Header

```tsx
export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Header with date range */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <DateRangeSelector variant="client" />
      </div>

      {/* Content automatically filters based on URL params */}
      <DashboardContent />
    </div>
  )
}
```

### 2. Use in Data Fetching

```tsx
'use client'

import { useDateRange, formatDateRangeForAPI } from '@/components/dashboard/DateRangeSelector'
import { useEffect, useState } from 'react'

export default function DashboardContent() {
  const dateRange = useDateRange()
  const [data, setData] = useState(null)

  useEffect(() => {
    // Automatically refetches when date range changes
    fetchData()
  }, [dateRange.from, dateRange.to])

  async function fetchData() {
    const { from, to } = formatDateRangeForAPI(dateRange)
    const response = await fetch(`/api/bookings?from=${from}&to=${to}`)
    const result = await response.json()
    setData(result)
  }

  return <div>{/* Display data */}</div>
}
```

### 3. Add to Layout (Sticky Top Bar)

```tsx
// In app/(dashboard-client)/layout.tsx
import { DateRangeSelector } from '@/components/dashboard/DateRangeSelector'

export default function ClientLayout({ children }) {
  return (
    <div className="min-h-screen">
      {/* Sticky top bar */}
      <div className="sticky top-0 z-10 bg-white border-b px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">Data Period:</div>
          <DateRangeSelector variant="client" />
        </div>
      </div>

      <main className="p-8">{children}</main>
    </div>
  )
}
```

### 4. Server-Side API Route

```typescript
// app/api/client/dashboard/route.ts
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const from = searchParams.get('from') || getDefaultFrom()
  const to = searchParams.get('to') || getDefaultTo()

  // Use in database query
  const { data: bookings } = await supabase
    .from('bookings')
    .select('*')
    .gte('booking_date', from)
    .lte('booking_date', to)

  return Response.json({ bookings })
}
```

### 5. With onChange Handler

```tsx
import { DateRangeSelector } from '@/components/dashboard/DateRangeSelector'

export function Dashboard() {
  const handleRangeChange = (range: { from: Date; to: Date }) => {
    console.log('Date range changed:', range)
    // Track analytics, show notifications, etc.
  }

  return (
    <DateRangeSelector
      variant="client"
      onChange={handleRangeChange}
    />
  )
}
```

## URL Parameters

The component automatically manages these URL parameters:

```
?from=2024-01-01&to=2024-01-31
```

**Benefits:**
- Shareable links with specific date ranges
- Browser back/forward works correctly
- Bookmarkable filtered views
- Deep linking support

## Default Behavior

If no URL parameters are present, defaults to **"This Month"**:
- From: First day of current month
- To: Last day of current month

## Styling

### Custom Styling

```tsx
<DateRangeSelector
  variant="client"
  className="shadow-lg border-2 border-blue-500"
/>
```

### Color Customization

Selected dates use blue by default. Customize in `calendar.tsx`:

```tsx
// Change from blue to your brand color
className="bg-purple-600 text-white hover:bg-purple-700"
```

## Best Practices

1. **Add to Layout** - Put in layout for persistence across pages
2. **Use Sticky Positioning** - Keep visible while scrolling
3. **Show Current Range** - Display selected range in UI
4. **Loading States** - Show loading when data refetches
5. **Error Handling** - Handle invalid date ranges gracefully

## Complete Example

```tsx
'use client'

import { DateRangeSelector, useDateRange, formatDateRangeForAPI } from '@/components/dashboard/DateRangeSelector'
import { useEffect, useState } from 'react'
import { StatCard, ChannelTable, LoadingStates } from '@/components/dashboard'

export default function DashboardPage() {
  const dateRange = useDateRange()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [dateRange.from, dateRange.to])

  async function fetchDashboardData() {
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

  if (loading) {
    return <LoadingStates.DashboardOverview variant="client" />
  }

  return (
    <div className="space-y-8">
      {/* Header with date range selector */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Showing data from {dateRange.from.toLocaleDateString()} to{' '}
            {dateRange.to.toLocaleDateString()}
          </p>
        </div>
        <DateRangeSelector variant="client" />
      </div>

      {/* Dashboard content */}
      <div className="grid grid-cols-4 gap-6">
        <StatCard title="Revenue" value={data.revenue} />
        {/* More stats */}
      </div>

      <ChannelTable channels={data.channels} />
    </div>
  )
}
```

## Troubleshooting

### Date range not updating data

Make sure you're using the `useDateRange()` hook and watching for changes:

```tsx
const dateRange = useDateRange()

useEffect(() => {
  fetchData()
}, [dateRange.from, dateRange.to]) // ✅ Watch both dates
```

### Calendar not showing

Check that all UI components are installed:
- `components/ui/calendar.tsx`
- `components/ui/popover.tsx`
- `components/ui/button.tsx`

### Styling issues

Make sure Tailwind is configured to scan all component files:

```js
// tailwind.config.js
module.exports = {
  content: [
    './components/**/*.{js,ts,jsx,tsx}',
    './app/**/*.{js,ts,jsx,tsx}',
  ]
}
```

## Files

- `DateRangeSelector.tsx` - Main component
- `DateRangeSelector.examples.tsx` - Usage examples
- `DateRangeSelector.README.md` - This documentation
- `components/ui/calendar.tsx` - Calendar component
- `components/ui/popover.tsx` - Popover component
- `components/ui/button.tsx` - Button component

## Future Enhancements

Potential additions:
- Time selection (hour/minute)
- Relative ranges ("Last 7 days", "Last 30 days")
- Comparison mode (compare two date ranges)
- Saved presets (user-defined ranges)
- Export current view with date range

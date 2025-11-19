# Dashboard Components

Reusable components for building dashboard pages with agency and client variants.

## Components

### 1. StatCard

Display key metrics with optional change indicators.

**Props:**
- `title` (string) - Card title
- `value` (string | number) - Main value to display
- `change` (object, optional) - { value: number, label: string }
- `icon` (LucideIcon) - Icon component
- `variant` ('agency' | 'client', default: 'client') - Styling variant
- `subtitle` (string, optional) - Additional context
- `trend` ('up' | 'down' | 'neutral', optional) - Trend indicator

**Example:**
```tsx
import { StatCard } from '@/components/dashboard'
import { DollarSign } from 'lucide-react'

<StatCard
  title="Total Revenue"
  value="R 345,000"
  change={{ value: 12.5, label: "vs last month" }}
  icon={DollarSign}
  variant="client"
  trend="up"
/>

// Agency variant (more dense)
<StatCard
  title="Revenue"
  value="R 345K"
  icon={DollarSign}
  variant="agency"
/>
```

### 2. ChannelTable

Display booking channel data with commissions.

**Props:**
- `channels` (ChannelData[]) - Array of channel data
- `currency` (string, default: 'ZAR') - Currency code
- `variant` ('agency' | 'client', default: 'client') - Styling variant
- `showExplanations` (boolean, default: true) - Show educational content

**Agency Features:**
- Sortable columns
- Compact spacing
- Detailed view

**Client Features:**
- Simple, non-sortable
- Larger text and spacing
- Explanatory footer
- Green highlight for direct bookings

**Example:**
```tsx
import { ChannelTable } from '@/components/dashboard'

const channels = [
  {
    channel: 'Direct Website',
    emoji: '🌐',
    bookings: 85,
    revenue: 156000,
    commissionPaid: 0,
    isDirect: true
  },
  {
    channel: 'Booking.com',
    emoji: '🏨',
    bookings: 42,
    revenue: 98000,
    commissionPaid: 14700,
    isDirect: false
  }
]

<ChannelTable
  channels={channels}
  variant="client"
  showExplanations={true}
/>
```

### 3. RevenueChart

Visualization of revenue data over time.

**Props:**
- `data` (RevenueChartData[]) - Chart data points
- `variant` ('agency' | 'client', default: 'client') - Chart type
- `currency` (string, default: 'ZAR') - Currency code
- `title` (string, default: 'Revenue Trend') - Chart title
- `height` (number, default: 300) - Chart height
- `showLegend` (boolean, default: false) - Show legend

**Agency Variant:**
- Multi-line chart
- Shows total, direct, and OTA revenue
- More detailed view

**Client Variant:**
- Single line with gradient fill
- Simple, beautiful area chart
- Easier to understand

**Example:**
```tsx
import { RevenueChart } from '@/components/dashboard'

const data = [
  { month: 'Jan', revenue: 125000, directRevenue: 85000, otaRevenue: 40000 },
  { month: 'Feb', revenue: 142000, directRevenue: 95000, otaRevenue: 47000 },
  { month: 'Mar', revenue: 156000, directRevenue: 105000, otaRevenue: 51000 }
]

// Client variant (single line)
<RevenueChart
  data={data}
  variant="client"
/>

// Agency variant (multi-line)
<RevenueChart
  data={data}
  variant="agency"
  showLegend={true}
/>
```

### 4. InsightBox

Educational and informational boxes for clients.

**Props:**
- `title` (string) - Box title
- `description` (string | ReactNode) - Content
- `variant` ('success' | 'warning' | 'info' | 'tip' | 'trend', default: 'info') - Style variant
- `size` ('sm' | 'md' | 'lg', default: 'md') - Box size

**Predefined Variants:**
- `SuccessInsight` - Green, for positive outcomes
- `WarningInsight` - Yellow, for cautions
- `InfoInsight` - Blue, for general info
- `TrendInsight` - Purple, for trends
- `TipInsight` - Indigo, for helpful tips

**Example:**
```tsx
import { InsightBox, SuccessInsight, TipInsight } from '@/components/dashboard'

<InsightBox
  variant="success"
  title="Great Progress!"
  description="Your direct booking rate is above industry average."
/>

// Or use predefined variant
<SuccessInsight
  title="Great Progress!"
  description="Your direct booking rate is above industry average."
/>

<TipInsight
  title="Pro Tip"
  description="Check your Progress page monthly to track improvements over time."
  size="sm"
/>
```

### 5. LoadingStates

Skeleton loaders for different page types.

**Components:**
- `StatCardSkeleton` - Single stat card loader
- `ChartSkeleton` - Chart loader
- `TableSkeleton` - Table loader
- `DashboardOverviewLoading` - Full dashboard page
- `ChannelsPageLoading` - Channels page
- `MarketingPageLoading` - Marketing page
- `ProgressPageLoading` - Progress page
- `FAQPageLoading` - FAQ page
- `PageLoading` - Generic page

**Example:**
```tsx
import { LoadingStates } from '@/components/dashboard'

function ChannelsPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)

  if (loading) {
    return <LoadingStates.Channels variant="client" />
  }

  return (
    // ... actual page content
  )
}

// Or use specific skeleton
<div className="grid grid-cols-4 gap-6">
  <LoadingStates.StatCard variant="agency" />
  <LoadingStates.StatCard variant="agency" />
  <LoadingStates.StatCard variant="agency" />
  <LoadingStates.StatCard variant="agency" />
</div>
```

## Variant System

All components support `variant` prop to switch between agency and client styling:

**Agency Variant:**
- Compact spacing
- Smaller text
- More technical
- Dense layouts
- Sortable/interactive features

**Client Variant:**
- Spacious layouts
- Larger text
- Friendly language
- Educational content
- Simplified interactions

## Usage Pattern

```tsx
'use client'

import { useState, useEffect } from 'react'
import {
  StatCard,
  ChannelTable,
  RevenueChart,
  InsightBox,
  LoadingStates
} from '@/components/dashboard'
import { DollarSign, TrendingUp } from 'lucide-react'

export default function DashboardPage({ variant = 'client' }) {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)

  useEffect(() => {
    // Fetch data...
  }, [])

  if (loading) {
    return <LoadingStates.DashboardOverview variant={variant} />
  }

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-6">
        <StatCard
          title="Revenue"
          value={data.revenue}
          icon={DollarSign}
          variant={variant}
        />
        {/* ... more stats */}
      </div>

      {/* Chart */}
      <RevenueChart
        data={data.chartData}
        variant={variant}
      />

      {/* Table */}
      <ChannelTable
        channels={data.channels}
        variant={variant}
      />

      {/* Insight */}
      {variant === 'client' && (
        <InsightBox
          variant="success"
          title="You're doing great!"
          description="Your direct booking rate is excellent."
        />
      )}
    </div>
  )
}
```

## Best Practices

1. **Always use loading states** - Provides better UX while data loads
2. **Match variant across page** - Don't mix agency and client variants on same page
3. **Use InsightBox for client education** - Help clients understand their data
4. **Keep agency views dense** - Agencies need to see more data at once
5. **Make client views spacious** - Easier for non-technical users to read

# Component Examples

## Complete Page Examples

### Client Dashboard Overview
```tsx
'use client'

import { useState, useEffect } from 'react'
import {
  StatCard,
  RevenueChart,
  ChannelTable,
  SuccessInsight,
  LoadingStates
} from '@/components/dashboard'
import { DollarSign, TrendingUp, Target, Calendar } from 'lucide-react'

export default function ClientDashboard() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)

  if (loading) {
    return <LoadingStates.DashboardOverview variant="client" />
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-gray-600 mt-2 text-lg">Your performance at a glance</p>
      </div>

      {/* Stats Grid - Client variant (spacious) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="This Month Revenue"
          value="R 345,000"
          change={{ value: 12.5, label: "vs last month" }}
          icon={DollarSign}
          variant="client"
          trend="up"
        />
        <StatCard
          title="Direct Bookings"
          value="67%"
          subtitle="Goal: 70%"
          icon={Target}
          variant="client"
          trend="up"
        />
        <StatCard
          title="Total Bookings"
          value="168"
          icon={Calendar}
          variant="client"
        />
        <StatCard
          title="Money Saved"
          value="R 12,800"
          subtitle="vs all OTA bookings"
          icon={TrendingUp}
          variant="client"
          trend="up"
        />
      </div>

      {/* Revenue Chart - Client variant (single line with shading) */}
      <RevenueChart
        data={data.revenueHistory}
        variant="client"
        title="Revenue Trend"
        height={300}
      />

      {/* Channel Table - Client variant (simple, with explanations) */}
      <ChannelTable
        channels={data.channels}
        variant="client"
        showExplanations={true}
      />

      {/* Insight Box */}
      <SuccessInsight
        title="Excellent Performance! 🎉"
        description="Your direct booking rate is outstanding! You're saving significant money on commissions and building stronger guest relationships."
      />
    </div>
  )
}
```

### Agency Dashboard Overview
```tsx
'use client'

import { useState, useEffect } from 'react'
import {
  StatCard,
  RevenueChart,
  ChannelTable,
  LoadingStates
} from '@/components/dashboard'
import { DollarSign, TrendingUp, Target, Users } from 'lucide-react'

export default function AgencyDashboard() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)

  if (loading) {
    return <LoadingStates.DashboardOverview variant="agency" />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Hotel Analytics</h1>
        <p className="text-gray-600 text-sm">Detailed performance metrics</p>
      </div>

      {/* Stats Grid - Agency variant (dense) */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <StatCard
          title="Revenue"
          value="R 345K"
          change={{ value: 12.5, label: "MoM" }}
          icon={DollarSign}
          variant="agency"
          trend="up"
        />
        <StatCard
          title="Direct %"
          value="67%"
          subtitle="Target: 70%"
          icon={Target}
          variant="agency"
          trend="up"
        />
        <StatCard
          title="Bookings"
          value="168"
          icon={Users}
          variant="agency"
        />
        <StatCard
          title="Avg Value"
          value="R 2,054"
          icon={TrendingUp}
          variant="agency"
        />
        <StatCard
          title="OTA Cost"
          value="R 29.5K"
          icon={DollarSign}
          variant="agency"
          trend="down"
        />
      </div>

      {/* Revenue Chart - Agency variant (multi-line) */}
      <RevenueChart
        data={data.revenueHistory}
        variant="agency"
        title="Revenue Analysis"
        height={350}
        showLegend={true}
      />

      {/* Channel Table - Agency variant (sortable, detailed) */}
      <ChannelTable
        channels={data.channels}
        variant="agency"
        showExplanations={false}
      />
    </div>
  )
}
```

## Individual Component Examples

### StatCard Variations

```tsx
// Large client stat with trend
<StatCard
  title="This Month Revenue"
  value="R 345,000"
  change={{ value: 12.5, label: "vs last month" }}
  icon={DollarSign}
  variant="client"
  trend="up"
/>

// Compact agency stat
<StatCard
  title="Revenue"
  value="R 345K"
  icon={DollarSign}
  variant="agency"
/>

// With subtitle
<StatCard
  title="Direct Bookings"
  value="67%"
  subtitle="Goal: 70%"
  icon={Target}
  variant="client"
/>

// Negative trend
<StatCard
  title="OTA Commissions"
  value="R 29,500"
  change={{ value: -15.2, label: "vs last month" }}
  icon={TrendingDown}
  variant="client"
  trend="down"
/>
```

### ChannelTable with Data

```tsx
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
  },
  {
    channel: 'Airbnb',
    emoji: '🏠',
    bookings: 28,
    revenue: 64000,
    commissionPaid: 9600,
    isDirect: false
  },
  {
    channel: 'Expedia',
    emoji: '✈️',
    bookings: 13,
    revenue: 27000,
    commissionPaid: 5400,
    isDirect: false
  }
]

// Client view with explanations
<ChannelTable
  channels={channels}
  currency="ZAR"
  variant="client"
  showExplanations={true}
/>

// Agency view (sortable)
<ChannelTable
  channels={channels}
  currency="ZAR"
  variant="agency"
  showExplanations={false}
/>
```

### RevenueChart with Data

```tsx
const revenueData = [
  {
    month: 'Jan',
    revenue: 285000,
    directRevenue: 136800,
    otaRevenue: 148200
  },
  {
    month: 'Feb',
    revenue: 312000,
    directRevenue: 180960,
    otaRevenue: 131040
  },
  {
    month: 'Mar',
    revenue: 345000,
    directRevenue: 231150,
    otaRevenue: 113850
  }
]

// Client: Simple area chart
<RevenueChart
  data={revenueData}
  variant="client"
  title="Your Revenue Growth"
  height={300}
/>

// Agency: Multi-line comparison
<RevenueChart
  data={revenueData}
  variant="agency"
  title="Revenue Breakdown"
  height={350}
  showLegend={true}
/>
```

### InsightBox Variations

```tsx
// Success message
<SuccessInsight
  title="Great Progress!"
  description="Your direct booking rate is above industry average."
/>

// Warning
<WarningInsight
  title="Opportunity to Save Money"
  description="Increasing your direct bookings could save you thousands in commission fees."
/>

// Information
<InfoInsight
  title="Understanding ROI"
  description={
    <>
      <p>ROI shows how much revenue you generate for every rand spent.</p>
      <p>A 3.0x ROI means you earn R3 for every R1 spent.</p>
    </>
  }
/>

// Tip
<TipInsight
  title="Pro Tip"
  description="Check your Progress page monthly to track improvements."
  size="sm"
/>

// Trend
<TrendInsight
  title="Positive Trend Detected"
  description="Your direct bookings have increased 19% over the last 3 months."
/>

// Custom variant
<InsightBox
  variant="info"
  title="Custom Message"
  description="You can use InsightBox for any type of message."
  size="lg"
/>
```

### Loading States

```tsx
// Full page loaders
<LoadingStates.DashboardOverview variant="client" />
<LoadingStates.Channels variant="agency" />
<LoadingStates.Marketing />
<LoadingStates.Progress />
<LoadingStates.FAQ />

// Individual skeletons
<div className="grid grid-cols-4 gap-6">
  <LoadingStates.StatCard variant="client" />
  <LoadingStates.StatCard variant="client" />
  <LoadingStates.StatCard variant="client" />
  <LoadingStates.StatCard variant="client" />
</div>

<LoadingStates.Chart height={300} />

<LoadingStates.Table rows={8} variant="agency" />

// Conditional rendering
{loading ? (
  <LoadingStates.DashboardOverview variant={variant} />
) : (
  <ActualDashboardContent />
)}
```

## Styling Comparison

### Agency vs Client

**Agency Styling (Technical, Dense):**
- Compact padding (p-4)
- Smaller text (text-sm, text-lg)
- More data per screen
- Uppercase labels
- Sortable tables
- No educational content
- 5-column grids

**Client Styling (Friendly, Spacious):**
- Generous padding (p-6)
- Larger text (text-lg, text-3xl)
- Easier to read
- Sentence case labels
- Simple tables
- Explanatory content
- 4-column grids

```tsx
// Agency: Fits more data
<div className="grid grid-cols-5 gap-4">
  <StatCard variant="agency" {...} />
</div>

// Client: Easier to read
<div className="grid grid-cols-4 gap-6">
  <StatCard variant="client" {...} />
</div>
```

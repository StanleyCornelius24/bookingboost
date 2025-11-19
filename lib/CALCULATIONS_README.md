# Calculations Library

Centralized calculation functions for booking analytics, channel performance, ROI analysis, and commission savings.

## Overview

The `calculations.ts` library provides consistent, reusable functions for all dashboard calculations. This ensures:
- **Consistency**: Same calculations across all pages
- **Maintainability**: Fix bugs in one place
- **Type Safety**: Full TypeScript support
- **Testability**: Easy to test with sample data

## Core Functions

### 1. calculateChannelStats(bookings)

Aggregates bookings by channel and calculates performance metrics.

**Returns:**
```typescript
ChannelStats[] = {
  channel: string
  bookings: number
  revenue: number
  commissionPaid: number
  commissionRate: number
  isDirect: boolean
  percentage: number
  emoji?: string
}[]
```

**Example:**
```typescript
import { calculateChannelStats } from '@/lib/calculations'

const stats = calculateChannelStats(bookings)
// [
//   { channel: 'Direct Website', bookings: 85, revenue: 156000, ... },
//   { channel: 'Booking.com', bookings: 42, revenue: 98000, ... }
// ]
```

**Use Cases:**
- Channels page table
- Dashboard channel breakdown
- Agency analytics

---

### 2. calculateDirectPercentage(bookings)

Calculates the percentage of bookings that are direct (non-OTA).

**Returns:** `number` (0-100)

**Example:**
```typescript
const directPct = calculateDirectPercentage(bookings)
// 67.5 (meaning 67.5% are direct)
```

**Use Cases:**
- Overview stats
- Progress tracking
- Health status determination

---

### 3. calculateOTACommissions(bookings, estimateIfMissing?)

Calculates total commissions paid to OTAs.

**Parameters:**
- `bookings`: Booking array
- `estimateIfMissing` (default: true): Estimate commissions if not provided

**Returns:** `number` (total commission amount)

**Example:**
```typescript
const commissions = calculateOTACommissions(bookings)
// 29500 (R29,500)

// Don't estimate, only use actual commission_paid values
const actualOnly = calculateOTACommissions(bookings, false)
```

**Use Cases:**
- Commission tracking
- Savings calculations
- Monthly expense reports

---

### 4. calculateBlendedROI(marketingSpend, directRevenue)

Calculates return on investment from marketing spend.

**Formula:** `ROI = Direct Revenue / Marketing Spend`

**Returns:** `number` (multiplier, e.g., 3.2 = 3.2x return)

**Example:**
```typescript
const roi = calculateBlendedROI(5000, 16000)
// 3.2 (R3.20 earned per R1 spent)
```

**Use Cases:**
- Marketing page
- ROI tracking
- Budget planning

---

### 5. calculateCommissionSavings(bookings, currentDirectPct, targetDirectPct)

Calculates potential savings from improving direct booking percentage.

**Returns:**
```typescript
{
  monthly: number
  annual: number
  improvement: number
  averageCommissionRate: number
}
```

**Example:**
```typescript
const savings = calculateCommissionSavings(bookings, 50, 70)
// {
//   monthly: 8500,
//   annual: 102000,
//   improvement: 20,
//   averageCommissionRate: 15
// }
```

**Use Cases:**
- Progress page savings calculator
- Goal setting
- Client motivation

---

### 6. getMonthlyTrends(bookings, monthsBack?)

Aggregates bookings into monthly trend data.

**Parameters:**
- `bookings`: Booking array
- `monthsBack` (default: 6): Number of months to analyze

**Returns:**
```typescript
MonthlyTrend[] = {
  month: string          // 'Jan', 'Feb', etc.
  date: string           // 'YYYY-MM'
  revenue: number
  bookings: number
  directBookings: number
  otaBookings: number
  directRevenue: number
  otaRevenue: number
  directPercentage: number
  commissionsPaid: number
}[]
```

**Example:**
```typescript
const trends = getMonthlyTrends(bookings, 6)
// [
//   { month: 'Jan', revenue: 125000, directPercentage: 45, ... },
//   { month: 'Feb', revenue: 142000, directPercentage: 52, ... }
// ]
```

**Use Cases:**
- Trend charts
- Progress page comparison
- Historical analysis

---

### 7. determineHealthStatus(directPercentage)

Determines business health based on direct booking percentage.

**Returns:** `'excellent' | 'good' | 'warning' | 'urgent'`

**Thresholds:**
- **Excellent**: 70%+
- **Good**: 60-69%
- **Warning**: 50-59%
- **Urgent**: Below 50%

**Example:**
```typescript
const status = determineHealthStatus(67)
// 'good'

// With message
const health = getHealthStatusWithMessage(67)
// {
//   status: 'good',
//   message: 'Good performance! You\'re above industry average.',
//   color: 'blue'
// }
```

**Use Cases:**
- Dashboard status indicators
- Alert systems
- Performance badges

---

## Additional Helper Functions

### formatCurrency(amount, currency?)
Format numbers as currency.

```typescript
formatCurrency(12500, 'ZAR')
// 'R 12,500'
```

### formatPercentage(value, decimals?)
Format numbers as percentage.

```typescript
formatPercentage(67.5, 1)
// '67.5%'
```

### calculateAverageBookingValue(bookings)
Calculate average revenue per booking.

```typescript
calculateAverageBookingValue(bookings)
// 2054
```

### calculateConversionRate(bookings, clicks)
Calculate conversion rate from clicks to bookings.

```typescript
calculateConversionRate(42, 850)
// 4.94 (4.94% conversion rate)
```

### calculatePercentageChange(current, previous)
Calculate percentage change between two values.

```typescript
calculatePercentageChange(345000, 312000)
// 10.58 (10.58% increase)
```

---

## Usage in Pages

### Client Dashboard Overview

```typescript
import {
  calculateDirectPercentage,
  calculateOTACommissions,
  getMonthlyTrends
} from '@/lib/calculations'

export default async function ClientDashboard() {
  const bookings = await fetchBookings()

  const directPct = calculateDirectPercentage(bookings)
  const commissions = calculateOTACommissions(bookings)
  const trends = getMonthlyTrends(bookings, 6)

  return (
    <div>
      <StatCard title="Direct %" value={`${directPct.toFixed(1)}%`} />
      <StatCard title="Commissions" value={formatCurrency(commissions)} />
      <RevenueChart data={trends} />
    </div>
  )
}
```

### Progress Page

```typescript
import {
  calculateCommissionSavings,
  getMonthlyTrends,
  calculateDirectPercentage
} from '@/lib/calculations'

const currentDirect = calculateDirectPercentage(bookings)
const savings = calculateCommissionSavings(bookings, currentDirect, 70)
const trends = getMonthlyTrends(bookings, 6)

return (
  <div>
    <SavingsCalculator savings={savings} />
    <TrendChart data={trends} />
  </div>
)
```

### Marketing Page

```typescript
import { calculateBlendedROI } from '@/lib/calculations'

const directRevenue = bookings
  .filter(b => b.is_direct)
  .reduce((sum, b) => sum + b.revenue, 0)

const roi = calculateBlendedROI(marketingSpend, directRevenue)

return <StatCard title="ROI" value={`${roi.toFixed(1)}x`} />
```

### Channels Page

```typescript
import { calculateChannelStats, determineHealthStatus } from '@/lib/calculations'

const channels = calculateChannelStats(bookings)
const health = determineHealthStatus(directPct)

return (
  <div>
    <ChannelTable channels={channels} />
    <HealthBadge status={health} />
  </div>
)
```

---

## Testing

Run the test file to verify calculations:

```bash
# Sample test with mock data
ts-node lib/calculations.test.ts
```

See `calculations.test.ts` for comprehensive test examples with sample data.

---

## Best Practices

1. **Always use these functions** - Don't duplicate calculation logic in pages
2. **Handle empty arrays** - All functions safely handle empty/null inputs
3. **Commission estimation** - Functions estimate commissions when not available
4. **Consistent formatting** - Use helper functions for currency/percentage display
5. **Type safety** - Import and use the TypeScript types provided

---

## Channel Recognition

The library automatically recognizes channels and determines if they're direct:

**Direct Channels:**
- Direct Website
- Phone Booking
- Email Booking
- Walk-in
- Repeat Guest

**OTA Channels (with commission rates):**
- Booking.com (15%)
- Airbnb (15%)
- Expedia (20%)
- Agoda (15%)
- Hotels.com (18%)

Default OTA commission: 15%

---

## Files

- `calculations.ts` - Main library
- `calculations.examples.ts` - Usage examples
- `calculations.test.ts` - Test suite with sample data
- `CALCULATIONS_README.md` - This documentation

---

## Adding New Calculations

To add a new calculation function:

1. Add to `calculations.ts`
2. Add TypeScript types if needed
3. Add JSDoc comments
4. Add example to `calculations.examples.ts`
5. Add test to `calculations.test.ts`
6. Update this README

Example:

```typescript
/**
 * Calculate average daily rate (ADR)
 *
 * @param totalRevenue - Total revenue
 * @param nightsBooked - Total nights booked
 * @returns Average daily rate
 */
export function calculateADR(totalRevenue: number, nightsBooked: number): number {
  if (nightsBooked === 0) return 0
  return totalRevenue / nightsBooked
}
```

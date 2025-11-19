/**
 * Test file for calculation functions
 *
 * Run with: node --loader ts-node/esm calculations.test.ts
 * Or use your test framework of choice (Jest, Vitest, etc.)
 */

import {
  calculateChannelStats,
  calculateDirectPercentage,
  calculateOTACommissions,
  calculateBlendedROI,
  calculateCommissionSavings,
  getMonthlyTrends,
  determineHealthStatus,
  getHealthStatusWithMessage,
  type Booking
} from './calculations'

// Sample booking data
const sampleBookings: Booking[] = [
  // Direct bookings (no commission)
  {
    id: '1',
    channel: 'Direct Website',
    revenue: 2500,
    booking_date: '2024-01-15',
    commission_rate: 0,
    commission_paid: 0,
    is_direct: true
  },
  {
    id: '2',
    channel: 'Direct Website',
    revenue: 3200,
    booking_date: '2024-01-20',
    commission_rate: 0,
    commission_paid: 0,
    is_direct: true
  },
  {
    id: '3',
    channel: 'Phone Booking',
    revenue: 2800,
    booking_date: '2024-02-05',
    commission_rate: 0,
    commission_paid: 0,
    is_direct: true
  },

  // OTA bookings (with commission)
  {
    id: '4',
    channel: 'Booking.com',
    revenue: 2200,
    booking_date: '2024-01-10',
    commission_rate: 15,
    commission_paid: 330,
    is_direct: false
  },
  {
    id: '5',
    channel: 'Booking.com',
    revenue: 2600,
    booking_date: '2024-02-12',
    commission_rate: 15,
    commission_paid: 390,
    is_direct: false
  },
  {
    id: '6',
    channel: 'Airbnb',
    revenue: 1800,
    booking_date: '2024-01-25',
    commission_rate: 15,
    commission_paid: 270,
    is_direct: false
  },
  {
    id: '7',
    channel: 'Expedia',
    revenue: 2400,
    booking_date: '2024-02-18',
    commission_rate: 20,
    commission_paid: 480,
    is_direct: false
  },

  // More direct bookings
  {
    id: '8',
    channel: 'Direct Website',
    revenue: 2900,
    booking_date: '2024-02-22',
    commission_rate: 0,
    commission_paid: 0,
    is_direct: true
  },
  {
    id: '9',
    channel: 'Email Booking',
    revenue: 3100,
    booking_date: '2024-03-05',
    commission_rate: 0,
    commission_paid: 0,
    is_direct: true
  },
  {
    id: '10',
    channel: 'Direct Website',
    revenue: 2700,
    booking_date: '2024-03-10',
    commission_rate: 0,
    commission_paid: 0,
    is_direct: true
  }
]

console.log('='.repeat(60))
console.log('CALCULATION FUNCTIONS TEST SUITE')
console.log('='.repeat(60))

// Test 1: Channel Statistics
console.log('\n1. CHANNEL STATISTICS')
console.log('-'.repeat(60))
const channelStats = calculateChannelStats(sampleBookings)
channelStats.forEach(stat => {
  console.log(`${stat.channel}:`)
  console.log(`  Bookings: ${stat.bookings}`)
  console.log(`  Revenue: R ${stat.revenue.toLocaleString()}`)
  console.log(`  Commission: R ${stat.commissionPaid.toLocaleString()}`)
  console.log(`  Commission Rate: ${stat.commissionRate.toFixed(1)}%`)
  console.log(`  Is Direct: ${stat.isDirect}`)
  console.log(`  Emoji: ${stat.emoji}`)
  console.log('')
})

// Test 2: Direct Percentage
console.log('\n2. DIRECT BOOKING PERCENTAGE')
console.log('-'.repeat(60))
const directPct = calculateDirectPercentage(sampleBookings)
console.log(`Direct Booking %: ${directPct.toFixed(1)}%`)
console.log(`(${sampleBookings.filter(b => b.is_direct).length} out of ${sampleBookings.length} bookings)`)

// Test 3: OTA Commissions
console.log('\n3. TOTAL OTA COMMISSIONS')
console.log('-'.repeat(60))
const otaCommissions = calculateOTACommissions(sampleBookings)
console.log(`Total Commissions Paid: R ${otaCommissions.toLocaleString()}`)

const totalRevenue = sampleBookings.reduce((sum, b) => sum + b.revenue, 0)
const commissionPercentage = (otaCommissions / totalRevenue) * 100
console.log(`As % of total revenue: ${commissionPercentage.toFixed(1)}%`)

// Test 4: Blended ROI
console.log('\n4. MARKETING ROI CALCULATION')
console.log('-'.repeat(60))
const directRevenue = sampleBookings
  .filter(b => b.is_direct)
  .reduce((sum, b) => sum + b.revenue, 0)
const marketingSpend = 4500
const roi = calculateBlendedROI(marketingSpend, directRevenue)
console.log(`Marketing Spend: R ${marketingSpend.toLocaleString()}`)
console.log(`Direct Revenue: R ${directRevenue.toLocaleString()}`)
console.log(`ROI: ${roi.toFixed(1)}x`)
console.log(`Interpretation: For every R1 spent, you earn R${roi.toFixed(2)}`)

// Test 5: Commission Savings
console.log('\n5. COMMISSION SAVINGS POTENTIAL')
console.log('-'.repeat(60))
const currentDirect = calculateDirectPercentage(sampleBookings)
const targetDirect = 70
const savings = calculateCommissionSavings(sampleBookings, currentDirect, targetDirect)
console.log(`Current Direct %: ${currentDirect.toFixed(1)}%`)
console.log(`Target Direct %: ${targetDirect}%`)
console.log(`Improvement Needed: ${savings.improvement.toFixed(1)} percentage points`)
console.log(`Average Commission Rate: ${savings.averageCommissionRate.toFixed(1)}%`)
console.log(`Monthly Savings Potential: R ${savings.monthly.toLocaleString()}`)
console.log(`Annual Savings Potential: R ${savings.annual.toLocaleString()}`)

// Test 6: Monthly Trends
console.log('\n6. MONTHLY TRENDS')
console.log('-'.repeat(60))
const trends = getMonthlyTrends(sampleBookings, 3)
trends.forEach(trend => {
  console.log(`${trend.month}:`)
  console.log(`  Total Revenue: R ${trend.revenue.toLocaleString()}`)
  console.log(`  Bookings: ${trend.bookings}`)
  console.log(`  Direct %: ${trend.directPercentage.toFixed(1)}%`)
  console.log(`  Direct Bookings: ${trend.directBookings}`)
  console.log(`  OTA Bookings: ${trend.otaBookings}`)
  console.log(`  Commissions: R ${trend.commissionsPaid.toLocaleString()}`)
  console.log('')
})

// Test 7: Health Status
console.log('\n7. HEALTH STATUS DETERMINATION')
console.log('-'.repeat(60))
const testPercentages = [35, 55, 65, 75]
testPercentages.forEach(pct => {
  const health = getHealthStatusWithMessage(pct)
  console.log(`${pct}% Direct:`)
  console.log(`  Status: ${health.status.toUpperCase()}`)
  console.log(`  Color: ${health.color}`)
  console.log(`  Message: ${health.message}`)
  console.log('')
})

// Summary
console.log('\n' + '='.repeat(60))
console.log('SUMMARY')
console.log('='.repeat(60))
console.log(`Total Bookings: ${sampleBookings.length}`)
console.log(`Total Revenue: R ${totalRevenue.toLocaleString()}`)
console.log(`Direct Booking %: ${directPct.toFixed(1)}%`)
console.log(`OTA Commissions: R ${otaCommissions.toLocaleString()}`)
console.log(`Health Status: ${determineHealthStatus(directPct).toUpperCase()}`)
console.log('')

// Expected Results Validation
console.log('='.repeat(60))
console.log('VALIDATION')
console.log('='.repeat(60))

const validations = [
  {
    test: 'Direct percentage should be 60%',
    expected: 60,
    actual: directPct,
    passed: Math.abs(directPct - 60) < 1
  },
  {
    test: 'Total commissions should be R 1,470',
    expected: 1470,
    actual: otaCommissions,
    passed: otaCommissions === 1470
  },
  {
    test: 'Should have 4 unique channels',
    expected: 4,
    actual: channelStats.length,
    passed: channelStats.length === 4
  },
  {
    test: 'Health status should be GOOD',
    expected: 'good',
    actual: determineHealthStatus(directPct),
    passed: determineHealthStatus(directPct) === 'good'
  }
]

validations.forEach(v => {
  const status = v.passed ? '✅ PASS' : '❌ FAIL'
  console.log(`${status}: ${v.test}`)
  if (!v.passed) {
    console.log(`  Expected: ${v.expected}`)
    console.log(`  Actual: ${v.actual}`)
  }
})

console.log('\n' + '='.repeat(60))
console.log('Tests completed!')
console.log('='.repeat(60))

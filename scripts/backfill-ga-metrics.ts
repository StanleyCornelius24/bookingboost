/**
 * Backfill Google Analytics metrics for the past 60 days
 * Run this once to populate historical data
 */

const CRON_SECRET = process.env.CRON_SECRET || 'O/UHyiX+VKlRoKJmGmaGiTNlvZdpTY7kuPxPjMpVJVo='
const API_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

async function backfillMetrics() {
  console.log('Starting GA metrics backfill...')

  // Backfill last 60 days
  const daysToBackfill = 60
  let successCount = 0
  let errorCount = 0

  for (let i = 1; i <= daysToBackfill; i++) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateString = date.toISOString().split('T')[0]

    console.log(`\nFetching metrics for ${dateString}...`)

    try {
      const response = await fetch(
        `${API_URL}/api/cron/sync-ga-metrics?date=${dateString}`,
        {
          headers: {
            'Authorization': `Bearer ${CRON_SECRET}`
          }
        }
      )

      const data = await response.json()

      if (data.success) {
        console.log(`✓ ${dateString}: ${data.successCount} hotels synced`)
        successCount++
      } else {
        console.error(`✗ ${dateString}: Failed -`, data.error)
        errorCount++
      }

      // Rate limit: wait 2 seconds between requests to avoid hitting GA API limits
      await new Promise(resolve => setTimeout(resolve, 2000))

    } catch (error) {
      console.error(`✗ ${dateString}: Error -`, error)
      errorCount++
    }
  }

  console.log(`\n========================================`)
  console.log(`Backfill complete!`)
  console.log(`Success: ${successCount} days`)
  console.log(`Errors: ${errorCount} days`)
  console.log(`========================================`)
}

backfillMetrics()

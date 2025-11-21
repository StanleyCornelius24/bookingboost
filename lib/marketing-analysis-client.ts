export function calculateMarketingROI(spend: number, conversions: number, avgBookingValue: number = 120): number {
  if (spend === 0) return 0
  return (conversions * avgBookingValue) / spend
}

export function formatCurrency(amount: number, currency: string = 'ZAR'): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: currency
  }).format(amount)
}

export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-ZA').format(value)
}

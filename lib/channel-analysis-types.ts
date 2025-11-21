export interface ChannelAnalysis {
  channel: string
  bookingsCount: number
  totalRevenue: number
  percentageOfTotal: number
  commissionRate: number
  commissionPaid: number
  netRevenue: number
  avgBookingValue: number
}

export interface ChannelAnalysisData {
  channels: ChannelAnalysis[]
  summary: {
    totalBookings: number
    totalRevenue: number
    totalCommissions: number
    totalNetRevenue: number
    avgCommissionRate: number
  }
  chartData: ChannelChartData[]
}

export interface ChannelChartData {
  channel: string
  grossRevenue: number
  commission: number
  netRevenue: number
}

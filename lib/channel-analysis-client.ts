import { ChannelAnalysis } from './channel-analysis-types'

export function calculateCommissionBleed(channels: ChannelAnalysis[]): {
  totalLost: number
  percentageLost: number
  biggestOffenders: Array<{ channel: string; amount: number; percentage: number }>
} {
  const totalRevenue = channels.reduce((sum, ch) => sum + ch.totalRevenue, 0)
  const totalCommissions = channels.reduce((sum, ch) => sum + ch.commissionPaid, 0)

  const percentageLost = totalRevenue > 0 ? (totalCommissions / totalRevenue) * 100 : 0

  // Find biggest commission offenders
  const offenders = channels
    .filter(ch => ch.commissionPaid > 0)
    .map(ch => ({
      channel: ch.channel,
      amount: ch.commissionPaid,
      percentage: ch.commissionRate * 100
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 3)

  return {
    totalLost: totalCommissions,
    percentageLost,
    biggestOffenders: offenders
  }
}

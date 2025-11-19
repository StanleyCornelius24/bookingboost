'use client'

import { useState } from 'react'
import { ArrowUpDown, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ChannelData {
  channel: string
  emoji?: string
  bookings: number
  revenue: number
  commissionPaid: number
  isDirect?: boolean
}

interface ChannelTableProps {
  channels: ChannelData[]
  currency?: string
  variant?: 'agency' | 'client'
  showExplanations?: boolean
  onSort?: (field: keyof ChannelData) => void
}

export function ChannelTable({
  channels,
  currency = 'ZAR',
  variant = 'client',
  showExplanations = true,
}: ChannelTableProps) {
  const [sortField, setSortField] = useState<keyof ChannelData | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  const isAgency = variant === 'agency'

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-ZA').format(value)
  }

  const handleSort = (field: keyof ChannelData) => {
    if (!isAgency) return // Only agency can sort

    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const sortedChannels = [...channels].sort((a, b) => {
    if (!sortField) return 0

    const aVal = a[sortField]
    const bVal = b[sortField]

    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal
    }

    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortDirection === 'asc'
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal)
    }

    return 0
  })

  const totalBookings = channels.reduce((sum, ch) => sum + ch.bookings, 0)
  const totalRevenue = channels.reduce((sum, ch) => sum + ch.revenue, 0)
  const totalCommissions = channels.reduce((sum, ch) => sum + ch.commissionPaid, 0)

  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
      <div className={cn('px-6 border-b', isAgency ? 'py-3' : 'py-4')}>
        <h3 className={cn('font-semibold text-gray-900', isAgency ? 'text-lg' : 'text-xl')}>
          Channel Details
        </h3>
        {!isAgency && showExplanations && (
          <p className="text-sm text-gray-600 mt-1">
            See where your bookings come from and how much commission you pay
          </p>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className={cn(
                'text-left text-sm font-medium text-gray-500 uppercase',
                isAgency ? 'px-4 py-2' : 'px-6 py-4'
              )}>
                {isAgency ? (
                  <button
                    onClick={() => handleSort('channel')}
                    className="flex items-center hover:text-gray-700"
                  >
                    Channel
                    <ArrowUpDown className="ml-1 h-3 w-3" />
                  </button>
                ) : (
                  'Channel'
                )}
              </th>
              <th className={cn(
                'text-center text-sm font-medium text-gray-500 uppercase',
                isAgency ? 'px-4 py-2' : 'px-6 py-4'
              )}>
                {isAgency ? (
                  <button
                    onClick={() => handleSort('bookings')}
                    className="flex items-center justify-center hover:text-gray-700 w-full"
                  >
                    Bookings
                    <ArrowUpDown className="ml-1 h-3 w-3" />
                  </button>
                ) : (
                  'Bookings'
                )}
              </th>
              <th className={cn(
                'text-right text-sm font-medium text-gray-500 uppercase',
                isAgency ? 'px-4 py-2' : 'px-6 py-4'
              )}>
                {isAgency ? (
                  <button
                    onClick={() => handleSort('revenue')}
                    className="flex items-center justify-end hover:text-gray-700 w-full"
                  >
                    Revenue
                    <ArrowUpDown className="ml-1 h-3 w-3" />
                  </button>
                ) : (
                  'Revenue'
                )}
              </th>
              <th className={cn(
                'text-right text-sm font-medium text-gray-500 uppercase',
                isAgency ? 'px-4 py-2' : 'px-6 py-4'
              )}>
                {isAgency ? (
                  <button
                    onClick={() => handleSort('commissionPaid')}
                    className="flex items-center justify-end hover:text-gray-700 w-full"
                  >
                    Commission
                    <ArrowUpDown className="ml-1 h-3 w-3" />
                  </button>
                ) : (
                  'Commission Paid'
                )}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sortedChannels.map((channel, index) => (
              <tr
                key={index}
                className={cn(
                  channel.isDirect && !isAgency && 'bg-green-50'
                )}
              >
                <td className={cn('whitespace-nowrap', isAgency ? 'px-4 py-2' : 'px-6 py-4')}>
                  <div className="flex items-center">
                    {channel.emoji && !isAgency && (
                      <span className="text-2xl mr-3">{channel.emoji}</span>
                    )}
                    <span className={cn(
                      isAgency ? 'text-sm' : 'text-lg',
                      channel.isDirect && !isAgency ? 'font-semibold text-green-800' : 'text-gray-900'
                    )}>
                      {channel.channel}
                    </span>
                  </div>
                </td>
                <td className={cn('whitespace-nowrap text-center', isAgency ? 'px-4 py-2' : 'px-6 py-4')}>
                  <span className={cn('text-gray-900', isAgency ? 'text-sm' : 'text-lg')}>
                    {formatNumber(channel.bookings)}
                  </span>
                </td>
                <td className={cn('whitespace-nowrap text-right', isAgency ? 'px-4 py-2' : 'px-6 py-4')}>
                  <span className={cn('font-medium text-gray-900', isAgency ? 'text-sm' : 'text-lg')}>
                    {formatCurrency(channel.revenue)}
                  </span>
                </td>
                <td className={cn('whitespace-nowrap text-right', isAgency ? 'px-4 py-2' : 'px-6 py-4')}>
                  <span className={cn(
                    'font-medium',
                    isAgency ? 'text-sm' : 'text-lg',
                    channel.commissionPaid === 0 ? 'text-green-600' : 'text-red-600'
                  )}>
                    {formatCurrency(channel.commissionPaid)}
                  </span>
                </td>
              </tr>
            ))}

            {/* Totals Row */}
            <tr className="bg-gray-100 font-bold">
              <td className={cn('whitespace-nowrap', isAgency ? 'px-4 py-2' : 'px-6 py-4')}>
                <span className={cn('text-gray-900', isAgency ? 'text-sm' : 'text-lg')}>TOTAL</span>
              </td>
              <td className={cn('whitespace-nowrap text-center', isAgency ? 'px-4 py-2' : 'px-6 py-4')}>
                <span className={cn('text-gray-900', isAgency ? 'text-sm' : 'text-lg')}>
                  {formatNumber(totalBookings)}
                </span>
              </td>
              <td className={cn('whitespace-nowrap text-right', isAgency ? 'px-4 py-2' : 'px-6 py-4')}>
                <span className={cn('text-gray-900', isAgency ? 'text-sm' : 'text-lg')}>
                  {formatCurrency(totalRevenue)}
                </span>
              </td>
              <td className={cn('whitespace-nowrap text-right', isAgency ? 'px-4 py-2' : 'px-6 py-4')}>
                <span className={cn('text-red-600', isAgency ? 'text-sm' : 'text-lg')}>
                  {formatCurrency(totalCommissions)}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {!isAgency && showExplanations && (
        <div className="px-6 py-4 bg-blue-50 border-t border-blue-100">
          <div className="flex items-start">
            <Info className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Understanding Commission Costs</p>
              <p>
                Green highlighted rows show your direct bookings (no commission). Red amounts show what
                you're paying to OTAs. Increasing your direct booking percentage saves you money!
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

'use client'

import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { cn } from '@/lib/utils'

export interface RevenueChartData {
  month?: string
  date?: string
  revenue: number
  directRevenue?: number
  otaRevenue?: number
  [key: string]: any
}

interface RevenueChartProps {
  data: RevenueChartData[]
  variant?: 'agency' | 'client'
  currency?: string
  title?: string
  height?: number
  showLegend?: boolean
  className?: string
}

export function RevenueChart({
  data,
  variant = 'client',
  currency = 'ZAR',
  title = 'Revenue Trend',
  height = 300,
  showLegend = false,
  className
}: RevenueChartProps) {
  const isAgency = variant === 'agency'

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  const formatYAxis = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}K`
    }
    return value.toString()
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload) return null

    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
        <p className="font-medium text-gray-900 mb-2">
          {label}
        </p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between space-x-4">
            <span className="text-sm" style={{ color: entry.color }}>
              {entry.name}:
            </span>
            <span className="font-semibold text-sm" style={{ color: entry.color }}>
              {formatCurrency(entry.value)}
            </span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className={cn('bg-white p-6 rounded-xl shadow-sm border', className)}>
      <h3 className={cn('font-semibold text-gray-900 mb-6', isAgency ? 'text-lg' : 'text-xl')}>
        {title}
      </h3>

      <ResponsiveContainer width="100%" height={height}>
        {isAgency ? (
          // Agency: Multi-line chart with more detail
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="month"
              axisLine={{ stroke: '#9ca3af' }}
              tick={{ fontSize: 12, fill: '#6b7280' }}
            />
            <YAxis
              axisLine={{ stroke: '#9ca3af' }}
              tick={{ fontSize: 12, fill: '#6b7280' }}
              tickFormatter={formatYAxis}
            />
            <Tooltip content={<CustomTooltip />} />
            {showLegend && <Legend />}

            {/* Total Revenue Line */}
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ fill: '#3b82f6', r: 3 }}
              name="Total Revenue"
            />

            {/* Direct Revenue Line (if available) */}
            {data[0]?.directRevenue !== undefined && (
              <Line
                type="monotone"
                dataKey="directRevenue"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ fill: '#10b981', r: 3 }}
                name="Direct Revenue"
              />
            )}

            {/* OTA Revenue Line (if available) */}
            {data[0]?.otaRevenue !== undefined && (
              <Line
                type="monotone"
                dataKey="otaRevenue"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={{ fill: '#f59e0b', r: 3 }}
                name="OTA Revenue"
              />
            )}
          </LineChart>
        ) : (
          // Client: Single line with beautiful shading
          <AreaChart data={data}>
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.05}/>
              </linearGradient>
            </defs>
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#6B7280' }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#6B7280' }}
              tickFormatter={formatYAxis}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#3B82F6"
              strokeWidth={3}
              fill="url(#revenueGradient)"
              name="Revenue"
            />
          </AreaChart>
        )}
      </ResponsiveContainer>
    </div>
  )
}

import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: string | number
  change?: {
    value: number
    label: string
  }
  icon: LucideIcon
  variant?: 'agency' | 'client'
  subtitle?: string
  trend?: 'up' | 'down' | 'neutral'
  className?: string
}

export function StatCard({
  title,
  value,
  change,
  icon: Icon,
  variant = 'client',
  subtitle,
  trend,
  className
}: StatCardProps) {
  const isAgency = variant === 'agency'

  const getTrendColor = () => {
    if (!trend) return 'text-gray-500'
    if (trend === 'up') return 'text-green-600'
    if (trend === 'down') return 'text-red-600'
    return 'text-gray-500'
  }

  return (
    <div
      className={cn(
        'bg-white rounded-xl shadow-sm border',
        isAgency ? 'p-4' : 'p-6',
        className
      )}
    >
      <div className={cn('flex items-center', isAgency ? 'mb-2' : 'mb-4')}>
        <div className="flex-1">
          <p className={cn(
            'text-gray-600 font-medium',
            isAgency ? 'text-xs uppercase tracking-wide' : 'text-sm'
          )}>
            {title}
          </p>
          {subtitle && !isAgency && (
            <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
          )}
        </div>
        <Icon className={cn(
          'text-gray-400',
          isAgency ? 'h-4 w-4' : 'h-5 w-5'
        )} />
      </div>

      <div className={cn('font-bold text-gray-900', isAgency ? 'text-xl' : 'text-3xl')}>
        {value}
      </div>

      {change && (
        <div className={cn('flex items-center mt-1', isAgency ? 'text-xs' : 'text-sm')}>
          <span className={cn('font-medium', getTrendColor())}>
            {change.value > 0 ? '+' : ''}{change.value}%
          </span>
          <span className="text-gray-500 ml-1">{change.label}</span>
        </div>
      )}

      {subtitle && isAgency && (
        <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
      )}
    </div>
  )
}

import { cn } from '@/lib/utils'

// Base skeleton components
function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'animate-pulse bg-gray-200 rounded',
        className
      )}
    />
  )
}

// Skeleton for StatCard
export function StatCardSkeleton({ variant = 'client' }: { variant?: 'agency' | 'client' }) {
  const isAgency = variant === 'agency'

  return (
    <div className={cn(
      'bg-white rounded-xl shadow-sm border',
      isAgency ? 'p-4' : 'p-6'
    )}>
      <div className="flex items-center justify-between mb-4">
        <Skeleton className={cn('h-4 rounded', isAgency ? 'w-20' : 'w-24')} />
        <Skeleton className={cn('rounded-full', isAgency ? 'h-4 w-4' : 'h-5 w-5')} />
      </div>
      <Skeleton className={cn('h-8 rounded mb-2', isAgency ? 'w-16' : 'w-24')} />
      <Skeleton className="h-3 w-20 rounded" />
    </div>
  )
}

// Skeleton for charts
export function ChartSkeleton({ height = 300 }: { height?: number }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border">
      <Skeleton className="h-6 w-32 rounded mb-6" />
      <Skeleton className="w-full rounded" style={{ height: `${height}px` }} />
    </div>
  )
}

// Skeleton for tables
export function TableSkeleton({ rows = 5, variant = 'client' }: { rows?: number; variant?: 'agency' | 'client' }) {
  const isAgency = variant === 'agency'

  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
      <div className={cn('px-6 border-b', isAgency ? 'py-3' : 'py-4')}>
        <Skeleton className="h-6 w-40 rounded" />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              {[1, 2, 3, 4].map((i) => (
                <th key={i} className={cn(isAgency ? 'px-4 py-2' : 'px-6 py-4')}>
                  <Skeleton className="h-4 w-16 rounded mx-auto" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {Array.from({ length: rows }).map((_, i) => (
              <tr key={i}>
                {[1, 2, 3, 4].map((j) => (
                  <td key={j} className={cn('whitespace-nowrap', isAgency ? 'px-4 py-2' : 'px-6 py-4')}>
                    <Skeleton className="h-4 w-20 rounded mx-auto" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Dashboard Overview Loading
export function DashboardOverviewLoading({ variant = 'client' }: { variant?: 'agency' | 'client' }) {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Skeleton className="h-8 w-64 rounded mb-4" />
        <Skeleton className="h-4 w-96 rounded" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCardSkeleton variant={variant} />
        <StatCardSkeleton variant={variant} />
        <StatCardSkeleton variant={variant} />
        <StatCardSkeleton variant={variant} />
      </div>

      {/* Chart */}
      <ChartSkeleton height={300} />

      {/* Additional content */}
      <Skeleton className="h-32 w-full rounded" />
    </div>
  )
}

// Channels Page Loading
export function ChannelsPageLoading({ variant = 'client' }: { variant?: 'agency' | 'client' }) {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Skeleton className="h-8 w-64 rounded mb-4" />
        <Skeleton className="h-4 w-96 rounded" />
      </div>

      {/* Chart */}
      <ChartSkeleton height={400} />

      {/* Table */}
      <TableSkeleton rows={6} variant={variant} />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCardSkeleton variant={variant} />
        <StatCardSkeleton variant={variant} />
        <StatCardSkeleton variant={variant} />
      </div>
    </div>
  )
}

// Marketing Page Loading
export function MarketingPageLoading() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Skeleton className="h-8 w-64 rounded mb-4" />
        <Skeleton className="h-4 w-96 rounded" />
      </div>

      {/* Warning Box */}
      <div className="bg-amber-50 border-2 border-amber-400 p-6 rounded-xl">
        <Skeleton className="h-6 w-80 rounded mb-3" />
        <Skeleton className="h-4 w-full rounded mb-2" />
        <Skeleton className="h-4 w-full rounded" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      {/* Table */}
      <TableSkeleton rows={4} />

      {/* Additional metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>
    </div>
  )
}

// Progress Page Loading
export function ProgressPageLoading() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Skeleton className="h-8 w-64 rounded mb-4" />
        <Skeleton className="h-4 w-96 rounded" />
      </div>

      {/* Comparison Table */}
      <TableSkeleton rows={4} />

      {/* Chart */}
      <ChartSkeleton height={400} />

      {/* Savings Calculator */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 p-8 rounded-xl">
        <Skeleton className="h-8 w-80 rounded mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <Skeleton className="h-4 w-40 rounded mb-2" />
            <Skeleton className="h-10 w-32 rounded mb-2" />
            <Skeleton className="h-3 w-full rounded" />
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <Skeleton className="h-4 w-40 rounded mb-2" />
            <Skeleton className="h-10 w-32 rounded mb-2" />
            <Skeleton className="h-3 w-full rounded" />
          </div>
        </div>
      </div>
    </div>
  )
}

// FAQ Page Loading
export function FAQPageLoading() {
  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div>
        <Skeleton className="h-8 w-64 rounded mb-4" />
        <Skeleton className="h-4 w-96 rounded" />
      </div>

      {/* FAQ Items */}
      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white border rounded-lg p-6">
            <Skeleton className="h-5 w-3/4 rounded mb-3" />
            <Skeleton className="h-4 w-full rounded mb-2" />
            <Skeleton className="h-4 w-full rounded mb-2" />
            <Skeleton className="h-4 w-2/3 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}

// Generic Page Loading
export function PageLoading({ variant = 'client' }: { variant?: 'agency' | 'client' }) {
  return (
    <div className="space-y-8">
      <div className="animate-pulse">
        <Skeleton className="h-8 w-64 rounded mb-4" />
        <Skeleton className="h-4 w-96 rounded" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCardSkeleton variant={variant} />
        <StatCardSkeleton variant={variant} />
        <StatCardSkeleton variant={variant} />
      </div>

      <ChartSkeleton />

      <TableSkeleton variant={variant} />
    </div>
  )
}

// Export all loading states
export const LoadingStates = {
  StatCard: StatCardSkeleton,
  Chart: ChartSkeleton,
  Table: TableSkeleton,
  DashboardOverview: DashboardOverviewLoading,
  Channels: ChannelsPageLoading,
  Marketing: MarketingPageLoading,
  Progress: ProgressPageLoading,
  FAQ: FAQPageLoading,
  Page: PageLoading,
}

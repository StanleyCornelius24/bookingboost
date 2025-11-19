'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Calendar as CalendarIcon, X } from 'lucide-react'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface DateRange {
  from: Date
  to: Date
}

interface DateRangeSelectorProps {
  variant?: 'agency' | 'client'
  onChange?: (range: DateRange) => void
  className?: string
}

type PresetRange = {
  label: string
  getValue: () => DateRange
  agencyOnly?: boolean
}

export function DateRangeSelector({
  variant = 'client',
  onChange,
  className
}: DateRangeSelectorProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [open, setOpen] = useState(false)
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({})

  const isAgency = variant === 'agency'

  // Preset ranges
  const presets: PresetRange[] = [
    {
      label: 'This Month',
      getValue: () => {
        const now = new Date()
        const from = new Date(now.getFullYear(), now.getMonth(), 1)
        const to = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        return { from, to }
      }
    },
    {
      label: 'Last Month',
      getValue: () => {
        const now = new Date()
        const from = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        const to = new Date(now.getFullYear(), now.getMonth(), 0)
        return { from, to }
      }
    },
    {
      label: 'Last 3 Months',
      getValue: () => {
        const now = new Date()
        const from = new Date(now.getFullYear(), now.getMonth() - 3, 1)
        const to = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        return { from, to }
      }
    },
    {
      label: 'Last 6 Months',
      getValue: () => {
        const now = new Date()
        const from = new Date(now.getFullYear(), now.getMonth() - 6, 1)
        const to = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        return { from, to }
      }
    },
    {
      label: 'This Year',
      getValue: () => {
        const now = new Date()
        const from = new Date(now.getFullYear(), 0, 1)
        const to = new Date(now.getFullYear(), 11, 31)
        return { from, to }
      },
      agencyOnly: true
    },
    {
      label: 'Last Year',
      getValue: () => {
        const now = new Date()
        const from = new Date(now.getFullYear() - 1, 0, 1)
        const to = new Date(now.getFullYear() - 1, 11, 31)
        return { from, to }
      },
      agencyOnly: true
    },
    {
      label: 'Last 12 Months',
      getValue: () => {
        const now = new Date()
        const from = new Date(now.getFullYear(), now.getMonth() - 12, 1)
        const to = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        return { from, to }
      },
      agencyOnly: true
    }
  ]

  // Filter presets based on variant
  const availablePresets = presets.filter(preset =>
    isAgency ? true : !preset.agencyOnly
  )

  // Initialize from URL params
  useEffect(() => {
    const fromParam = searchParams.get('from')
    const toParam = searchParams.get('to')

    if (fromParam && toParam) {
      setDateRange({
        from: new Date(fromParam),
        to: new Date(toParam)
      })
    } else {
      // Default to "This Month"
      const defaultRange = presets[0].getValue()
      setDateRange(defaultRange)
      updateURL(defaultRange)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const updateURL = (range: DateRange) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('from', range.from.toISOString().split('T')[0])
    params.set('to', range.to.toISOString().split('T')[0])
    router.push(`${pathname}?${params.toString()}`)
  }

  const handlePresetClick = (preset: PresetRange) => {
    const range = preset.getValue()
    setDateRange(range)
    updateURL(range)
    onChange?.(range)
    setOpen(false)
  }

  const handleCustomRangeSelect = (selected: Date | { from?: Date; to?: Date } | undefined) => {
    if (selected && typeof selected === 'object' && 'from' in selected) {
      setDateRange(selected)

      // Only update URL and close when both dates are selected
      if (selected.from && selected.to) {
        updateURL(selected as DateRange)
        onChange?.(selected as DateRange)
        setOpen(false)
      }
    }
  }

  const handleClear = () => {
    // Reset to "This Month"
    const defaultRange = presets[0].getValue()
    setDateRange(defaultRange)
    updateURL(defaultRange)
    onChange?.(defaultRange)
  }

  const formatDateRange = (range: { from?: Date; to?: Date }) => {
    if (!range.from) return 'Select date range'

    const formatDate = (date: Date) => {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    }

    if (!range.to) {
      return formatDate(range.from)
    }

    return `${formatDate(range.from)} - ${formatDate(range.to)}`
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'justify-start text-left font-normal',
              isAgency ? 'w-72' : 'w-80',
              !dateRange.from && 'text-gray-500'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {formatDateRange(dateRange)}
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-auto p-0" align="start">
          <div className={cn('flex', isAgency ? 'flex-col' : 'flex-row')}>
            {/* Quick Select Buttons */}
            <div className={cn(
              'flex flex-col gap-1 p-3 border-r border-gray-200',
              isAgency ? 'border-r-0 border-b' : ''
            )}>
              <div className={cn(
                'text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2',
                isAgency ? 'text-[10px]' : ''
              )}>
                {isAgency ? 'Quick Select' : 'Common Ranges'}
              </div>
              {availablePresets.map((preset) => (
                <Button
                  key={preset.label}
                  variant="ghost"
                  size={isAgency ? 'sm' : 'default'}
                  onClick={() => handlePresetClick(preset)}
                  className={cn(
                    'justify-start',
                    isAgency ? 'h-7 text-xs' : 'h-9 text-sm'
                  )}
                >
                  {preset.label}
                </Button>
              ))}
            </div>

            {/* Calendar */}
            <div>
              <div className="px-3 pt-3 pb-2 border-b border-gray-200">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Custom Range
                </div>
              </div>
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={handleCustomRangeSelect}
                numberOfMonths={isAgency ? 1 : 2}
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Clear button */}
      {(dateRange.from || dateRange.to) && (
        <Button
          variant="ghost"
          size={isAgency ? 'sm' : 'default'}
          onClick={handleClear}
          className={cn('h-10 px-2', isAgency && 'h-8')}
          title="Reset to This Month"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}

/**
 * Hook to get current date range from URL params
 * Use this in your data fetching functions
 */
export function useDateRange(): DateRange {
  const searchParams = useSearchParams()

  const from = searchParams.get('from')
  const to = searchParams.get('to')

  if (from && to) {
    return {
      from: new Date(from),
      to: new Date(to)
    }
  }

  // Default to "This Month"
  const now = new Date()
  return {
    from: new Date(now.getFullYear(), now.getMonth(), 1),
    to: new Date(now.getFullYear(), now.getMonth() + 1, 0)
  }
}

/**
 * Format date range for API queries
 */
export function formatDateRangeForAPI(range: DateRange) {
  return {
    from: range.from.toISOString().split('T')[0],
    to: range.to.toISOString().split('T')[0]
  }
}

/**
 * Check if date range matches a preset
 */
export function getActivePreset(range: DateRange): string | null {
  const presets: PresetRange[] = [
    {
      label: 'This Month',
      getValue: () => {
        const now = new Date()
        return {
          from: new Date(now.getFullYear(), now.getMonth(), 1),
          to: new Date(now.getFullYear(), now.getMonth() + 1, 0)
        }
      }
    },
    {
      label: 'Last Month',
      getValue: () => {
        const now = new Date()
        return {
          from: new Date(now.getFullYear(), now.getMonth() - 1, 1),
          to: new Date(now.getFullYear(), now.getMonth(), 0)
        }
      }
    },
    {
      label: 'Last 3 Months',
      getValue: () => {
        const now = new Date()
        return {
          from: new Date(now.getFullYear(), now.getMonth() - 3, 1),
          to: new Date(now.getFullYear(), now.getMonth() + 1, 0)
        }
      }
    }
  ]

  for (const preset of presets) {
    const presetRange = preset.getValue()
    if (
      range.from.toDateString() === presetRange.from.toDateString() &&
      range.to.toDateString() === presetRange.to.toDateString()
    ) {
      return preset.label
    }
  }

  return null
}

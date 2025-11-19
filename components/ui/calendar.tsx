"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "./button"

export interface CalendarProps {
  mode?: 'single' | 'range'
  selected?: Date | { from?: Date; to?: Date }
  onSelect?: (date: Date | { from?: Date; to?: Date } | undefined) => void
  className?: string
  numberOfMonths?: number
}

export function Calendar({
  mode = 'single',
  selected,
  onSelect,
  className,
  numberOfMonths = 1
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState(new Date())
  const [hoveredDate, setHoveredDate] = React.useState<Date | null>(null)

  const months = Array.from({ length: numberOfMonths }, (_, i) => {
    const date = new Date(currentMonth)
    date.setMonth(currentMonth.getMonth() + i)
    return date
  })

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days: (Date | null)[] = []

    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }

    // Add actual days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i))
    }

    return days
  }

  const isSameDay = (date1: Date | null | undefined, date2: Date | null | undefined) => {
    if (!date1 || !date2) return false
    return (
      date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear()
    )
  }

  const isDateInRange = (date: Date, range: { from?: Date; to?: Date } | undefined) => {
    if (!range?.from || !date) return false

    const compareDate = date.getTime()
    const fromTime = range.from.getTime()

    if (range.to) {
      const toTime = range.to.getTime()
      return compareDate >= fromTime && compareDate <= toTime
    }

    // If we're hovering and only have 'from', show preview
    if (hoveredDate && mode === 'range') {
      const hoveredTime = hoveredDate.getTime()
      const start = Math.min(fromTime, hoveredTime)
      const end = Math.max(fromTime, hoveredTime)
      return compareDate >= start && compareDate <= end
    }

    return false
  }

  const handleDayClick = (date: Date) => {
    if (mode === 'single') {
      onSelect?.(date)
    } else {
      const rangeSelected = selected as { from?: Date; to?: Date } | undefined

      if (!rangeSelected?.from || (rangeSelected.from && rangeSelected.to)) {
        // Start new range
        onSelect?.({ from: date, to: undefined })
      } else {
        // Complete range
        const from = rangeSelected.from
        const to = date
        onSelect?.(from.getTime() > to.getTime() ? { from: to, to: from } : { from, to })
      }
    }
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return isSameDay(date, today)
  }

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))
  }

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))
  }

  return (
    <div className={cn('p-3', className)}>
      <div className={cn('flex gap-4', numberOfMonths > 1 && 'flex-row')}>
        {months.map((month, monthIndex) => (
          <div key={monthIndex}>
            {/* Month Header */}
            <div className="flex items-center justify-between mb-4">
              {monthIndex === 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={previousMonth}
                  className="h-7 w-7 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              )}
              <div className={cn('font-semibold text-sm flex-1 text-center', monthIndex > 0 && 'ml-9')}>
                {month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </div>
              {monthIndex === numberOfMonths - 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={nextMonth}
                  className="h-7 w-7 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                <div
                  key={day}
                  className="text-xs font-medium text-gray-500 text-center h-8 flex items-center justify-center"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1">
              {getDaysInMonth(month).map((day, index) => {
                if (!day) {
                  return <div key={`empty-${index}`} className="h-8" />
                }

                const isSelected = mode === 'single'
                  ? isSameDay(day, selected as Date)
                  : mode === 'range' && selected
                  ? isSameDay(day, (selected as any).from) || isSameDay(day, (selected as any).to)
                  : false

                const inRange = mode === 'range' ? isDateInRange(day, selected as any) : false
                const isStart = mode === 'range' && isSameDay(day, (selected as any)?.from)
                const isEnd = mode === 'range' && isSameDay(day, (selected as any)?.to)

                return (
                  <button
                    key={index}
                    onClick={() => handleDayClick(day)}
                    onMouseEnter={() => setHoveredDate(day)}
                    onMouseLeave={() => setHoveredDate(null)}
                    className={cn(
                      'h-8 w-8 text-sm rounded-md transition-colors',
                      'hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500',
                      isSelected && 'bg-blue-600 text-white hover:bg-blue-700',
                      inRange && !isSelected && 'bg-blue-100',
                      (isStart || isEnd) && 'bg-blue-600 text-white',
                      isToday(day) && !isSelected && 'border border-blue-600',
                      !isSelected && !inRange && 'text-gray-900'
                    )}
                  >
                    {day.getDate()}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

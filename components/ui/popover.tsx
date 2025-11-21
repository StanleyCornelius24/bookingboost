"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

type PopoverContextValue = {
  open: boolean
  setOpen: (open: boolean) => void
}

const PopoverContext = React.createContext<PopoverContextValue | undefined>(undefined)

function usePopover() {
  const context = React.useContext(PopoverContext)
  if (!context) {
    throw new Error("Popover components must be used within a Popover")
  }
  return context
}

interface PopoverProps {
  children: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function Popover({ children, open: controlledOpen, onOpenChange }: PopoverProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false)

  const open = controlledOpen !== undefined ? controlledOpen : uncontrolledOpen
  const setOpen = onOpenChange || setUncontrolledOpen

  return (
    <PopoverContext.Provider value={{ open, setOpen }}>
      <div className="relative inline-block">
        {children}
      </div>
    </PopoverContext.Provider>
  )
}

interface PopoverTriggerProps {
  children: React.ReactNode
  asChild?: boolean
  className?: string
}

export function PopoverTrigger({ children, asChild, className }: PopoverTriggerProps) {
  const { open, setOpen } = usePopover()

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      onClick: (e: React.MouseEvent) => {
        setOpen(!open)
        if ((children.props as any).onClick) {
          (children.props as any).onClick(e)
        }
      }
    } as any)
  }

  return (
    <button
      type="button"
      onClick={() => setOpen(!open)}
      className={className}
    >
      {children}
    </button>
  )
}

interface PopoverContentProps {
  children: React.ReactNode
  align?: 'start' | 'center' | 'end'
  className?: string
  sideOffset?: number
}

export function PopoverContent({
  children,
  align = 'center',
  className,
  sideOffset = 4
}: PopoverContentProps) {
  const { open, setOpen } = usePopover()
  const contentRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contentRef.current && !contentRef.current.contains(event.target as Node)) {
        const trigger = contentRef.current.previousElementSibling
        if (trigger && !trigger.contains(event.target as Node)) {
          setOpen(false)
        }
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open, setOpen])

  if (!open) return null

  const alignmentClasses = {
    start: 'left-0',
    center: 'left-1/2 -translate-x-1/2',
    end: 'right-0'
  }

  return (
    <div
      ref={contentRef}
      className={cn(
        'absolute z-50 mt-2 rounded-lg border border-gray-200 bg-white p-4 shadow-lg',
        'animate-in fade-in-0 zoom-in-95',
        alignmentClasses[align],
        className
      )}
      style={{ top: `calc(100% + ${sideOffset}px)` }}
    >
      {children}
    </div>
  )
}

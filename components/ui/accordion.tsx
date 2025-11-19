"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

type AccordionContextValue = {
  openItems: string[]
  toggleItem: (value: string) => void
}

const AccordionContext = React.createContext<AccordionContextValue | undefined>(undefined)

function useAccordion() {
  const context = React.useContext(AccordionContext)
  if (!context) {
    throw new Error("Accordion components must be used within an Accordion")
  }
  return context
}

interface AccordionProps {
  children: React.ReactNode
  type?: "single" | "multiple"
  defaultValue?: string | string[]
  className?: string
}

export function Accordion({ children, type = "single", defaultValue, className }: AccordionProps) {
  const [openItems, setOpenItems] = React.useState<string[]>(() => {
    if (!defaultValue) return []
    return Array.isArray(defaultValue) ? defaultValue : [defaultValue]
  })

  const toggleItem = React.useCallback((value: string) => {
    setOpenItems((prev) => {
      if (type === "single") {
        return prev.includes(value) ? [] : [value]
      } else {
        return prev.includes(value)
          ? prev.filter((item) => item !== value)
          : [...prev, value]
      }
    })
  }, [type])

  return (
    <AccordionContext.Provider value={{ openItems, toggleItem }}>
      <div className={cn("space-y-2", className)}>{children}</div>
    </AccordionContext.Provider>
  )
}

interface AccordionItemProps {
  children: React.ReactNode
  value: string
  className?: string
}

export function AccordionItem({ children, value, className }: AccordionItemProps) {
  return (
    <div
      className={cn("border rounded-lg overflow-hidden", className)}
      data-state={value}
    >
      {children}
    </div>
  )
}

interface AccordionTriggerProps {
  children: React.ReactNode
  value: string
  className?: string
}

export function AccordionTrigger({ children, value, className }: AccordionTriggerProps) {
  const { openItems, toggleItem } = useAccordion()
  const isOpen = openItems.includes(value)

  return (
    <button
      className={cn(
        "flex w-full items-center justify-between px-6 py-4 text-left font-medium transition-all hover:bg-gray-50",
        isOpen && "bg-gray-50",
        className
      )}
      onClick={() => toggleItem(value)}
      aria-expanded={isOpen}
    >
      {children}
      <ChevronDown
        className={cn(
          "h-5 w-5 shrink-0 transition-transform duration-200 text-gray-500",
          isOpen && "rotate-180"
        )}
      />
    </button>
  )
}

interface AccordionContentProps {
  children: React.ReactNode
  value: string
  className?: string
}

export function AccordionContent({ children, value, className }: AccordionContentProps) {
  const { openItems } = useAccordion()
  const isOpen = openItems.includes(value)

  return (
    <div
      className={cn(
        "overflow-hidden transition-all duration-200",
        isOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
      )}
    >
      <div className={cn("px-6 py-4 text-gray-700 border-t", className)}>
        {children}
      </div>
    </div>
  )
}

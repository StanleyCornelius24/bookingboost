import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'secondary' | 'destructive'
  size?: 'default' | 'sm' | 'lg'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    const variants = {
      default: 'bg-slate-800 text-white hover:bg-slate-900 shadow-sm',
      outline: 'border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 shadow-sm',
      ghost: 'hover:bg-slate-100 text-slate-700',
      secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200 shadow-sm',
      destructive: 'bg-rose-600 text-white hover:bg-rose-700 shadow-sm'
    }

    const sizes = {
      default: 'h-9 px-4 py-2 text-sm',
      sm: 'h-8 px-3 text-xs',
      lg: 'h-10 px-6 text-sm'
    }

    return (
      <button
        className={cn(
          'inline-flex items-center justify-center rounded-md font-medium transition-all duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2',
          'disabled:pointer-events-none disabled:opacity-50',
          variants[variant],
          sizes[size],
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }

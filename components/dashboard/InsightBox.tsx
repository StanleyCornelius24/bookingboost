import { CheckCircle, AlertTriangle, Info, TrendingUp, Lightbulb } from 'lucide-react'
import { cn } from '@/lib/utils'

type InsightVariant = 'success' | 'warning' | 'info' | 'tip' | 'trend'

interface InsightBoxProps {
  title: string
  description: string | React.ReactNode
  variant?: InsightVariant
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function InsightBox({
  title,
  description,
  variant = 'info',
  className,
  size = 'md'
}: InsightBoxProps) {
  const getIcon = () => {
    switch (variant) {
      case 'success':
        return CheckCircle
      case 'warning':
        return AlertTriangle
      case 'info':
        return Info
      case 'trend':
        return TrendingUp
      case 'tip':
        return Lightbulb
      default:
        return Info
    }
  }

  const getStyles = () => {
    switch (variant) {
      case 'success':
        return {
          container: 'bg-green-50 border-green-200',
          icon: 'text-green-600',
          title: 'text-green-900',
          description: 'text-green-800'
        }
      case 'warning':
        return {
          container: 'bg-yellow-50 border-yellow-200',
          icon: 'text-yellow-600',
          title: 'text-yellow-900',
          description: 'text-yellow-800'
        }
      case 'info':
        return {
          container: 'bg-blue-50 border-blue-200',
          icon: 'text-blue-600',
          title: 'text-blue-900',
          description: 'text-blue-800'
        }
      case 'trend':
        return {
          container: 'bg-purple-50 border-purple-200',
          icon: 'text-purple-600',
          title: 'text-purple-900',
          description: 'text-purple-800'
        }
      case 'tip':
        return {
          container: 'bg-indigo-50 border-indigo-200',
          icon: 'text-indigo-600',
          title: 'text-indigo-900',
          description: 'text-indigo-800'
        }
    }
  }

  const Icon = getIcon()
  const styles = getStyles()

  const sizeClasses = {
    sm: {
      container: 'p-4',
      icon: 'h-5 w-5',
      title: 'text-base',
      description: 'text-sm'
    },
    md: {
      container: 'p-6',
      icon: 'h-6 w-6',
      title: 'text-lg',
      description: 'text-base'
    },
    lg: {
      container: 'p-8',
      icon: 'h-8 w-8',
      title: 'text-xl',
      description: 'text-lg'
    }
  }

  return (
    <div
      className={cn(
        'border rounded-xl',
        styles.container,
        sizeClasses[size].container,
        className
      )}
    >
      <div className="flex items-start">
        <Icon className={cn(
          'mr-4 mt-1 flex-shrink-0',
          styles.icon,
          sizeClasses[size].icon
        )} />
        <div className="flex-1">
          <h3 className={cn(
            'font-semibold mb-2',
            styles.title,
            sizeClasses[size].title
          )}>
            {title}
          </h3>
          <div className={cn(
            'leading-relaxed',
            styles.description,
            sizeClasses[size].description
          )}>
            {description}
          </div>
        </div>
      </div>
    </div>
  )
}

// Predefined variants for common use cases
export function SuccessInsight({ title, description, className }: Omit<InsightBoxProps, 'variant'>) {
  return <InsightBox variant="success" title={title} description={description} className={className} />
}

export function WarningInsight({ title, description, className }: Omit<InsightBoxProps, 'variant'>) {
  return <InsightBox variant="warning" title={title} description={description} className={className} />
}

export function InfoInsight({ title, description, className }: Omit<InsightBoxProps, 'variant'>) {
  return <InsightBox variant="info" title={title} description={description} className={className} />
}

export function TrendInsight({ title, description, className }: Omit<InsightBoxProps, 'variant'>) {
  return <InsightBox variant="trend" title={title} description={description} className={className} />
}

export function TipInsight({ title, description, className }: Omit<InsightBoxProps, 'variant'>) {
  return <InsightBox variant="tip" title={title} description={description} className={className} />
}

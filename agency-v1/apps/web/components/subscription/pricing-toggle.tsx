'use client'

import { cn } from '@/lib/utils'

interface PricingToggleProps {
  isYearly: boolean
  onChange: (isYearly: boolean) => void
}

export function PricingToggle({ isYearly, onChange }: PricingToggleProps) {
  return (
    <div className="flex items-center justify-center gap-4">
      <span
        className={cn(
          'text-sm font-medium transition-colors',
          !isYearly ? 'text-foreground' : 'text-muted-foreground'
        )}
      >
        Mensual
      </span>
      <button
        onClick={() => onChange(!isYearly)}
        className="relative h-6 w-11 rounded-full bg-secondary transition-colors"
        role="switch"
        aria-checked={isYearly}
      >
        <span
          className={cn(
            'absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform',
            isYearly && 'translate-x-5'
          )}
        />
      </button>
      <span
        className={cn(
          'text-sm font-medium transition-colors',
          isYearly ? 'text-foreground' : 'text-muted-foreground'
        )}
      >
        Anual
        <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
          -20%
        </span>
      </span>
    </div>
  )
}
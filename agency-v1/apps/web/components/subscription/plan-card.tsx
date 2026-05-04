'use client'

import { Plan } from '@/types/subscription'
import { formatPrice, formatFeatures } from '@/lib/plans-config'
import { Button } from '@/components/ui/button'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PlanCardProps {
  plan: Plan
  isYearly: boolean
  isCurrentPlan?: boolean
  onSelect: (planId: string) => void
  isLoading?: boolean
}

export function PlanCard({
  plan,
  isYearly,
  isCurrentPlan,
  onSelect,
  isLoading,
}: PlanCardProps) {
  const price = isYearly ? plan.priceYearlyWithDiscount : plan.priceMonthly
  const featureLines = formatFeatures(plan.features)
  const isFree = plan.id === 'free'

  return (
    <div
      className={cn(
        'relative flex flex-col rounded-2xl border bg-card p-6 transition-all',
        plan.highlighted
          ? 'border-primary shadow-lg scale-105 z-10'
          : 'border-border',
        isCurrentPlan && 'ring-2 ring-primary'
      )}
    >
      {plan.highlighted && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
          Más Popular
        </div>
      )}

      <div className="mb-4">
        <h3 className="text-xl font-bold">{plan.name}</h3>
        <p className="text-sm text-muted-foreground">{plan.description}</p>
      </div>

      <div className="mb-6">
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold">{formatPrice(price)}</span>
          <span className="text-muted-foreground">
            /{isYearly ? 'año' : 'mes'}
          </span>
        </div>
        {isYearly && !isFree && plan.priceMonthly > 0 && (
          <p className="text-sm text-green-500">
            Ahorra {formatPrice(plan.priceYearly - plan.priceYearlyWithDiscount)}{' '}
            al año
          </p>
        )}
      </div>

      <ul className="mb-6 space-y-3">
        {featureLines.map((feature, index) => (
          <li key={index} className="flex items-center gap-2 text-sm">
            <Check className="h-4 w-4 text-primary" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <div className="mt-auto">
        {isCurrentPlan ? (
          <Button disabled variant="outline" className="w-full">
            Plan Actual
          </Button>
        ) : (
          <Button
            onClick={() => onSelect(plan.id)}
            disabled={isLoading}
            variant={plan.highlighted ? 'default' : 'outline'}
            className="w-full"
          >
            {isLoading
              ? 'Procesando...'
              : isFree
              ? 'Comenzar Gratis'
              : 'Elegir Plan'}
          </Button>
        )}
      </div>
    </div>
  )
}
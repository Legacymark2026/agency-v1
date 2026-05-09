'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plan, PlanId } from '@/types/subscription'
import { PLANS } from '@/lib/plans-config'
import { PlanCard } from './plan-card'
import { PricingToggle } from './pricing-toggle'

interface PlanSelectorProps {
  currentPlanId?: PlanId
  isAuthenticated?: boolean
}

export function PlanSelector({
  currentPlanId,
  isAuthenticated = false,
}: PlanSelectorProps) {
  const router = useRouter()
  const [isYearly, setIsYearly] = useState(false)
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null)

  const handleSelect = async (planId: string) => {
    if (!isAuthenticated) {
      router.push('/auth/register?redirect=/suscripcion')
      return
    }

    if (planId === currentPlanId) {
      return
    }

    setLoadingPlanId(planId)

    try {
      // Simplified: directly redirect to checkout or login
      if (planId === 'free') {
        router.push('/dashboard/settings/billing')
      } else {
        // For now, redirect to login
        router.push(`/auth/register?plan=${planId}&billing=${isYearly ? 'yearly' : 'monthly'}`)
      }
    } catch (error) {
      console.error('Error selecting plan:', error)
    } finally {
      setLoadingPlanId(null)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-center">
        <PricingToggle isYearly={isYearly} onChange={setIsYearly} />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {PLANS.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            isYearly={isYearly}
            isCurrentPlan={plan.id === currentPlanId}
            onSelect={handleSelect}
            isLoading={loadingPlanId === plan.id}
          />
        ))}
      </div>
    </div>
  )
}
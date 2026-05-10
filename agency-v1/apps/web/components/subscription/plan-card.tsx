'use client'

import { Plan } from '@/types/subscription'
import { formatPrice, formatFeatures } from '@/lib/plans-config'
import { Check, Sparkles, Zap, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

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
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={cn(
        'relative flex flex-col rounded-3xl p-8 transition-all duration-300',
        'backdrop-blur-md bg-slate-950/40 border border-slate-800/60 shadow-xl',
        plan.highlighted
          ? 'ring-1 ring-teal-500/50 shadow-[0_0_30px_rgba(20,184,166,0.15)] z-10'
          : '',
        isCurrentPlan && 'ring-2 ring-slate-400'
      )}
    >
      {/* Glow Effect Background for Highlighted Plan */}
      {plan.highlighted && (
        <div className="absolute inset-0 bg-gradient-to-b from-teal-500/10 to-transparent rounded-3xl pointer-events-none" />
      )}

      {plan.highlighted && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-teal-400 to-emerald-400 px-4 py-1.5 text-xs font-bold text-slate-950 shadow-[0_0_20px_rgba(20,184,166,0.5)] flex items-center gap-1.5 z-20">
          <Sparkles className="w-3.5 h-3.5" />
          Más Popular
        </div>
      )}

      <div className="mb-6 relative z-10">
        <h3 className={cn(
          "text-2xl font-black mb-2 tracking-tight",
          plan.highlighted ? "text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-300" : "text-white"
        )}>
          {plan.name}
        </h3>
        <p className="text-sm text-slate-400 font-medium">{plan.description}</p>
      </div>

      <div className="mb-8 relative z-10">
        <div className="flex items-end gap-1.5 mb-1">
          <span className="text-5xl font-black text-white tracking-tighter">{formatPrice(price)}</span>
          <span className="text-slate-400 font-medium mb-1">
            /{isYearly ? 'año' : 'mes'}
          </span>
        </div>
        {isYearly && !isFree && plan.priceMonthly > 0 && (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 mt-2 rounded-md bg-teal-500/10 text-teal-400 text-xs font-bold">
            <Zap className="w-3.5 h-3.5" />
            Ahorra {formatPrice(plan.priceYearly - plan.priceYearlyWithDiscount)} al año
          </div>
        )}
      </div>

      <ul className="mb-10 space-y-4 flex-1 relative z-10">
        {featureLines.map((feature, index) => (
          <li key={index} className="flex items-start gap-3 text-sm font-medium text-slate-300">
            <div className={cn(
              "mt-0.5 rounded-full p-1",
              plan.highlighted ? "bg-teal-500/20 text-teal-400" : "bg-slate-800 text-slate-400"
            )}>
              <Check className="h-3.5 w-3.5" strokeWidth={3} />
            </div>
            <span className="leading-tight pt-0.5">{feature}</span>
          </li>
        ))}
      </ul>

      <div className="mt-auto relative z-10">
        {isCurrentPlan ? (
          <button disabled className="w-full h-12 rounded-xl bg-slate-900 border border-slate-700 text-slate-400 font-bold opacity-70 cursor-not-allowed">
            Plan Actual
          </button>
        ) : (
          <button
            onClick={() => onSelect(plan.id)}
            disabled={isLoading}
            className={cn(
              "w-full h-12 rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-300",
              plan.highlighted 
                ? "bg-teal-500 hover:bg-teal-400 text-slate-950 shadow-[0_0_20px_rgba(20,184,166,0.3)] hover:shadow-[0_0_30px_rgba(20,184,166,0.5)]" 
                : "bg-slate-800/50 hover:bg-slate-700/80 border border-slate-700 text-white"
            )}
          >
            {isLoading
              ? 'Procesando...'
              : isFree
              ? 'Comenzar Gratis'
              : 'Elegir Plan'}
            {!isLoading && <ArrowRight className="w-4 h-4" />}
          </button>
        )}
      </div>
    </motion.div>
  )
}
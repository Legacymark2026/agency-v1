'use client'

import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

interface PricingToggleProps {
  isYearly: boolean
  onChange: (isYearly: boolean) => void
}

export function PricingToggle({ isYearly, onChange }: PricingToggleProps) {
  return (
    <div className="flex items-center justify-center gap-4">
      <span
        className={cn(
          'text-sm font-semibold transition-colors',
          !isYearly ? 'text-white' : 'text-slate-500'
        )}
      >
        Mensual
      </span>
      
      <button
        onClick={() => onChange(!isYearly)}
        className={cn(
          "relative flex h-8 w-14 cursor-pointer rounded-full p-1 transition-colors duration-300 ease-in-out",
          isYearly ? "bg-teal-500 shadow-[0_0_15px_rgba(20,184,166,0.3)]" : "bg-slate-800"
        )}
        role="switch"
        aria-checked={isYearly}
      >
        <motion.div
          layout
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className="h-6 w-6 rounded-full bg-white shadow-sm"
          style={{
            marginLeft: isYearly ? "24px" : "0px",
          }}
        />
      </button>

      <span
        className={cn(
          'text-sm font-semibold transition-colors flex items-center',
          isYearly ? 'text-white' : 'text-slate-500'
        )}
      >
        Anual
        <span className={cn(
          "ml-2 rounded-full px-2 py-0.5 text-xs font-bold transition-colors",
          isYearly 
            ? "bg-teal-500/20 text-teal-400 border border-teal-500/30" 
            : "bg-slate-800 text-slate-400 border border-slate-700"
        )}>
          -20%
        </span>
      </span>
    </div>
  )
}
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
    "inline-flex items-center rounded-[0.15rem] border px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider transition-colors focus:outline-none",
    {
        variants: {
            variant: {
                default:
                    "border-[var(--ds-border-glow)] bg-[var(--ds-teal-dim)] text-[var(--ds-teal-md)]",
                secondary:
                    "border-[var(--ds-border)] bg-[var(--ds-surface-2)] text-[var(--ds-text-secondary)]",
                destructive:
                    "border-red-500/30 bg-red-500/10 text-red-400",
                outline: "border-[var(--ds-border)] text-[var(--ds-text-primary)] bg-transparent",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
)

export interface BadgeProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> { }

function Badge({ className, variant, ...props }: BadgeProps) {
    return (
        <div className={cn(badgeVariants({ variant }), className)} {...props} />
    )
}

export { Badge, badgeVariants }

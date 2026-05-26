import * as React from "react";
import { cn } from "@/components/ui/button";

export interface InputProps
    extends React.InputHTMLAttributes<HTMLInputElement> { }

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, ...props }, ref) => {
        return (
            <input
                type={type}
                className={cn(
                    "flex h-10 w-full rounded-[0.15rem] border border-[var(--ds-border)] bg-[var(--ds-surface-2)] px-3 py-2 text-sm text-[var(--ds-text-primary)] placeholder-[var(--ds-text-dim)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--ds-teal-md)] focus-visible:border-[var(--ds-border-glow)] file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300 font-sans",
                    className
                )}
                ref={ref}
                {...props}
            />
        );
    }
);
Input.displayName = "Input";

export { Input };

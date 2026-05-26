import * as React from "react";
import { cn } from "@/components/ui/button";

export interface TextareaProps
    extends React.TextareaHTMLAttributes<HTMLTextAreaElement> { }

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ className, ...props }, ref) => {
        return (
            <textarea
                className={cn(
                    "flex min-h-[80px] w-full rounded-[0.15rem] border border-[var(--ds-border)] bg-[var(--ds-surface-2)] px-3 py-2 text-sm text-[var(--ds-text-primary)] placeholder-[var(--ds-text-dim)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--ds-teal-md)] focus-visible:border-[var(--ds-border-glow)] disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300 font-sans",
                    className
                )}
                ref={ref}
                {...props}
            />
        );
    }
);
Textarea.displayName = "Textarea";

export { Textarea };

import { ButtonHTMLAttributes, forwardRef } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const buttonVariants = cva(
    "inline-flex items-center justify-center rounded-[0.15rem] font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--ds-teal-md)] disabled:pointer-events-none disabled:opacity-50",
    {
        variants: {
            variant: {
                default: "bg-[var(--ds-teal)] text-white hover:bg-[var(--ds-teal-md)] hover:shadow-[var(--ds-shadow-teal)] hover:scale-[1.02] border border-[var(--ds-border-glow)] active:scale-95 transition-all duration-300 shadow-[var(--ds-shadow-teal)] font-mono text-xs uppercase tracking-widest",
                primary: "bg-[var(--ds-teal)] text-white hover:bg-[var(--ds-teal-md)] hover:shadow-[var(--ds-shadow-teal)] hover:scale-[1.02] border border-[var(--ds-border-glow)] active:scale-95 transition-all duration-300 shadow-[var(--ds-shadow-teal)] font-mono text-xs uppercase tracking-widest",
                secondary: "bg-[var(--ds-surface-2)] text-[var(--ds-text-primary)] hover:bg-[var(--ds-surface)] border border-[var(--ds-border)] hover:border-[var(--ds-border-glow)] hover:scale-[1.01] active:scale-95 transition-all duration-300 font-mono text-xs uppercase tracking-widest",
                outline: "border border-[var(--ds-border)] bg-transparent text-[var(--ds-text-primary)] hover:bg-[var(--ds-teal-dim)] hover:border-[var(--ds-border-glow)] active:scale-95 transition-all duration-300 font-mono text-xs uppercase tracking-widest",
                ghost: "text-[var(--ds-text-secondary)] hover:bg-[var(--ds-teal-dim)] hover:text-[var(--ds-text-primary)] active:scale-95 transition-all duration-300 font-mono text-xs uppercase tracking-widest",
            },
            size: {
                xs: "h-6 px-2 text-[9px] tracking-wider",
                sm: "h-8 px-3 text-[10px] tracking-wider",
                md: "h-10 px-6 py-2 text-xs",
                lg: "h-12 px-8 text-sm",
                icon: "h-10 w-10 p-0",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "md",
        },
    }
);

export interface ButtonProps
    extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
    asChild?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild = false, ...props }, ref) => {
        const Comp = asChild ? Slot : "button";
        return (
            <Comp
                ref={ref}
                className={cn(buttonVariants({ variant, size, className }))}
                {...props}
            />
        );
    }
);
Button.displayName = "Button";

export { Button, buttonVariants, cn };

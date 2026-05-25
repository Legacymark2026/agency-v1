'use client';

import { ReactNode, useRef, useState, useEffect } from 'react';
import { motion, useMotionTemplate, useMotionValue } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { InteractiveSpotlight } from './InteractiveSpotlight';


// ─── Page wrapper ─────────────────────────────────────────────────────────────
interface DashboardPageProps { children: ReactNode; className?: string; }
export function DashboardPage({ children, className }: DashboardPageProps) {
    return <div className={cn('ds-page space-y-8', className)}>{children}</div>;
}

// ─── Page header — home style with icon badge and HUD typography ─────────────
interface DashboardPageHeaderProps {
    title: string;
    subtitle?: string;
    badgeText?: string;
    badgeVariant?: 'teal' | 'amber' | 'red' | 'blue' | 'slate';
    code?: string;           // e.g. "CRM_CORE"
    actions?: ReactNode;
    icon?: ReactNode;
}
export function DashboardPageHeader({ title, subtitle, badgeText, badgeVariant = 'teal', code, actions, icon }: DashboardPageHeaderProps) {
    return (
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-8"
            style={{ borderBottom: '1px solid rgba(30,41,59,0.8)' }}>
            <div>
                {/* Badge — same as home bento service badge */}
                {badgeText && (
                    <div className="mb-4">
                        <span className={`ds-badge ds-badge-${badgeVariant}`}>
                            {/* Live dot */}
                            <span className="relative flex h-1.5 w-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-teal-500" />
                            </span>
                            {badgeText}
                        </span>
                    </div>
                )}

                <div className="flex items-center gap-4">
                    {icon && (
                        <div className="ds-icon-box w-12 h-12">
                            <span className="text-teal-400">{icon}</span>
                        </div>
                    )}
                    <div>
                        <h1 className="ds-heading-page">{title}</h1>
                        {subtitle && <p className="ds-subtext mt-2">{subtitle}</p>}
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
                {code && (
                    <span className="font-mono text-xs text-slate-600 uppercase tracking-widest hidden md:block">
                        [{code}]
                    </span>
                )}
                {actions}
            </div>
        </div>
    );
}

// ─── Section container — home bento card style ────────────────────────────────
interface DashboardSectionProps {
    children: ReactNode;
    title?: string;
    subtitle?: string;
    code?: string;
    actions?: ReactNode;
    className?: string;
    dense?: boolean;
}
export function DashboardSection({ children, title, subtitle, code, actions, className, dense }: DashboardSectionProps) {
    return (
        <InteractiveSpotlight className={cn('ds-section', className)} style={{ padding: dense ? '1rem' : undefined }}>
            {(title || code || actions) && (
                <div className="flex items-start justify-between mb-6 gap-3">
                    <div>
                        {title && <h2 className="ds-heading-section">{title}</h2>}
                        {subtitle && <p className="ds-subtext mt-1.5">{subtitle}</p>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        {code && <span className="ds-code-tag">[{code}]</span>}
                        {actions}
                    </div>
                </div>
            )}
            {children}
        </InteractiveSpotlight>
    );
}

// Hook for count-up animation
function useCountUp(end: number, duration: number = 1500) {
    const [count, setCount] = useState(0);
    useEffect(() => {
        let startTime: number | null = null;
        let frame: number;
        const animate = (ts: number) => {
            if (!startTime) startTime = ts;
            const pct = Math.min((ts - startTime) / duration, 1);
            const ease = 1 - Math.pow(1 - pct, 4);
            setCount(end * ease);
            if (pct < 1) frame = requestAnimationFrame(animate);
        };
        frame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(frame);
    }, [end, duration]);
    return count;
}

// ─── KPI card with flashlight hover effect (home style) ──────────────────────
export interface DashboardKPIProps {
    label: string;
    value?: string | number;
    numericValue?: number;
    formatValue?: (val: number) => string;
    delta?: string;
    deltaUp?: boolean;
    deltaText?: string;
    icon?: ReactNode;
    code?: string;
    accentColor?: 'teal' | 'amber' | 'red' | 'blue' | 'sky' | 'emerald' | 'violet' | 'slate';
    className?: string;
    delay?: number;
}
export function DashboardKPI({ 
    label, 
    value, 
    numericValue, 
    formatValue, 
    delta, 
    deltaUp, 
    deltaText, 
    icon, 
    code,
    accentColor = 'teal',
    className,
    delay = 0 
}: DashboardKPIProps) {
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
        const { left, top } = currentTarget.getBoundingClientRect();
        mouseX.set(clientX - left);
        mouseY.set(clientY - top);
    }

    const animatedVal = useCountUp(numericValue ?? 0);
    const displayValue = numericValue !== undefined 
        ? (formatValue ? formatValue(animatedVal) : Math.floor(animatedVal).toString())
        : value;

    // HUD styles color maps
    const borderAccentMap = {
        teal: "border-teal-500/30 group-hover:border-teal-500/50 shadow-teal-500/5",
        amber: "border-amber-500/30 group-hover:border-amber-500/50 shadow-amber-500/5",
        red: "border-red-500/30 group-hover:border-red-500/50 shadow-red-500/5",
        blue: "border-blue-500/30 group-hover:border-blue-500/50 shadow-blue-500/5",
        sky: "border-sky-500/30 group-hover:border-sky-500/50 shadow-sky-500/5",
        emerald: "border-emerald-500/30 group-hover:border-emerald-500/50 shadow-emerald-500/5",
        violet: "border-violet-500/30 group-hover:border-violet-500/50 shadow-violet-500/5",
        slate: "border-slate-800 group-hover:border-slate-700 shadow-slate-900/50",
    };

    const textAccentMap = {
        teal: "text-teal-400",
        amber: "text-amber-400",
        red: "text-red-400",
        blue: "text-blue-400",
        sky: "text-sky-400",
        emerald: "text-emerald-400",
        violet: "text-violet-400",
        slate: "text-slate-400",
    };

    const barAccentMap = {
        teal: "from-teal-500 to-teal-400",
        amber: "from-amber-500 to-amber-400",
        red: "from-red-500 to-red-400",
        blue: "from-blue-500 to-blue-400",
        sky: "from-sky-500 to-sky-400",
        emerald: "from-emerald-500 to-emerald-400",
        violet: "from-violet-500 to-violet-400",
        slate: "from-slate-700 to-slate-600",
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            onMouseMove={handleMouseMove} 
            className={cn("ds-kpi group relative overflow-hidden transition-all duration-300 border bg-slate-950/60 backdrop-blur-md hover:shadow-lg", borderAccentMap[accentColor], className)}
        >
            {/* Flashlight effect */}
            <motion.div
                className="pointer-events-none absolute -inset-px opacity-0 transition duration-300 group-hover:opacity-100 z-0"
                style={{
                    background: useMotionTemplate`radial-gradient(280px circle at ${mouseX}px ${mouseY}px, rgba(45,212,191,0.06), transparent 80%)`,
                }}
            />

            {/* Code tag */}
            {code && <div className="absolute top-3 right-3 ds-code-tag group-hover:text-slate-500 transition-colors">[{code}]</div>}

            <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                    <p className="font-mono text-xs font-bold text-slate-500 uppercase tracking-[0.14em]">{label}</p>
                    {icon && (
                        <div className="w-8 h-8 flex items-center justify-center bg-slate-900/60 border border-slate-800 rounded group-hover:border-slate-700 transition-colors">
                            <span className={cn("transition-colors group-hover:text-white", textAccentMap[accentColor])}>{icon}</span>
                        </div>
                    )}
                </div>
                
                <div className="flex items-baseline gap-2">
                    <p className="ds-stat-value text-2xl font-black text-white tracking-tight">{displayValue}</p>
                    {delta && !deltaText && (
                        <span className={cn(
                            "flex items-center text-xs font-bold font-mono ml-2",
                            deltaUp ? "text-emerald-400" : "text-red-400"
                        )}>
                            {deltaUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                            {delta}
                        </span>
                    )}
                </div>

                {delta && deltaText && (
                    <div className="flex items-center gap-2 mt-3">
                        <span className={cn(
                            "inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-mono font-bold rounded-sm border",
                            deltaUp 
                                ? "bg-teal-950/40 text-teal-400 border-teal-900/40" 
                                : "bg-red-950/40 text-red-400 border-red-900/40"
                        )}>
                            {deltaUp ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />}
                            {delta}
                        </span>
                        <span className="text-[10px] font-mono text-slate-600 uppercase tracking-widest">{deltaText}</span>
                    </div>
                )}
            </div>

            {/* Bottom animated accent line */}
            <div className={cn(
                "absolute bottom-0 left-0 h-0.5 bg-gradient-to-r w-0 group-hover:w-full transition-all duration-500",
                barAccentMap[accentColor]
            )} />
        </motion.div>
    );
}

// ─── Home-style tech card (with flashlight) ───────────────────────────────────
interface TechCardProps {
    title: string;
    description?: string;
    icon?: ReactNode;
    code?: string;
    children?: ReactNode;
    className?: string;
    onClick?: () => void;
}
export function TechCard({ title, description, icon, code, children, className, onClick }: TechCardProps) {
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
        const { left, top } = currentTarget.getBoundingClientRect();
        mouseX.set(clientX - left);
        mouseY.set(clientY - top);
    }

    return (
        <div
            onMouseMove={handleMouseMove}
            onClick={onClick}
            className={cn('ds-card group', onClick && 'cursor-pointer', className)}
        >
            {/* Flashlight */}
            <motion.div
                className="pointer-events-none absolute -inset-px opacity-0 transition duration-300 group-hover:opacity-100 z-0"
                style={{
                    background: useMotionTemplate`radial-gradient(400px circle at ${mouseX}px ${mouseY}px, rgba(45,212,191,0.05), transparent 80%)`,
                }}
            />

            {/* Code tag */}
            {code && <div className="absolute top-4 right-4 ds-code-tag group-hover:text-slate-400 transition-colors">[{code}]</div>}

            {/* Icon */}
            {icon && (
                <div className="ds-icon-box mb-6 relative z-10">
                    <span className="text-slate-400 group-hover:text-teal-400 transition-colors">{icon}</span>
                </div>
            )}

            {/* Content */}
            <div className="relative z-10">
                <h3 className="ds-heading-card group-hover:text-teal-50 mb-3">{title}</h3>
                {description && <p className="text-sm text-slate-400 leading-relaxed font-light">{description}</p>}
                {children}
            </div>
        </div>
    );
}

// ─── Empty state — mono style ─────────────────────────────────────────────────
export { EmptyState, type EmptyStateProps } from '@/components/ui/empty-state';

// ─── Progress bar — teal gradient ────────────────────────────────────────────
interface ProgressBarProps { value: number; max?: number; label?: string; }
export function ProgressBar({ value, max = 100, label }: ProgressBarProps) {
    const pct = Math.min((value / max) * 100, 100);
    return (
        <div>
            {label && <div className="flex justify-between mb-1"><span className="ds-mono-label">{label}</span><span className="ds-mono-label">{pct.toFixed(0)}%</span></div>}
            <div className="ds-progress-track"><div className="ds-progress-fill" style={{ width: `${pct}%` }} /></div>
        </div>
    );
}

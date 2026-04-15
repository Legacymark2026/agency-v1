'use client';

import { ReactNode, useRef, useState } from 'react';
import { motion, useMotionTemplate, useMotionValue } from 'framer-motion';
import { cn } from '@/lib/utils';

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
                    <span className="font-mono text-[9px] text-slate-600 uppercase tracking-widest hidden md:block">
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
        <div className={cn('ds-section', className)} style={{ padding: dense ? '1rem' : undefined }}>
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
        </div>
    );
}

// ─── KPI card with flashlight hover effect (home style) ──────────────────────
interface DashboardKPIProps {
    label: string;
    value: string | number;
    delta?: string;
    deltaUp?: boolean;
    icon?: ReactNode;
    code?: string;
}
export function DashboardKPI({ label, value, delta, deltaUp, icon, code }: DashboardKPIProps) {
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
        const { left, top } = currentTarget.getBoundingClientRect();
        mouseX.set(clientX - left);
        mouseY.set(clientY - top);
    }

    return (
        <div onMouseMove={handleMouseMove} className="ds-kpi group">
            {/* Flashlight effect — exactly like home TechCard */}
            <motion.div
                className="pointer-events-none absolute -inset-px opacity-0 transition duration-300 group-hover:opacity-100 z-0"
                style={{
                    background: useMotionTemplate`radial-gradient(250px circle at ${mouseX}px ${mouseY}px, rgba(45,212,191,0.04), transparent 80%)`,
                }}
            />

            {/* Code tag */}
            {code && <div className="absolute top-3 right-3 ds-code-tag">[{code}]</div>}

            <div className="relative z-10">
                <div className="flex items-start justify-between mb-3">
                    <p className="ds-stat-label">{label}</p>
                    {icon && <span className="text-teal-600 opacity-70 group-hover:opacity-100 group-hover:text-teal-400 transition-all">{icon}</span>}
                </div>
                <p className="ds-stat-value">{value}</p>
                {delta && (
                    <p className={`mt-1 ${deltaUp ? 'ds-stat-delta-up' : 'ds-stat-delta-down'}`}>
                        {deltaUp ? '↑' : '↓'} {delta}
                    </p>
                )}
            </div>
        </div>
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

// ─── Status badge — HUD style ─────────────────────────────────────────────────
type BadgeVariant = 'teal' | 'green' | 'amber' | 'red' | 'blue' | 'slate' | 'purple';
interface StatusBadgeProps { label: string; variant?: BadgeVariant; live?: boolean; }
export function StatusBadge({ label, variant = 'teal', live }: StatusBadgeProps) {
    return (
        <span className={`ds-badge ds-badge-${variant}`}>
            {live && (
                <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-teal-500" />
                </span>
            )}
            {label}
        </span>
    );
}

// ─── Empty state — mono style ─────────────────────────────────────────────────
interface EmptyStateProps { icon?: ReactNode; title: string; description?: string; action?: ReactNode; code?: string; }
export function EmptyState({ icon, title, description, action, code }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center text-center py-20 space-y-4">
            {icon && <div className="opacity-20 text-5xl">{icon}</div>}
            {code && <p className="ds-code-tag">&gt; [{code}]</p>}
            <p className="ds-heading-section">{title}</p>
            {description && <p className="text-sm text-slate-500 font-mono max-w-sm uppercase tracking-wider">{description}</p>}
            {action}
        </div>
    );
}

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

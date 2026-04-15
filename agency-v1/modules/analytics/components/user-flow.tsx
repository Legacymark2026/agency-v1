'use client';

import { ArrowRight, Users, FileText, BarChart3, Target, DollarSign } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { FunnelStage } from '@/modules/analytics/actions/analytics';

interface UserFlowProps {
    data?: FunnelStage[];
}

// Map common funnel stage names to icons and colors
const stageConfig: Record<string, { icon: LucideIcon, color: string }> = {
    'Visitas': { icon: Users, color: 'violet' },
    'Sesiones': { icon: Users, color: 'violet' },
    'Páginas Vistas': { icon: FileText, color: 'blue' },
    'Leads': { icon: Target, color: 'cyan' },
    'Oportunidades': { icon: BarChart3, color: 'amber' },
    'Conversiones': { icon: DollarSign, color: 'emerald' },
    'Ventas': { icon: DollarSign, color: 'emerald' },
};

const defaultColor = { bg: 'bg-gray-100', border: 'border-gray-300', text: 'text-gray-700' };

const colorMap: Record<string, { bg: string; border: string; text: string }> = {
    violet: { bg: 'bg-violet-100', border: 'border-violet-300', text: 'text-violet-700' },
    blue: { bg: 'bg-blue-100', border: 'border-blue-300', text: 'text-blue-700' },
    cyan: { bg: 'bg-cyan-100', border: 'border-cyan-300', text: 'text-cyan-700' },
    amber: { bg: 'bg-amber-100', border: 'border-amber-300', text: 'text-amber-700' },
    emerald: { bg: 'bg-emerald-100', border: 'border-emerald-300', text: 'text-emerald-700' },
};

export function UserFlow({ data = [] }: UserFlowProps) {
    if (!data || data.length === 0) {
        return <div className="p-4 text-center text-gray-500">No hay datos de flujo disponibles</div>;
    }

    const maxUsers = Math.max(...data.map(d => d.value));

    // Calculate dropoffs
    const flowSteps = data.map((stage, index) => {
        const nextStage = data[index + 1];
        let dropoff = null;

        if (nextStage && stage.value > 0) {
            const dropoffVal = ((stage.value - nextStage.value) / stage.value) * 100;
            dropoff = Math.max(0, parseFloat(dropoffVal.toFixed(1)));
        }

        // Determine config based on name matching
        const config = stageConfig[stage.name] || { icon: FileText, color: 'blue' };

        return {
            ...stage,
            icon: config.icon,
            colorKey: config.color,
            dropoff
        };
    });

    // Calculate generic insights
    let bestRetention = { name: '', value: -1 };
    let highestDropoff = { name: '', value: -1 };

    for (let i = 0; i < flowSteps.length - 1; i++) {
        const current = flowSteps[i];
        const next = flowSteps[i + 1];

        if (current.value > 0) {
            const retention = (next.value / current.value) * 100;
            const dropoff = 100 - retention;

            if (retention > bestRetention.value) {
                bestRetention = { name: `${current.name} → ${next.name}`, value: retention };
            }

            if (dropoff > highestDropoff.value) {
                highestDropoff = { name: `${current.name} → ${next.name}`, value: dropoff };
            }
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Users className="h-4 w-4 text-violet-600" />
                    Flujo de Usuario Principal
                </h3>
                <span className="text-xs text-gray-500">
                    Conversión total: {data[0].value > 0 ? ((data[data.length - 1].value / data[0].value) * 100).toFixed(1) : 0}%
                </span>
            </div>

            {/* Flow visualization */}
            <div className="flex items-center justify-between gap-2 overflow-x-auto pb-4 pt-2">
                {flowSteps.map((step, index) => {
                    const Icon = step.icon;
                    const colors = colorMap[step.colorKey] || defaultColor;
                    const widthPercent = maxUsers > 0 ? (step.value / maxUsers) * 100 : 0;

                    return (
                        <div key={index} className="flex items-center gap-2 flex-shrink-0">
                            {/* Step card */}
                            <div
                                className={`relative p-4 rounded-xl border-2 ${colors.border} ${colors.bg} min-w-[120px] text-center transition-all hover:shadow-lg hover:scale-105`}
                            >
                                <Icon className={`h-6 w-6 mx-auto mb-2 ${colors.text}`} />
                                <p className={`text-sm font-semibold ${colors.text} truncate max-w-[100px] mx-auto`}>
                                    {step.name}
                                </p>
                                <p className="text-lg font-bold text-gray-900 mt-1">
                                    {step.value.toLocaleString()}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {widthPercent.toFixed(0)}% del total
                                </p>

                                {/* Progress bar at bottom */}
                                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200/50 rounded-b-lg overflow-hidden">
                                    <div
                                        className={`h-full ${colors.bg.replace('100', '500')}`}
                                        style={{ width: `${widthPercent}%` }}
                                    />
                                </div>
                            </div>

                            {/* Arrow with dropoff */}
                            {index < flowSteps.length - 1 && (
                                <div className="flex flex-col items-center gap-1 flex-shrink-0">
                                    <ArrowRight className="h-5 w-5 text-gray-400" />
                                    {step.dropoff !== null && (
                                        <span className="text-xs text-red-500 font-medium whitespace-nowrap">
                                            -{step.dropoff}%
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Insights */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                {highestDropoff.value > 0 && (
                    <div className="p-3 bg-red-50 rounded-lg">
                        <p className="text-xs text-red-600 font-medium">Mayor abandono</p>
                        <p className="text-sm font-semibold text-gray-900">
                            {highestDropoff.name} ({highestDropoff.value.toFixed(1)}%)
                        </p>
                    </div>
                )}
                {bestRetention.value > 0 && (
                    <div className="p-3 bg-emerald-50 rounded-lg">
                        <p className="text-xs text-emerald-600 font-medium">Mejor retención</p>
                        <p className="text-sm font-semibold text-gray-900">
                            {bestRetention.name} ({bestRetention.value.toFixed(1)}%)
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}


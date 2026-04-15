'use client';

import { FlaskConical, TrendingUp, Users, CheckCircle, XCircle } from 'lucide-react';
import { ExperimentData } from '@/modules/analytics/actions/analytics';

interface ABTestResultsProps {
    data?: ExperimentData[];
}

const statusConfig: Record<string, { label: string; color: string }> = {
    'RUNNING': { label: 'En curso', color: 'bg-blue-100 text-blue-700' },
    'COMPLETED': { label: 'Completado', color: 'bg-emerald-100 text-emerald-700' },
    'PAUSED': { label: 'Pausado', color: 'bg-gray-100 text-gray-700' },
    // Fallback for mock status lowercase
    'running': { label: 'En curso', color: 'bg-blue-100 text-blue-700' },
    'completed': { label: 'Completado', color: 'bg-emerald-100 text-emerald-700' },
    'paused': { label: 'Pausado', color: 'bg-gray-100 text-gray-700' },
};

export function ABTestResults({ data = [] }: ABTestResultsProps) {
    if (data.length === 0) return null;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <FlaskConical className="h-4 w-4 text-violet-600" />
                    Resultados A/B Testing
                </h3>
                <span className="text-xs text-gray-500">{data.length} tests activos</span>
            </div>

            <div className="space-y-4">
                {data.map((test) => {
                    const status = statusConfig[test.status] || statusConfig['RUNNING'];

                    // Transform flat variants + results into unified structure for UI
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const variants = test.variants.map((v: any, i: number) => {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const result = test.results?.variants?.find((r: any) => r.id === v.id) ||
                            test.results?.variants?.[i] ||
                            { visitors: 0, conversions: 0 };

                        const rate = result.visitors > 0 ? (result.conversions / result.visitors) * 100 : 0;
                        return {
                            name: v.name,
                            visitors: result.visitors,
                            conversions: result.conversions,
                            conversionRate: rate,
                            isWinner: false // Logic to determine winner could be added here
                        };
                    });

                    // Determine winner visually for now
                    const maxRate = Math.max(...variants.map(v => v.conversionRate));
                    variants.forEach(v => {
                        if (v.conversionRate === maxRate && maxRate > 0) v.isWinner = true;
                    });

                    return (
                        <div key={test.id} className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors">
                            {/* Header */}
                            <div className="flex items-center justify-between mb-3">
                                <div>
                                    <h4 className="font-medium text-gray-900">{test.name}</h4>
                                    <p className="text-xs text-gray-500">Iniciado: {new Date(test.startDate).toLocaleDateString()}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                                        {status.label}
                                    </span>
                                    <span className="text-xs font-semibold text-emerald-600">
                                        Activo hace {test.daysRunning || 0} días
                                    </span>
                                </div>
                            </div>

                            {/* Variants */}
                            <div className="space-y-2">
                                {variants.map((variant, i) => (
                                    <div
                                        key={i}
                                        className={`p-3 rounded-lg ${variant.isWinner && variant.visitors > 100
                                            ? 'bg-emerald-50 border border-emerald-200'
                                            : 'bg-white border border-gray-200'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                {variant.isWinner && variant.visitors > 100 ? (
                                                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                                                ) : (
                                                    <div className="h-4 w-4 rounded-full bg-gray-200" />
                                                )}
                                                <span className="text-sm font-medium text-gray-800">
                                                    {variant.name}
                                                </span>
                                                {variant.isWinner && variant.visitors > 100 && (
                                                    <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded">
                                                        Líder
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-sm font-bold text-gray-900">
                                                {variant.conversionRate.toFixed(2)}%
                                            </span>
                                        </div>

                                        {/* Progress bar */}
                                        <div className="flex items-center gap-3">
                                            <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all ${variant.isWinner && variant.visitors > 100 ? 'bg-emerald-500' : 'bg-violet-400'
                                                        }`}
                                                    style={{ width: `${maxRate > 0 ? (variant.conversionRate / maxRate) * 100 : 0}%` }}
                                                />
                                            </div>
                                            <div className="flex items-center gap-1 text-xs text-gray-500">
                                                <Users className="h-3 w-3" />
                                                {variant.visitors.toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

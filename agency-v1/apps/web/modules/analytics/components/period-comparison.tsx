'use client';

import { useState } from 'react';
import { ArrowLeftRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface ComparisonMetric {
    current: number;
    previous: number;
    label: string;
    suffix?: string;
}

const comparisonData: Record<string, ComparisonMetric> = {
    users: { current: 14230, previous: 11850, label: 'Usuarios' },
    sessions: { current: 28450, previous: 24200, label: 'Sesiones' },
    pageviews: { current: 89320, previous: 76150, label: 'Páginas Vistas' },
    conversion: { current: 3.2, previous: 2.8, label: 'Conversión', suffix: '%' },
};

export function PeriodComparison() {
    const [showComparison, setShowComparison] = useState(true);

    const calculateChange = (current: number, previous: number) => {
        const change = ((current - previous) / previous) * 100;
        return change;
    };

    return (
        <div className="bg-gradient-to-br from-slate-50 to-gray-100 border border-slate-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <ArrowLeftRight className="h-4 w-4" />
                    Comparación con Periodo Anterior
                </h3>
                <button
                    onClick={() => setShowComparison(!showComparison)}
                    className={`px-3 py-1 text-xs font-medium rounded-full transition-all ${showComparison
                        ? 'bg-violet-100 text-violet-700'
                        : 'bg-gray-200 text-gray-600'
                        }`}
                >
                    {showComparison ? 'Activo' : 'Inactivo'}
                </button>
            </div>

            {showComparison && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(comparisonData).map(([key, data]) => {
                        const change = calculateChange(data.current, data.previous);
                        const isPositive = change > 0;
                        const isNeutral = Math.abs(change) < 0.5;

                        return (
                            <div key={key} className="bg-white rounded-lg p-3 shadow-sm">
                                <p className="text-xs text-gray-500 mb-1">{data.label}</p>
                                <div className="flex items-end justify-between">
                                    <span className="text-lg font-bold text-gray-900">
                                        {data.current.toLocaleString()}{data.suffix || ''}
                                    </span>
                                    <div className={`flex items-center text-xs font-medium ${isNeutral
                                        ? 'text-gray-500'
                                        : isPositive
                                            ? 'text-emerald-600'
                                            : 'text-red-500'
                                        }`}>
                                        {isNeutral ? (
                                            <Minus className="h-3 w-3 mr-0.5" />
                                        ) : isPositive ? (
                                            <TrendingUp className="h-3 w-3 mr-0.5" />
                                        ) : (
                                            <TrendingDown className="h-3 w-3 mr-0.5" />
                                        )}
                                        {Math.abs(change).toFixed(1)}%
                                    </div>
                                </div>
                                <p className="text-xs text-gray-400 mt-1">
                                    vs {data.previous.toLocaleString()}{data.suffix || ''}
                                </p>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

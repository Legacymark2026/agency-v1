'use client';

import { Target, TrendingUp, TrendingDown, CheckCircle2 } from 'lucide-react';


export interface GoalProgress {
    id: string;
    name: string;
    description: string | null;
    completions: number;
    target: number | null;
    progress: number;
}

interface GoalsWidgetProps {
    data?: GoalProgress[];
}

const colorMap: Record<string, { bg: string; fill: string; text: string }> = {
    violet: { bg: 'bg-violet-100', fill: 'bg-violet-500', text: 'text-violet-600' },
    emerald: { bg: 'bg-emerald-100', fill: 'bg-emerald-500', text: 'text-emerald-600' },
    blue: { bg: 'bg-blue-100', fill: 'bg-blue-500', text: 'text-blue-600' },
    amber: { bg: 'bg-amber-100', fill: 'bg-amber-500', text: 'text-amber-600' },
};

export function GoalsWidget({ data = [] }: GoalsWidgetProps) {
    // If no data, show empty state or nothing
    if (data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center text-gray-500 border border-dashed rounded-xl">
                <Target className="h-8 w-8 text-gray-300 mb-2" />
                <p className="text-sm">No hay metas configuradas</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Target className="h-4 w-4 text-violet-600" />
                    Metas del Mes
                </h3>
                <span className="text-xs text-gray-500">
                    {data.filter(g => g.progress >= 100).length} de {data.length} completadas
                </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                {data.slice(0, 4).map((goal, index) => {
                    const progress = Math.min(goal.progress, 100);
                    const isComplete = progress >= 100;
                    // Cycle colors
                    const colorKeys = Object.keys(colorMap);
                    const colorKey = colorKeys[index % colorKeys.length];
                    const colors = colorMap[colorKey];

                    return (
                        <div
                            key={goal.id}
                            className={`p-4 rounded-xl border transition-all hover:shadow-md ${isComplete ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200' : 'bg-white border-gray-200'
                                }`}
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-xl">🎯</span>
                                    <span className="font-medium text-gray-800 text-sm">
                                        {goal.name}
                                    </span>
                                </div>
                                {isComplete && (
                                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                )}
                            </div>

                            <div className="flex items-baseline gap-1 mb-2">
                                <span className="text-2xl font-bold text-gray-900">
                                    {goal.completions.toLocaleString()}
                                </span>
                                {goal.target && (
                                    <span className="text-sm text-gray-500">
                                        / {goal.target.toLocaleString()}
                                    </span>
                                )}
                            </div>

                            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-700 ${isComplete ? 'bg-emerald-500' : colors.fill
                                        }`}
                                    style={{ width: `${progress}%` }}
                                />
                            </div>

                            <div className="flex items-center justify-between mt-2">
                                <span className={`text-xs font-medium ${isComplete ? 'text-emerald-600' : colors.text
                                    }`}>
                                    {progress.toFixed(1)}% completado
                                </span>
                                {!isComplete && goal.target && (
                                    <span className="text-xs text-gray-500">
                                        Faltan {(goal.target - goal.completions).toLocaleString()}
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

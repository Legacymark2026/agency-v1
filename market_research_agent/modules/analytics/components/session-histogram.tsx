'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Clock } from 'lucide-react';
import { DurationData } from '@/modules/analytics/actions/analytics';

interface SessionHistogramProps {
    data?: DurationData[];
}

const CustomTooltip = ({ active, payload, label, total }: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) => {
    if (active && payload && payload.length) {
        const percentage = total > 0 ? ((payload[0].value / total) * 100).toFixed(1) : 0;
        return (
            <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl p-3 shadow-xl">
                <p className="font-semibold text-gray-900">{label}</p>
                <p className="text-sm text-gray-600">
                    <span className="font-bold">{payload[0].value.toLocaleString()}</span> sesiones
                </p>
                <p className="text-xs text-violet-600 font-medium">{percentage}% del total</p>
            </div>
        );
    }
    return null;
};

export function SessionHistogram({ data = [] }: SessionHistogramProps) {
    const total = data.reduce((sum, d) => sum + d.count, 0);
    // Avg duration logic would be passed ideally, but for now placeholder or 0
    const avgDuration = total > 0 ? "Calculado" : "-";

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-violet-600" />
                    Distribución de Duración de Sesión
                </h4>
                <div className="text-right">
                    <p className="text-xs text-gray-500">Promedio</p>
                    <p className="text-lg font-bold text-gray-900">{avgDuration}</p>
                </div>
            </div>

            <ResponsiveContainer width="100%" height={250}>
                <BarChart data={data} barCategoryGap="15%">
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis
                        dataKey="range"
                        stroke="#9ca3af"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                    />
                    <YAxis
                        stroke="#9ca3af"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => `${(v / 1000).toFixed(1)}k`}
                    />
                    <Tooltip content={(props) => <CustomTooltip {...props} total={total} />} />
                    <Bar
                        dataKey="count"
                        radius={[4, 4, 0, 0]}
                        animationDuration={1000}
                    >
                        {data.map((entry, index) => (
                            <Cell key={index} fill={entry.fill} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>

            {/* Quick stats */}
            <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
                <div className="text-center">
                    <p className="text-2xl font-bold text-red-500">
                        {((data[0].count / total) * 100).toFixed(0)}%
                    </p>
                    <p className="text-xs text-gray-500">Rebote rápido</p>
                </div>
                <div className="text-center">
                    <p className="text-2xl font-bold text-emerald-500">
                        {(((data[3].count + data[4].count) / total) * 100).toFixed(0)}%
                    </p>
                    <p className="text-xs text-gray-500">Engagement óptimo</p>
                </div>
                <div className="text-center">
                    <p className="text-2xl font-bold text-cyan-500">
                        {(((data[5].count + data[6].count) / total) * 100).toFixed(0)}%
                    </p>
                    <p className="text-xs text-gray-500">Sesiones largas</p>
                </div>
            </div>
        </div>
    );
}

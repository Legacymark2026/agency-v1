'use client';

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    Cell
} from 'recharts';
import { ChannelPerformance } from '@/modules/analytics/actions/analytics';

interface SeoMetricsProps {
    data?: ChannelPerformance[];
}

const CustomTooltip = ({ active, payload, label }: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) => {
    if (active && payload && payload.length) {
        const total = payload.reduce((sum: number, entry: any) => sum + entry.value, 0);
        return (
            <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl p-4 shadow-xl">
                <p className="text-sm font-semibold text-gray-900 mb-2">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center justify-between gap-4 text-sm">
                        <div className="flex items-center gap-2">
                            <div
                                className="w-3 h-3 rounded"
                                style={{ backgroundColor: entry.fill }}
                            />
                            <span className="text-gray-600">{entry.name}</span>
                        </div>
                        <span className="font-semibold text-gray-900">
                            {entry.value.toLocaleString()}
                        </span>
                    </div>
                ))}
                <div className="border-t border-gray-200 mt-2 pt-2 flex justify-between">
                    <span className="text-sm text-gray-600">Total</span>
                    <span className="text-sm font-bold text-gray-900">{total.toLocaleString()}</span>
                </div>
            </div>
        );
    }
    return null;
};

export function SeoMetrics({ data = [] }: SeoMetricsProps) {
    const chartData = data.length > 0 ? data : [
        { name: 'Sin datos', organic: 0, paid: 0 }
    ];

    return (
        <ResponsiveContainer width="100%" height={350}>
            <BarChart data={chartData} barGap={4}>
                <defs>
                    <linearGradient id="organicGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                        <stop offset="100%" stopColor="#059669" stopOpacity={1} />
                    </linearGradient>
                    <linearGradient id="paidGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f59e0b" stopOpacity={1} />
                        <stop offset="100%" stopColor="#d97706" stopOpacity={1} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis
                    dataKey="name"
                    stroke="#9ca3af"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                />
                <YAxis
                    stroke="#9ca3af"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${(value / 1).toFixed(0)}`}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
                <Legend
                    wrapperStyle={{ paddingTop: '20px' }}
                    iconType="square"
                />
                <Bar
                    dataKey="organic"
                    name="Tráfico Orgánico"
                    fill="url(#organicGradient)"
                    radius={[6, 6, 0, 0]}
                    animationDuration={1200}
                />
                <Bar
                    dataKey="paid"
                    name="Tráfico Pago"
                    fill="url(#paidGradient)"
                    radius={[6, 6, 0, 0]}
                    animationDuration={1200}
                />
            </BarChart>
        </ResponsiveContainer>
    );
}

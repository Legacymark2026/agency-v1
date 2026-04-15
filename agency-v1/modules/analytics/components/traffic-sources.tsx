'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { TrafficSource } from '@/modules/analytics/actions/analytics';

interface TrafficSourcesProps {
    data?: TrafficSource[];
}

// Colors for top 5 sources
const COLORS = ['#10b981', '#8b5cf6', '#06b6d4', '#f59e0b', '#ef4444', '#ec4899', '#6366f1'];

const CustomTooltip = ({ active, payload }: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) => {
    if (active && payload && payload.length) {
        const item = payload[0].payload;
        return (
            <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl p-3 shadow-xl">
                <div className="flex items-center gap-2">
                    <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                    />
                    <span className="font-semibold text-gray-900">{item.name}</span>
                </div>
                <div className="mt-1 text-sm text-gray-600">
                    <span className="font-bold text-gray-900">{item.value.toLocaleString()}</span>
                    {' '}sesiones ({item.percentage}%)
                </div>
            </div>
        );
    }
    return null;
};

export function TrafficSources({ data = [] }: TrafficSourcesProps) {
    // Transform API data to Chart format
    const chartData = data.length > 0 ? data.slice(0, 5).map((d, index) => ({
        name: d.source === 'direct' ? 'Directo' : d.source,
        value: d.sessions,
        color: COLORS[index % COLORS.length],
        percentage: d.percentage
    })) : [
        { name: 'Sin datos', value: 100, color: '#e5e7eb', percentage: 100 }
    ];

    return (
        <div className="flex flex-col lg:flex-row items-center gap-4">
            <div className="w-full lg:w-1/2">
                <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            outerRadius={90}
                            innerRadius={0}
                            fill="#8884d8"
                            dataKey="value"
                            animationDuration={1000}
                        >
                            {chartData.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={entry.color}
                                    className="hover:opacity-80 transition-opacity cursor-pointer"
                                />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                </ResponsiveContainer>
            </div>

            <div className="w-full lg:w-1/2 space-y-3">
                {chartData.map((item) => (
                    <div key={item.name} className="group">
                        <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                                <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: item.color }}
                                />
                                <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
                                    {item.name}
                                </span>
                            </div>
                            <span className="text-sm font-semibold text-gray-900">
                                {item.percentage}%
                            </span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                            <div
                                className="h-full rounded-full transition-all duration-500 group-hover:opacity-80"
                                style={{
                                    width: `${item.percentage}%`,
                                    backgroundColor: item.color
                                }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

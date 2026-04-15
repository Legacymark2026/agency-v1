'use client';

import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts';
import { TrafficDataPoint } from '@/modules/analytics/actions/analytics';
import { RechartsTooltipProps, RechartsPayload } from '@/types/recharts';

interface TrafficChartProps {
    data?: TrafficDataPoint[];
}

const CustomTooltip = ({ active, payload, label }: RechartsTooltipProps) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl p-4 shadow-xl">
                <p className="text-sm font-semibold text-gray-900 mb-2">{label}</p>
                {payload.map((entry: RechartsPayload, index: number) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                        <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-gray-600">{entry.name}:</span>
                        <span className="font-semibold text-gray-900">
                            {entry.value?.toLocaleString() || 0}
                        </span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

export function TrafficChart({ data = [] }: TrafficChartProps) {
    // Transform API data to Chart format
    const chartData = data.length > 0 ? data.map(d => ({
        name: new Date(d.date).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' }),
        users: d.visitors,
        sessions: d.sessions,
        pageViews: d.pageViews
    })) : [
        // Fallback placeholder if no data
        { name: 'Sin datos', users: 0, sessions: 0 }
    ];

    return (
        <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={chartData}>
                <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
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
                <Tooltip content={<CustomTooltip />} />
                <Legend
                    wrapperStyle={{ paddingTop: '20px' }}
                    iconType="circle"
                />
                <Area
                    type="monotone"
                    dataKey="users"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    fill="url(#colorUsers)"
                    name="Usuarios"
                    animationDuration={1500}
                />
                <Area
                    type="monotone"
                    dataKey="sessions"
                    stroke="#06b6d4"
                    strokeWidth={2}
                    fill="url(#colorSessions)"
                    name="Sesiones"
                    animationDuration={1500}
                />
            </AreaChart>
        </ResponsiveContainer>
    );
}

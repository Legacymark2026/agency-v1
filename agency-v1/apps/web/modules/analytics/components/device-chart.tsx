'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { DeviceStats } from '@/modules/analytics/actions/analytics';
import { Monitor, Smartphone, Tablet, HelpCircle } from 'lucide-react';
import { RechartsTooltipProps } from '@/types/recharts';

interface DeviceChartProps {
    data?: DeviceStats[];
}

const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#9ca3af'];

const CustomTooltip = ({ active, payload }: RechartsTooltipProps) => {
    if (active && payload && payload.length) {
        const item = payload[0]?.payload;
        if (!item) return null;
        return (
            <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl p-3 shadow-xl">
                <div className="flex items-center gap-2">
                    <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: item.fill }}
                    />
                    <span className="font-semibold text-gray-900 capitalize">{item.name}</span>
                </div>
                <div className="mt-1 text-sm text-gray-600">
                    <span className="font-bold text-gray-900">{item.value?.toLocaleString() || 0}</span>
                    {' '}sesiones ({item.percentage}%)
                </div>
            </div>
        );
    }
    return null;
};

export function DeviceChart({ data = [] }: DeviceChartProps) {
    // Determine icon based on device type
    const getIcon = (type: string) => {
        switch (type.toLowerCase()) {
            case 'desktop': return <Monitor className="h-4 w-4" />;
            case 'mobile': return <Smartphone className="h-4 w-4" />;
            case 'tablet': return <Tablet className="h-4 w-4" />;
            default: return <HelpCircle className="h-4 w-4" />;
        }
    };

    const chartData = data.length > 0 ? data.map((d, index) => ({
        name: d.device === 'desktop' ? 'Escritorio' : d.device === 'mobile' ? 'Móvil' : d.device === 'tablet' ? 'Tablet' : 'Otro',
        value: d.sessions,
        fill: COLORS[index % COLORS.length],
        percentage: d.percentage,
        icon: getIcon(d.device)
    })) : [
        { name: 'Sin datos', value: 100, fill: '#e5e7eb', percentage: 100, icon: <HelpCircle className="h-4 w-4" /> }
    ];

    return (
        <div className="flex flex-col h-full justify-between">
            <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                    <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                    >
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} strokeWidth={0} />
                        ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                </PieChart>
            </ResponsiveContainer>

            <div className="space-y-3 mt-4">
                {chartData.map((entry, index) => (
                    <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-1.5 rounded-lg bg-gray-100 text-gray-600">
                                {entry.icon}
                            </div>
                            <span className="text-sm font-medium text-gray-700">{entry.name}</span>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-bold text-gray-900">{entry.percentage}%</p>
                            <p className="text-xs text-gray-500">{entry.value.toLocaleString()}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

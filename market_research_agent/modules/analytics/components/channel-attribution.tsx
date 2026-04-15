'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
import { Share2 } from 'lucide-react';
import { AttributionData } from '@/modules/analytics/actions/analytics';

interface ChannelAttributionProps {
    data?: AttributionData[];
}

const CustomTooltip = ({ active, payload, label }: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl p-3 shadow-xl">
                <p className="font-semibold text-gray-900 mb-2">{label}</p>
                {payload.map((entry: any, i: number) => (
                    <div key={i} className="flex items-center justify-between gap-4 text-sm">
                        <span className="text-gray-600">{entry.name}:</span>
                        <span className="font-semibold">
                            {entry.name === 'Revenue' ? `$${entry.value.toLocaleString()}` : entry.value}
                        </span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

export function ChannelAttribution({ data = [] }: ChannelAttributionProps) {
    // Determine data source
    const hasData = data.length > 0;
    const chartData = hasData ? data : [{ channel: 'Sin datos', conversions: 0, revenue: 0, color: '#e5e7eb' }];

    const totalConversions = data.reduce((sum, d) => sum + d.conversions, 0);
    const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Share2 className="h-4 w-4 text-violet-600" />
                    Atribución por Canal (Est.)
                </h3>
                <div className="flex gap-4 text-xs">
                    <div>
                        <span className="text-gray-500">Conversiones:</span>
                        <span className="font-bold text-gray-900 ml-1">{totalConversions}</span>
                    </div>
                    <div>
                        <span className="text-gray-500">Revenue:</span>
                        <span className="font-bold text-emerald-600 ml-1">${totalRevenue.toLocaleString()}</span>
                    </div>
                </div>
            </div>

            <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData} layout="vertical" barCategoryGap="20%">
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e5e7eb" />
                    <XAxis type="number" stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis
                        type="category"
                        dataKey="channel"
                        stroke="#9ca3af"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        width={70}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="conversions" name="Conversiones" radius={[0, 4, 4, 0]}>
                        {chartData.map((entry, index) => (
                            <Cell key={index} fill={entry.color} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>

            {/* Quick stats */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t">
                {hasData ? data.slice(0, 3).map((channel) => (
                    <div key={channel.channel} className="text-center p-2 rounded-lg bg-gray-50">
                        <div
                            className="w-2 h-2 rounded-full mx-auto mb-1"
                            style={{ backgroundColor: channel.color }}
                        />
                        <p className="text-xs text-gray-500">{channel.channel}</p>
                        <p className="text-sm font-bold text-gray-900">
                            {totalConversions > 0 ? ((channel.conversions / totalConversions) * 100).toFixed(0) : 0}%
                        </p>
                    </div>
                )) : (
                    <div className="col-span-3 text-center text-xs text-gray-400">
                        No hay datos de atribución disponibles.
                    </div>
                )}
            </div>
        </div>
    );
}

'use client';

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Activity } from 'lucide-react';

const data = [
    { metric: 'Tiempo en Sitio', current: 85, previous: 72, fullMark: 100 },
    { metric: 'Páginas/Sesión', current: 78, previous: 65, fullMark: 100 },
    { metric: 'Bounce Rate', current: 65, previous: 58, fullMark: 100 },
    { metric: 'Retención', current: 72, previous: 68, fullMark: 100 },
    { metric: 'Shares', current: 58, previous: 45, fullMark: 100 },
    { metric: 'Comentarios', current: 45, previous: 52, fullMark: 100 },
];

const CustomTooltip = ({ active, payload, label }: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl p-3 shadow-xl">
                <p className="font-semibold text-gray-900 mb-2">{label}</p>
                {payload.map((entry: any, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                        <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-gray-600">{entry.name}:</span>
                        <span className="font-semibold">{entry.value}%</span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

import { EngagementMetric } from '@/modules/analytics/actions/analytics';

interface EngagementRadarProps {
    data?: EngagementMetric[];
}

export function EngagementRadar({ data: propData = [] }: EngagementRadarProps) {
    const displayData = propData.length > 0 ? propData : data;

    // Calculate overall engagement score
    const currentAvg = Math.round(displayData.reduce((sum, d) => sum + d.current, 0) / displayData.length);
    const previousAvg = Math.round(displayData.reduce((sum, d) => sum + d.previous, 0) / displayData.length);
    const change = currentAvg - previousAvg;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Activity className="h-4 w-4 text-violet-600" />
                    Radar de Engagement
                </h3>
                <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-gray-900">{currentAvg}%</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${change >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                        }`}>
                        {change >= 0 ? '+' : ''}{change}%
                    </span>
                </div>
            </div>

            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={displayData}>
                        <PolarGrid stroke="#e5e7eb" />
                        <PolarAngleAxis
                            dataKey="metric"
                            tick={{ fill: '#6b7280', fontSize: 11 }}
                        />
                        <PolarRadiusAxis
                            angle={30}
                            domain={[0, 100]}
                            tick={{ fill: '#9ca3af', fontSize: 10 }}
                        />
                        <Radar
                            name="Mes Anterior"
                            dataKey="previous"
                            stroke="#9ca3af"
                            fill="#9ca3af"
                            fillOpacity={0.2}
                            strokeWidth={1}
                        />
                        <Radar
                            name="Este Mes"
                            dataKey="current"
                            stroke="#8b5cf6"
                            fill="#8b5cf6"
                            fillOpacity={0.4}
                            strokeWidth={2}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend
                            wrapperStyle={{ fontSize: '12px' }}
                            iconType="circle"
                        />
                    </RadarChart>
                </ResponsiveContainer>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t">
                {displayData.slice(0, 3).map((item) => {
                    const diff = item.current - item.previous;
                    return (
                        <div key={item.metric} className="text-center p-2 bg-gray-50 rounded-lg">
                            <p className="text-xs text-gray-500 truncate">{item.metric}</p>
                            <p className="text-sm font-bold text-gray-900">{item.current}%</p>
                            <p className={`text-xs ${diff >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                {diff >= 0 ? '+' : ''}{diff}%
                            </p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { RechartsTooltipProps } from '@/types/recharts';

const data = [
    { date: 'Ene', rate: 38.5 },
    { date: 'Feb', rate: 36.2 },
    { date: 'Mar', rate: 35.8 },
    { date: 'Abr', rate: 37.1 },
    { date: 'May', rate: 34.5 },
    { date: 'Jun', rate: 33.2 },
    { date: 'Jul', rate: 31.8 },
    { date: 'Ago', rate: 32.5 },
    { date: 'Sep', rate: 30.2 },
    { date: 'Oct', rate: 29.8 },
    { date: 'Nov', rate: 28.5 },
    { date: 'Dic', rate: 27.3 },
];

const CustomTooltip = ({ active, payload, label }: RechartsTooltipProps) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl p-3 shadow-xl">
                <p className="font-semibold text-gray-900">{label}</p>
                <p className="text-sm text-gray-600">
                    Bounce Rate: <span className="font-bold text-orange-600">{payload[0].value}%</span>
                </p>
            </div>
        );
    }
    return null;
};

export function BounceTrend() {
    const firstRate = data[0].rate;
    const lastRate = data[data.length - 1].rate;
    const change = ((lastRate - firstRate) / firstRate * 100).toFixed(1);
    const isImproving = lastRate < firstRate;
    const avgRate = (data.reduce((sum, d) => sum + d.rate, 0) / data.length).toFixed(1);

    return (
        <div>
            <div className="flex items-start justify-between mb-4">
                <div>
                    <h4 className="text-sm font-semibold text-gray-700">Tendencia de Bounce Rate</h4>
                    <p className="text-xs text-gray-500">Últimos 12 meses</p>
                </div>
                <div className="text-right">
                    <div className={`flex items-center gap-1 ${isImproving ? 'text-emerald-600' : 'text-red-500'}`}>
                        {isImproving ? (
                            <TrendingDown className="h-4 w-4" />
                        ) : (
                            <TrendingUp className="h-4 w-4" />
                        )}
                        <span className="font-semibold">{Math.abs(Number(change))}%</span>
                    </div>
                    <p className="text-xs text-gray-500">{isImproving ? 'Mejora' : 'Deterioro'}</p>
                </div>
            </div>

            <ResponsiveContainer width="100%" height={200}>
                <LineChart data={data}>
                    <defs>
                        <linearGradient id="bounceGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis
                        dataKey="date"
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
                        domain={[20, 45]}
                        tickFormatter={(v) => `${v}%`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <ReferenceLine
                        y={Number(avgRate)}
                        stroke="#9ca3af"
                        strokeDasharray="3 3"
                        label={{
                            value: `Promedio: ${avgRate}%`,
                            position: 'right',
                            fill: '#6b7280',
                            fontSize: 10
                        }}
                    />
                    <Line
                        type="monotone"
                        dataKey="rate"
                        stroke="#f97316"
                        strokeWidth={2}
                        dot={{ fill: '#f97316', strokeWidth: 0, r: 3 }}
                        activeDot={{ fill: '#f97316', strokeWidth: 2, stroke: '#fff', r: 5 }}
                        animationDuration={1500}
                    />
                </LineChart>
            </ResponsiveContainer>

            {/* Quick comparison */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <div>
                    <p className="text-xs text-gray-500">Inicio del año</p>
                    <p className="text-lg font-bold text-gray-900">{firstRate}%</p>
                </div>
                <div className="flex-1 px-4">
                    <div className="h-1 bg-gray-100 rounded-full relative">
                        <div
                            className="absolute left-0 top-0 h-full bg-gradient-to-r from-orange-500 to-emerald-500 rounded-full"
                            style={{ width: '100%' }}
                        />
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-xs text-gray-500">Actual</p>
                    <p className="text-lg font-bold text-emerald-600">{lastRate}%</p>
                </div>
            </div>
        </div>
    );
}

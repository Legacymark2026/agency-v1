'use client';

import { DollarSign, TrendingUp, TrendingDown, ShoppingCart, CreditCard, Target } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts';
import { RevenueData } from '@/modules/analytics/actions/analytics';

interface RevenueTrackerProps {
    data?: RevenueData;
}

const colorMap: Record<string, { bg: string; text: string; lightBg: string }> = {
    emerald: { bg: 'bg-emerald-500', text: 'text-emerald-600', lightBg: 'bg-emerald-100' },
    blue: { bg: 'bg-blue-500', text: 'text-blue-600', lightBg: 'bg-blue-100' },
    violet: { bg: 'bg-violet-500', text: 'text-violet-600', lightBg: 'bg-violet-100' },
    amber: { bg: 'bg-amber-500', text: 'text-amber-600', lightBg: 'bg-amber-100' },
};

const iconMap: Record<string, any> = {
    'Ingresos del Mes': DollarSign,
    'Pedidos (Deals)': ShoppingCart,
    'Ticket Promedio': CreditCard,
    'Meta Mensual': Target
};

export function RevenueTracker({ data }: RevenueTrackerProps) {
    const revenueData = data?.revenue || [];
    const metrics = data?.metrics || [];

    const totalWeekRevenue = revenueData.reduce((sum, d) => sum + d.value, 0);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-emerald-600" />
                    Seguimiento de Ingresos (CRM)
                </h3>
                <span className="text-xs text-gray-500">Última semana</span>
            </div>

            {/* Revenue Chart */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                    <div>
                        <p className="text-xs text-emerald-600 font-medium">Ingresos Semanales</p>
                        <p className="text-2xl font-bold text-gray-900">${totalWeekRevenue.toLocaleString()}</p>
                    </div>
                    {/* Placeholder trend for now, could be calculated if we fetch previous week */}
                    <div className="flex items-center gap-1 px-2 py-1 bg-emerald-100 rounded-full">
                        <TrendingUp className="h-3 w-3 text-emerald-600" />
                        <span className="text-xs font-semibold text-emerald-700">Live</span>
                    </div>
                </div>
                <div className="h-16">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={revenueData.length ? revenueData : [{ day: '-', value: 0 }]}>
                            <Tooltip
                                content={({ active, payload }) =>
                                    active && payload?.length ? (
                                        <div className="bg-white px-2 py-1 rounded shadow text-xs font-semibold">
                                            ${payload[0].value?.toLocaleString()}
                                        </div>
                                    ) : null
                                }
                            />
                            <Line
                                type="monotone"
                                dataKey="value"
                                stroke="#10b981"
                                strokeWidth={2}
                                dot={false}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-3">
                {metrics.length > 0 ? metrics.map((metric) => {
                    const colors = colorMap[metric.color] || colorMap.emerald;
                    const Icon = iconMap[metric.label] || DollarSign;

                    return (
                        <div key={metric.label} className="p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                            <div className="flex items-center gap-2 mb-2">
                                <div className={`p-1.5 rounded-lg ${colors.lightBg}`}>
                                    <Icon className={`h-3.5 w-3.5 ${colors.text}`} />
                                </div>
                                <span className="text-xs text-gray-500">{metric.label}</span>
                            </div>
                            <div className="flex items-baseline justify-between">
                                <span className="text-lg font-bold text-gray-900">
                                    {metric.prefix}{typeof metric.value === 'number' ? metric.value.toLocaleString() : metric.value}{metric.suffix || ''}
                                </span>
                                {metric.change !== null && (
                                    <span className={`text-xs font-medium ${metric.change >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                        {metric.change >= 0 ? '+' : ''}{metric.change}%
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                }) : (
                    <div className="col-span-2 text-center text-xs text-gray-400 py-4">
                        Conecta el CRM para ver métricas de ingresos.
                    </div>
                )}
            </div>
        </div>
    );
}

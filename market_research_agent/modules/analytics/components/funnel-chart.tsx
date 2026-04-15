'use client';

import { FunnelChart, Funnel, LabelList, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import { FunnelStage } from '@/modules/analytics/actions/analytics';
import { RechartsTooltipProps } from '@/types/recharts';

interface FunnelChartProps {
    data?: FunnelStage[];
}

const CustomTooltip = ({ active, payload }: RechartsTooltipProps) => {
    if (active && payload && payload.length) {
        const data = payload[0]?.payload;
        if (!data) return null;
        return (
            <div className="bg-white/95 backdrop-blur-sm border border gray-200 rounded-xl p-3 shadow-xl">
                <p className="font-semibold text-gray-900">{data.name}</p>
                <p className="text-sm text-gray-600">
                    <span className="font-bold">{data.value?.toLocaleString() || 0}</span> usuarios
                </p>
                <p className="text-xs text-violet-600 font-medium">
                    {data.percentage}% del total
                </p>
            </div>
        );
    }
    return null;
};

export function FunnelChartComponent({ data = [] }: FunnelChartProps) {
    const funnelData = data.length > 0 ? data : [
        { name: 'Visitantes', value: 0, fill: '#8b5cf6', percentage: 0 },
        { name: 'Páginas Vistas', value: 0, fill: '#a78bfa', percentage: 0 },
    ];

    return (
        <div className="w-full">
            <ResponsiveContainer width="100%" height={300}>
                <FunnelChart>
                    <Tooltip content={<CustomTooltip />} />
                    <Funnel
                        dataKey="value"
                        data={funnelData}
                        isAnimationActive
                        animationDuration={1000}
                    >
                        <LabelList
                            position="right"
                            fill="#374151"
                            fontSize={12}
                            dataKey="name"
                        />
                        <LabelList
                            position="center"
                            fill="#fff"
                            fontSize={14}
                            fontWeight={600}
                            formatter={(value) => Number(value).toLocaleString()}
                        />
                        {funnelData.map((entry, index) => (
                            <Cell key={index} fill={entry.fill} />
                        ))}
                    </Funnel>
                </FunnelChart>
            </ResponsiveContainer>

            {/* Conversion rates between stages */}
            <div className="flex justify-center gap-2 mt-4 flex-wrap">
                {funnelData.slice(0, -1).map((stage, i) => {
                    const nextStage = funnelData[i + 1];
                    const conversionRate = stage.value > 0 ? ((nextStage.value / stage.value) * 100).toFixed(1) : '0.0';
                    return (
                        <div key={stage.name} className="text-center px-3 py-1 bg-gray-50 rounded-lg m-1">
                            <p className="text-xs text-gray-500">{stage.name.slice(0, 3)} → {nextStage.name.slice(0, 3)}</p>
                            <p className="text-sm font-bold text-violet-600">{conversionRate}%</p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

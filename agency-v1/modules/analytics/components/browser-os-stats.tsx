'use client';

import { Monitor, Smartphone, Globe } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { BrowserOsData } from '@/modules/analytics/actions/analytics';

interface BrowserOsStatsProps {
    data?: BrowserOsData;
}

const CustomTooltip = ({ active, payload }: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg px-3 py-2 shadow-xl">
                <p className="text-sm font-semibold" style={{ color: payload[0].payload.color }}>
                    {payload[0].name}: {payload[0].value}%
                </p>
            </div>
        );
    }
    return null;
};

function MiniPieChart({ data, title, icon: Icon }: { data: any[]; title: string; icon: React.ElementType }) {
    // Handle empty data
    const chartData = data.length > 0 ? data : [{ name: 'Sin datos', value: 100, color: '#e5e7eb' }];

    return (
        <div className="flex-1 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
                <Icon className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">{title}</span>
            </div>
            <div className="relative h-32">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={30}
                            outerRadius={50}
                            paddingAngle={2}
                            dataKey="value"
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={index} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-2 mt-2">
                {data.slice(0, 3).map((item) => (
                    <span key={item.name} className="text-xs flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                        {item.name}
                    </span>
                ))}
            </div>
        </div>
    );
}

export function BrowserOsStats({ data }: BrowserOsStatsProps) {
    const browsers = data?.browsers || [];
    const os = data?.os || [];

    return (
        <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Monitor className="h-4 w-4 text-violet-600" />
                Navegadores y Sistemas Operativos
            </h3>

            <div className="flex gap-4">
                <MiniPieChart data={browsers} title="Navegadores" icon={Globe} />
                <MiniPieChart data={os} title="Sistemas" icon={Smartphone} />
            </div>

            {/* Details Table */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                    <p className="text-xs text-gray-500 mb-2">Top Navegadores</p>
                    {browsers.length > 0 ? browsers.slice(0, 4).map((b) => (
                        <div key={b.name} className="flex items-center justify-between py-1">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: b.color }} />
                                <span className="text-xs text-gray-700">{b.name}</span>
                            </div>
                            <span className="text-xs font-semibold text-gray-900">{b.value}%</span>
                        </div>
                    )) : <p className="text-xs text-gray-400 italic">No hay datos</p>}
                </div>
                <div>
                    <p className="text-xs text-gray-500 mb-2">Top Sistemas</p>
                    {os.length > 0 ? os.slice(0, 4).map((o) => (
                        <div key={o.name} className="flex items-center justify-between py-1">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: o.color }} />
                                <span className="text-xs text-gray-700">{o.name}</span>
                            </div>
                            <span className="text-xs font-semibold text-gray-900">{o.value}%</span>
                        </div>
                    )) : <p className="text-xs text-gray-400 italic">No hay datos</p>}
                </div>
            </div>
        </div>
    );
}

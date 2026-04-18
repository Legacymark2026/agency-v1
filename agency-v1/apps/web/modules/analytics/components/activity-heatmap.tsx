'use client';

import { useMemo } from 'react';
import { Tooltip } from 'recharts';
import { HeatmapData } from '@/modules/analytics/actions/analytics';

interface ActivityHeatmapProps {
    data?: HeatmapData[];
}

const levelColors = [
    'bg-gray-100',      // 0 - no activity
    'bg-emerald-200',   // 1 - low
    'bg-emerald-300',   // 2 - medium
    'bg-emerald-400',   // 3 - high
    'bg-emerald-600',   // 4 - very high
];

export function ActivityHeatmap({ data = [] }: ActivityHeatmapProps) {

    // Group data by weeks (columns) and days (rows)
    const weeks = useMemo(() => {
        const result: typeof data[] = [];
        let currentWeek: typeof data = [];

        data.forEach((day, i) => {
            const date = new Date(day.date);
            const dayOfWeek = date.getDay();

            if (dayOfWeek === 0 && currentWeek.length > 0) {
                result.push(currentWeek);
                currentWeek = [];
            }
            currentWeek.push(day);

            if (i === data.length - 1) {
                result.push(currentWeek);
            }
        });

        return result;
    }, [data]);

    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

    return (
        <div className="w-full overflow-x-auto">
            {/* Month labels */}
            <div className="flex mb-2 text-xs text-gray-500 pl-8">
                {months.map((month, i) => (
                    <span key={month} className="flex-1 text-center">{month}</span>
                ))}
            </div>

            <div className="flex gap-[2px]">
                {/* Day labels */}
                <div className="flex flex-col gap-[2px] text-xs text-gray-500 pr-2">
                    {days.map((day, i) => (
                        <div key={day} className="h-3 flex items-center">
                            {i % 2 === 1 && <span>{day}</span>}
                        </div>
                    ))}
                </div>

                {/* Heatmap grid */}
                <div className="flex gap-[2px]">
                    {weeks.map((week, weekIndex) => (
                        <div key={weekIndex} className="flex flex-col gap-[2px]">
                            {week.map((day) => (
                                <div
                                    key={day.date}
                                    className={`w-3 h-3 rounded-sm ${levelColors[day.level]} 
                                        hover:ring-2 hover:ring-gray-400 hover:ring-offset-1 
                                        cursor-pointer transition-all duration-150`}
                                    title={`${day.date}: ${day.count} eventos`}
                                />
                            ))}
                        </div>
                    ))}
                </div>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-end gap-2 mt-4 text-xs text-gray-500">
                <span>Menos</span>
                {levelColors.map((color, i) => (
                    <div key={i} className={`w-3 h-3 rounded-sm ${color}`} />
                ))}
                <span>Más</span>
            </div>
        </div>
    );
}

'use client';

import { ArrowUpRight, ArrowDownRight, Clock, MousePointer } from 'lucide-react';
import { TopPage } from '@/modules/analytics/actions/analytics';

interface TopPagesProps {
    data?: TopPage[];
}

export function TopPages({ data = [] }: TopPagesProps) {
    const pages = data.length > 0 ? data : [];

    // Format duration (seconds to MM:SS)
    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (pages.length === 0) {
        return (
            <div className="p-4 text-center text-gray-500">
                No hay datos suficientes para mostrar páginas top.
            </div>
        );
    }

    return (
        <div className="overflow-hidden">
            <table className="w-full">
                <thead>
                    <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Página
                        </th>
                        <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Visitas
                        </th>
                        <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">
                            <div className="flex items-center justify-end gap-1">
                                <Clock className="h-3 w-3" />
                                Tiempo
                            </div>
                        </th>
                        <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                            <div className="flex items-center justify-end gap-1">
                                <MousePointer className="h-3 w-3" />
                                Rebote
                            </div>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {pages.map((page) => (
                        <tr
                            key={page.path}
                            className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50 transition-colors group"
                        >
                            <td className="py-3 px-4">
                                <div>
                                    <p className="font-medium text-gray-900 group-hover:text-violet-600 transition-colors">
                                        {page.title}
                                    </p>
                                    <p className="text-xs text-gray-500">{page.path}</p>
                                </div>
                            </td>
                            <td className="py-3 px-4 text-right">
                                <span className="font-semibold text-gray-900">
                                    {page.views.toLocaleString()}
                                </span>
                            </td>
                            <td className="py-3 px-4 text-right hidden md:table-cell">
                                <span className="text-gray-600">{formatDuration(page.avgDuration)}</span>
                            </td>
                            <td className="py-3 px-4 text-right hidden lg:table-cell">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${page.bounceRate < 30
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : page.bounceRate < 50
                                        ? 'bg-amber-100 text-amber-700'
                                        : 'bg-red-100 text-red-700'
                                    }`}>
                                    {page.bounceRate}%
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

'use client';

import { Search } from 'lucide-react';
import { useState, useEffect } from 'react';

const searchTerms = [
    { term: 'agencia publicidad bogota', count: 890, trend: 12 },
    { term: 'marketing digital colombia', count: 756, trend: 8 },
    { term: 'diseño web profesional', count: 623, trend: -3 },
    { term: 'branding empresarial', count: 534, trend: 15 },
    { term: 'redes sociales empresas', count: 478, trend: 5 },
    { term: 'publicidad facebook', count: 412, trend: -8 },
    { term: 'seo colombia', count: 389, trend: 22 },
    { term: 'ecommerce bogota', count: 345, trend: 18 },
    { term: 'fotografía producto', count: 298, trend: 2 },
    { term: 'video corporativo', count: 267, trend: 10 },
    { term: 'community manager', count: 234, trend: -2 },
    { term: 'google ads agencia', count: 212, trend: 7 },
    { term: 'landing page diseño', count: 189, trend: 14 },
    { term: 'posicionamiento web', count: 156, trend: 9 },
    { term: 'email marketing', count: 134, trend: 4 },
];

import { SearchTermData } from '@/modules/analytics/actions/analytics';

interface SearchTermsCloudProps {
    data?: SearchTermData[];
}

export function SearchTermsCloud({ data = [] }: SearchTermsCloudProps) {
    // Fallback if no data is passed or empty
    const displayData = data.length > 0 ? data : searchTerms;

    const maxCount = Math.max(...displayData.map(t => t.count));
    const minCount = Math.min(...displayData.map(t => t.count));

    const getSizeClass = (count: number) => {
        const ratio = (count - minCount) / (maxCount - minCount);
        if (ratio > 0.8) return 'text-xl font-bold';
        if (ratio > 0.6) return 'text-lg font-semibold';
        if (ratio > 0.4) return 'text-base font-medium';
        if (ratio > 0.2) return 'text-sm';
        return 'text-xs';
    };

    const getColor = (trend: number) => {
        if (trend > 10) return 'text-emerald-600 hover:text-emerald-700';
        if (trend > 0) return 'text-blue-600 hover:text-blue-700';
        if (trend < -5) return 'text-red-500 hover:text-red-600';
        return 'text-gray-600 hover:text-gray-700';
    };

    const [shuffledTerms, setShuffledTerms] = useState(displayData);

    useEffect(() => {
        const timer = setTimeout(() => {
            setShuffledTerms([...displayData].sort(() => Math.random() - 0.5));
        }, 0);
        return () => clearTimeout(timer);
    }, [displayData]);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Search className="h-4 w-4 text-violet-600" />
                    Términos de Búsqueda
                </h3>
                <span className="text-xs text-gray-500">Top {displayData.length} este mes</span>
            </div>

            {/* Word Cloud */}
            <div className="flex flex-wrap gap-2 justify-center items-center py-4">
                {shuffledTerms.map((item) => (
                    <button
                        key={item.term}
                        className={`px-2 py-1 rounded-lg transition-all hover:bg-gray-100 cursor-pointer group ${getSizeClass(item.count)} ${getColor(item.trend)}`}
                        title={`${item.count} búsquedas (${item.trend > 0 ? '+' : ''}${item.trend}%)`}
                    >
                        {item.term}
                        <span className={`ml-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity ${item.trend > 0 ? 'text-emerald-500' : 'text-red-400'
                            }`}>
                            {item.trend > 0 ? '↑' : '↓'}
                        </span>
                    </button>
                ))}
            </div>

            {/* Top 3 Table */}
            <div className="grid grid-cols-3 gap-2 pt-4 border-t">
                {displayData.slice(0, 3).map((term, i) => (
                    <div key={term.term} className="text-center p-2 bg-gray-50 rounded-lg">
                        <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold text-white mb-1 ${i === 0 ? 'bg-amber-500' : i === 1 ? 'bg-gray-400' : 'bg-amber-700'
                            }`}>
                            {i + 1}
                        </span>
                        <p className="text-xs text-gray-600 truncate">{term.term}</p>
                        <p className="text-sm font-bold text-gray-900">{term.count}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

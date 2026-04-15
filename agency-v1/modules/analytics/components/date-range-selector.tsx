'use client';

import { useState } from 'react';
import { Calendar } from 'lucide-react';

const ranges = [
    { label: '7D', value: '7d', days: 7 },
    { label: '30D', value: '30d', days: 30 },
    { label: '90D', value: '90d', days: 90 },
];

interface DateRangeSelectorProps {
    onRangeChange?: (range: string) => void;
}

export function DateRangeSelector({ onRangeChange }: DateRangeSelectorProps) {
    const [selected, setSelected] = useState('7d');

    const handleSelect = (value: string) => {
        setSelected(value);
        onRangeChange?.(value);
    };

    return (
        <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
            <Calendar className="h-4 w-4 text-gray-500 ml-2" />
            {ranges.map((range) => (
                <button
                    key={range.value}
                    onClick={() => handleSelect(range.value)}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${selected === range.value
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                >
                    {range.label}
                </button>
            ))}
        </div>
    );
}

'use client';

interface CharacterCounterProps {
    current: number;
    max: number;
    label?: string;
}

export function CharacterCounter({ current, max, label }: CharacterCounterProps) {
    const percentage = (current / max) * 100;

    let colorClass = 'text-gray-500';
    if (percentage > 100) {
        colorClass = 'text-red-600 font-semibold';
    } else if (percentage > 90) {
        colorClass = 'text-yellow-600 font-semibold';
    } else if (percentage > 75) {
        colorClass = 'text-yellow-500';
    }

    return (
        <div className={`text-xs ${colorClass} transition-colors`}>
            {label && <span className="mr-1">{label}:</span>}
            <span>{current}</span>
            <span className="text-gray-400"> / </span>
            <span>{max}</span>
        </div>
    );
}

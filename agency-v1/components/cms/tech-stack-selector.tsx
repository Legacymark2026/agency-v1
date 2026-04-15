'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { X, Plus, Code, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface TechStackSelectorProps {
    value: string[];
    onChange: (value: string[]) => void;
}

const COMMON_TECH = [
    "React", "Next.js", "TypeScript", "Tailwind CSS", "Node.js",
    "PostgreSQL", "Prisma", "AWS", "Vercel", "Stripe",
    "OpenAI", "Python", "Figma", "Docker"
];

export function TechStackSelector({ value = [], onChange }: TechStackSelectorProps) {
    const [inputValue, setInputValue] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleAdd = (tech: string) => {
        const trimmed = tech.trim();
        if (trimmed && !value.includes(trimmed)) {
            onChange([...value, trimmed]);
            setInputValue('');
        }
    };

    const handleRemove = (tech: string) => {
        onChange(value.filter(t => t !== tech));
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAdd(inputValue);
        }
    };

    const toggleTech = (tech: string) => {
        if (value.includes(tech)) {
            handleRemove(tech);
        } else {
            handleAdd(tech);
        }
    };

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="space-y-3" ref={containerRef}>
            <label className="text-sm font-medium flex items-center gap-2">
                <Code className="h-4 w-4" />
                Technologies Used
            </label>

            <div className="flex flex-wrap gap-2 min-h-[40px] p-2 bg-white border rounded-md focus-within:ring-2 focus-within:ring-black">
                {value.map(tech => (
                    <Badge key={tech} variant="secondary" className="gap-1 pr-1">
                        {tech}
                        <button
                            type="button"
                            onClick={() => handleRemove(tech)}
                            className="hover:bg-gray-200 rounded-full p-0.5"
                        >
                            <X className="h-3 w-3" />
                        </button>
                    </Badge>
                ))}
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => {
                        setInputValue(e.target.value);
                        setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    onKeyDown={handleKeyDown}
                    placeholder="Add technology..."
                    className="flex-1 bg-transparent outline-none text-sm min-w-[120px]"
                />
            </div>

            {showSuggestions && (
                <div className="p-3 bg-gray-50 border rounded-md">
                    <p className="text-xs text-gray-500 mb-2">Common Technologies:</p>
                    <div className="flex flex-wrap gap-2">
                        {COMMON_TECH.map(tech => (
                            <button
                                key={tech}
                                type="button"
                                onClick={() => toggleTech(tech)}
                                className={`text-xs px-2 py-1 rounded-md border transition-colors flex items-center gap-1 ${value.includes(tech)
                                        ? 'bg-black text-white border-black'
                                        : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
                                    }`}
                            >
                                {value.includes(tech) && <Check className="h-3 w-3" />}
                                {tech}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

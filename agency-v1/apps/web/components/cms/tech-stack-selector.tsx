'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { X, Plus, Code, Check, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface TechStackSelectorProps {
    value: string[];
    onChange: (value: string[]) => void;
}

const COMMON_TECH = [
    "React", "Next.js", "TypeScript", "Tailwind CSS", "Node.js",
    "PostgreSQL", "Prisma", "AWS", "Vercel", "Stripe",
    "OpenAI", "Python", "Figma", "Docker", "Framer Motion", "Three.js"
];

/**
 * Premium HUD Tech Stack selector.
 */
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
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Code className="h-4 w-4" />
                Tecnologías & Herramientas
            </label>

            <div className="flex flex-wrap gap-2 min-h-[48px] p-2 bg-slate-950 border border-slate-700 rounded-xl focus-within:border-teal-500/50 transition-all">
                {value.map(tech => (
                    <Badge 
                        key={tech} 
                        className="bg-teal-500/10 text-teal-400 border-teal-500/20 px-2 py-1 flex items-center gap-1.5 hover:bg-teal-500/20 transition-colors"
                    >
                        <span className="text-[10px] font-mono font-bold tracking-wider">{tech}</span>
                        <button
                            type="button"
                            onClick={() => handleRemove(tech)}
                            className="hover:text-white transition-colors"
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
                    placeholder="Escribir tecnología..."
                    className="flex-1 bg-transparent border-none outline-none text-sm text-slate-200 placeholder:text-slate-600 min-w-[150px] px-2"
                />
            </div>

            {showSuggestions && (
                <div className="p-4 bg-[#0d1117] border border-slate-800 rounded-xl animate-in fade-in slide-in-from-top-2 duration-200 shadow-xl">
                    <div className="flex items-center gap-2 mb-3">
                        <Zap className="w-3 h-3 text-teal-500" />
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Sugerencias frecuentes</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {COMMON_TECH.map(tech => (
                            <button
                                key={tech}
                                type="button"
                                onClick={() => toggleTech(tech)}
                                className={`text-[11px] font-mono px-3 py-1.5 rounded-lg border transition-all flex items-center gap-2 ${
                                    value.includes(tech)
                                        ? 'bg-teal-500 text-slate-950 border-teal-400 font-bold shadow-[0_0_12px_rgba(20,184,166,0.3)]'
                                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-600 hover:text-slate-200'
                                }`}
                            >
                                {value.includes(tech) ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3 opacity-40" />}
                                {tech}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

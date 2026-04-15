'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { X, Plus } from 'lucide-react';

interface ProjectTagInputProps {
    tags: string[];
    onChange: (tags: string[]) => void;
    suggestions?: string[];
    placeholder?: string;
    maxTags?: number;
}

export function ProjectTagInput({
    tags,
    onChange,
    suggestions = [],
    placeholder = "Add tags...",
    maxTags = 10
}: ProjectTagInputProps) {
    const [inputValue, setInputValue] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [focusedIndex, setFocusedIndex] = useState(-1);
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Filter suggestions based on input
    const filteredSuggestions = suggestions
        .filter(s =>
            s.toLowerCase().includes(inputValue.toLowerCase()) &&
            !tags.includes(s)
        )
        .slice(0, 5);

    const addTag = (tag: string) => {
        const trimmedTag = tag.trim().toLowerCase();
        if (trimmedTag && !tags.includes(trimmedTag) && tags.length < maxTags) {
            onChange([...tags, trimmedTag]);
            setInputValue('');
            setShowSuggestions(false);
            setFocusedIndex(-1);
        }
    };

    const removeTag = (tagToRemove: string) => {
        onChange(tags.filter(t => t !== tagToRemove));
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            if (focusedIndex >= 0 && filteredSuggestions[focusedIndex]) {
                addTag(filteredSuggestions[focusedIndex]);
            } else if (inputValue) {
                addTag(inputValue);
            }
        } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
            removeTag(tags[tags.length - 1]);
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            setFocusedIndex(prev =>
                prev < filteredSuggestions.length - 1 ? prev + 1 : prev
            );
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setFocusedIndex(prev => prev > 0 ? prev - 1 : -1);
        } else if (e.key === 'Escape') {
            setShowSuggestions(false);
            setFocusedIndex(-1);
        }
    };

    // Close suggestions when clicking outside
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
        <div ref={containerRef} className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
                Tags
            </label>

            <div
                className="flex flex-wrap items-center gap-2 p-2 bg-white border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-black focus-within:border-transparent min-h-[42px]"
                onClick={() => inputRef.current?.focus()}
            >
                {/* Existing tags */}
                {tags.map((tag) => (
                    <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-800 text-sm rounded-full group hover:bg-gray-200 transition-colors"
                    >
                        <span>{tag}</span>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                removeTag(tag);
                            }}
                            className="text-gray-400 hover:text-gray-600 focus:outline-none"
                        >
                            <X className="h-3 w-3" />
                        </button>
                    </span>
                ))}

                {/* Input field */}
                {tags.length < maxTags && (
                    <input
                        ref={inputRef}
                        type="text"
                        value={inputValue}
                        onChange={(e) => {
                            setInputValue(e.target.value);
                            setShowSuggestions(true);
                            setFocusedIndex(-1);
                        }}
                        onFocus={() => setShowSuggestions(true)}
                        onKeyDown={handleKeyDown}
                        placeholder={tags.length === 0 ? placeholder : ''}
                        className="flex-1 min-w-[120px] bg-transparent border-none outline-none text-sm placeholder-gray-400"
                    />
                )}
            </div>

            {/* Tag count */}
            <div className="mt-1 text-xs text-gray-400 text-right">
                {tags.length}/{maxTags} tags
            </div>

            {/* Suggestions dropdown */}
            {showSuggestions && filteredSuggestions.length > 0 && inputValue && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                    {filteredSuggestions.map((suggestion, index) => (
                        <button
                            key={suggestion}
                            type="button"
                            onClick={() => addTag(suggestion)}
                            className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 ${index === focusedIndex
                                    ? 'bg-gray-100'
                                    : 'hover:bg-gray-50'
                                }`}
                        >
                            <Plus className="h-3 w-3 text-gray-400" />
                            <span>{suggestion}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

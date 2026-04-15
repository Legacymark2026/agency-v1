'use client';

import { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';

interface TagInputProps {
    value: string[];
    onChange: (tags: string[]) => void;
    suggestions?: string[];
    placeholder?: string;
}

export function TagInput({
    value = [],
    onChange,
    suggestions = [],
    placeholder = "Add tags (comma-separated)"
}: TagInputProps) {
    const [inputValue, setInputValue] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const filteredSuggestions = suggestions.filter(
        (suggestion) =>
            suggestion.toLowerCase().includes(inputValue.toLowerCase()) &&
            !value.includes(suggestion)
    );

    const addTag = (tag: string) => {
        const trimmed = tag.trim();
        if (trimmed && !value.includes(trimmed)) {
            onChange([...value, trimmed]);
        }
        setInputValue('');
        setShowSuggestions(false);
    };

    const removeTag = (tagToRemove: string) => {
        onChange(value.filter((tag) => tag !== tagToRemove));
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const inputVal = e.target.value;
        setInputValue(inputVal);

        // Check for comma-separated input
        if (inputVal.includes(',')) {
            const tags = inputVal.split(',').map((t) => t.trim()).filter(Boolean);
            tags.forEach(addTag);
            setInputValue('');
        } else {
            setShowSuggestions(inputVal.length > 0 && filteredSuggestions.length > 0);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && inputValue.trim()) {
            e.preventDefault();
            addTag(inputValue);
        } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
            removeTag(value[value.length - 1]);
        }
    };

    return (
        <div className="space-y-2">
            <div className="relative">
                <div className="min-h-[42px] w-full px-3 py-2 rounded-md border border-gray-300 focus-within:ring-2 focus-within:ring-black flex flex-wrap gap-2 items-center">
                    {value.map((tag) => (
                        <span
                            key={tag}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-black text-white text-sm rounded-md"
                        >
                            {tag}
                            <button
                                type="button"
                                onClick={() => removeTag(tag)}
                                className="hover:bg-gray-700 rounded-full p-0.5 transition"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </span>
                    ))}
                    <input
                        ref={inputRef}
                        type="text"
                        value={inputValue}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        onFocus={() => setShowSuggestions(inputValue.length > 0 && filteredSuggestions.length > 0)}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                        placeholder={value.length === 0 ? placeholder : ''}
                        className="flex-1 min-w-[120px] outline-none bg-transparent"
                    />
                </div>

                {/* Autocomplete Suggestions */}
                {showSuggestions && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                        {filteredSuggestions.map((suggestion) => (
                            <button
                                key={suggestion}
                                type="button"
                                onClick={() => addTag(suggestion)}
                                className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm transition"
                            >
                                {suggestion}
                            </button>
                        ))}
                    </div>
                )}
            </div>
            <p className="text-xs text-gray-500">
                Press Enter or use commas to separate tags
            </p>
        </div>
    );
}

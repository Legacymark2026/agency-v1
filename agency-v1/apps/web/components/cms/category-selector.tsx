'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';

interface Category {
    id: string;
    name: string;
}

interface CategorySelectorProps {
    categories: Category[];
    selectedIds: string[];
    onChange: (selectedIds: string[]) => void;
}

export function CategorySelector({ categories, selectedIds, onChange }: CategorySelectorProps) {
    const [isOpen, setIsOpen] = useState(false);

    const toggleCategory = (categoryId: string) => {
        if (selectedIds.includes(categoryId)) {
            onChange(selectedIds.filter((id) => id !== categoryId));
        } else {
            onChange([...selectedIds, categoryId]);
        }
    };

    const selectedCategories = categories.filter((cat) => selectedIds.includes(cat.id));

    return (
        <div className="space-y-2">
            <div className="relative">
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full px-3 py-2 text-left bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:ring-2 focus:ring-black transition"
                >
                    {selectedCategories.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                            {selectedCategories.map((cat) => (
                                <span
                                    key={cat.id}
                                    className="inline-block px-2 py-0.5 bg-gray-100 text-gray-700 text-sm rounded"
                                >
                                    {cat.name}
                                </span>
                            ))}
                        </div>
                    ) : (
                        <span className="text-gray-500">Select categories...</span>
                    )}
                </button>

                {isOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {categories.length === 0 ? (
                            <div className="px-3 py-2 text-sm text-gray-500">
                                No categories available
                            </div>
                        ) : (
                            categories.map((category) => {
                                const isSelected = selectedIds.includes(category.id);
                                return (
                                    <button
                                        key={category.id}
                                        type="button"
                                        onClick={() => toggleCategory(category.id)}
                                        className="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-100 transition"
                                    >
                                        <span className="text-sm">{category.name}</span>
                                        {isSelected && (
                                            <Check className="h-4 w-4 text-black" />
                                        )}
                                    </button>
                                );
                            })
                        )}
                    </div>
                )}
            </div>

            {/* Click outside to close */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-0"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </div>
    );
}

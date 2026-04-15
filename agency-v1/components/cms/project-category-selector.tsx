'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, Plus, X, Edit2, Trash2, Check } from 'lucide-react';

interface Category {
    id: string;
    name: string;
    slug: string;
    color?: string | null;
}

interface ProjectCategorySelectorProps {
    categories: Category[];
    selectedId?: string | null;
    onSelect: (categoryId: string | null) => void;
    onCreateNew?: (name: string) => Promise<Category | null>;
    onUpdateCategory?: (id: string, name: string) => Promise<Category | null>;
    onDeleteCategory?: (id: string) => Promise<boolean>;
}

export function ProjectCategorySelector({
    categories,
    selectedId,
    onSelect,
    onCreateNew,
    onUpdateCategory,
    onDeleteCategory
}: ProjectCategorySelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');

    const selectedCategory = categories.find(c => c.id === selectedId);

    const handleCreateNew = async () => {
        if (!newCategoryName.trim() || !onCreateNew) return;

        setIsLoading(true);
        const created = await onCreateNew(newCategoryName.trim());
        if (created) {
            onSelect(created.id);
            setNewCategoryName('');
            setIsCreating(false);
        }
        setIsLoading(false);
        setIsOpen(false);
    };

    return (
        <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
            </label>

            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between px-4 py-2.5 bg-white border border-gray-300 rounded-lg hover:border-gray-400 transition-colors text-left"
            >
                <div className="flex items-center gap-2">
                    {selectedCategory?.color && (
                        <span
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: selectedCategory.color }}
                        />
                    )}
                    <span className={selectedCategory ? 'text-gray-900' : 'text-gray-500'}>
                        {selectedCategory?.name || 'Select category...'}
                    </span>
                </div>
                <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => {
                            setIsOpen(false);
                            setIsCreating(false);
                        }}
                    />
                    <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                        {/* Clear selection option */}
                        <button
                            type="button"
                            onClick={() => {
                                onSelect(null);
                                setIsOpen(false);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-gray-500 hover:bg-gray-50"
                        >
                            No category
                        </button>

                        <div className="border-t border-gray-100" />

                        {/* Category list */}
                        {categories.map((category) => (
                            <div key={category.id} className={`flex items-center group hover:bg-gray-50 ${category.id === selectedId ? 'bg-gray-50 font-medium' : ''}`}>
                                {editingId === category.id ? (
                                    <div className="flex w-full items-center py-1 px-4 gap-2">
                                        <input
                                            type="text"
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            className="flex-1 px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            autoFocus
                                            onKeyDown={async (e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    await onUpdateCategory?.(category.id, editName);
                                                    setEditingId(null);
                                                }
                                                if (e.key === 'Escape') setEditingId(null);
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                        <button type="button" onClick={async (e) => { e.stopPropagation(); await onUpdateCategory?.(category.id, editName); setEditingId(null); }} className="text-blue-600 p-1 hover:bg-blue-100 rounded text-xs"><Check className="w-4 h-4" /></button>
                                        <button type="button" onClick={(e) => { e.stopPropagation(); setEditingId(null); }} className="text-gray-400 p-1 hover:bg-gray-200 rounded text-xs"><X className="w-4 h-4" /></button>
                                    </div>
                                ) : (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                onSelect(category.id);
                                                setIsOpen(false);
                                            }}
                                            className="flex-1 px-4 py-2 text-left text-sm flex items-center gap-2"
                                        >
                                            {category.color && (
                                                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: category.color }} />
                                            )}
                                            <span>{category.name}</span>
                                        </button>
                                        <div className="hidden group-hover:flex items-center space-x-1 pr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {onUpdateCategory && (
                                                <button type="button" onClick={(e) => { e.stopPropagation(); setEditingId(category.id); setEditName(category.name); }} className="p-1 text-slate-400 hover:text-blue-500 rounded"><Edit2 className="w-3 h-3" /></button>
                                            )}
                                            {onDeleteCategory && (
                                                <button type="button" onClick={async (e) => { e.stopPropagation(); if (confirm(`¿Estás seguro de eliminar la categoría "${category.name}"?`)) await onDeleteCategory(category.id); }} className="p-1 text-slate-400 hover:text-red-500 rounded"><Trash2 className="w-3 h-3" /></button>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}

                        {categories.length === 0 && !isCreating && (
                            <div className="px-4 py-3 text-sm text-gray-500">
                                No categories yet
                            </div>
                        )}

                        <div className="border-t border-gray-100" />

                        {/* Create new */}
                        {isCreating ? (
                            <div className="p-2">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={newCategoryName}
                                        onChange={(e) => setNewCategoryName(e.target.value)}
                                        placeholder="Category name"
                                        className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
                                        autoFocus
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                handleCreateNew();
                                            }
                                            if (e.key === 'Escape') {
                                                setIsCreating(false);
                                                setNewCategoryName('');
                                            }
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={handleCreateNew}
                                        disabled={isLoading || !newCategoryName.trim()}
                                        className="px-3 py-1.5 bg-black text-white text-sm rounded hover:bg-gray-800 disabled:opacity-50"
                                    >
                                        Add
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsCreating(false);
                                            setNewCategoryName('');
                                        }}
                                        className="p-1.5 text-gray-400 hover:text-gray-600"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        ) : onCreateNew && (
                            <button
                                type="button"
                                onClick={() => setIsCreating(true)}
                                className="w-full px-4 py-2 text-left text-sm text-blue-600 hover:bg-blue-50 flex items-center gap-2"
                            >
                                <Plus className="h-4 w-4" />
                                Create new category
                            </button>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

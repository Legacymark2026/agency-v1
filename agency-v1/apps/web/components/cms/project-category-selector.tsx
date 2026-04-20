'use client';

import { useState } from 'react';
import { ChevronDown, Plus, X, Edit2, Trash2, Check, Tag } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/slide-over';

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

/**
 * Premium HUD-styled category selector.
 */
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
    const [deleteId, setDeleteId] = useState<string | null>(null);

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

    const handleDelete = async () => {
        if (!deleteId || !onDeleteCategory) return;
        const success = await onDeleteCategory(deleteId);
        if (success) setDeleteId(null);
    };

    const deleteCategoryName = categories.find(c => c.id === deleteId)?.name;

    return (
        <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Tag className="w-3 h-3" />
                Categoría
            </label>

            <div className="relative">
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl hover:border-teal-500/50 transition-all text-left group"
                >
                    <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${selectedCategory ? 'bg-teal-500 animate-pulse' : 'bg-slate-700'}`} />
                        <span className={`text-sm ${selectedCategory ? 'text-slate-100 font-bold' : 'text-slate-500'}`}>
                            {selectedCategory?.name || 'Seleccionar categoría...'}
                        </span>
                    </div>
                    <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform duration-300 ${isOpen ? 'rotate-180 text-teal-400' : 'group-hover:text-slate-300'}`} />
                </button>

                {isOpen && (
                    <>
                        <div
                            className="fixed inset-0 z-20"
                            onClick={() => {
                                setIsOpen(false);
                                setIsCreating(false);
                            }}
                        />
                        <div className="absolute z-30 w-full mt-2 bg-[#0d1117] border border-slate-800 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top">
                            {/* Clear selection */}
                            <button
                                type="button"
                                onClick={() => {
                                    onSelect(null);
                                    setIsOpen(false);
                                }}
                                className="w-full px-4 py-2.5 text-left text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-slate-300 hover:bg-slate-900 transition-colors"
                            >
                                Sin categoría
                            </button>

                            <div className="border-t border-slate-800" />

                            {/* List */}
                            <div className="max-h-60 overflow-y-auto custom-scrollbar">
                                {categories.map((category) => (
                                    <div 
                                        key={category.id} 
                                        className={`group flex items-center transition-colors ${category.id === selectedId ? 'bg-teal-500/10' : 'hover:bg-slate-900'}`}
                                    >
                                        {editingId === category.id ? (
                                            <div className="flex w-full items-center p-2 gap-2">
                                                <input
                                                    type="text"
                                                    value={editName}
                                                    onChange={(e) => setEditName(e.target.value)}
                                                    className="flex-1 px-3 py-1.5 text-sm bg-slate-950 border border-teal-500/50 rounded-lg text-slate-100 focus:outline-none"
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
                                                <button type="button" onClick={async (e) => { e.stopPropagation(); await onUpdateCategory?.(category.id, editName); setEditingId(null); }} className="p-1.5 bg-teal-500 text-slate-950 rounded-lg hover:bg-teal-400"><Check className="w-4 h-4" /></button>
                                                <button type="button" onClick={(e) => { e.stopPropagation(); setEditingId(null); }} className="p-1.5 bg-slate-800 text-slate-400 rounded-lg hover:text-white"><X className="w-4 h-4" /></button>
                                            </div>
                                        ) : (
                                            <>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        onSelect(category.id);
                                                        setIsOpen(false);
                                                    }}
                                                    className="flex-1 px-4 py-2.5 text-left text-sm flex items-center gap-3"
                                                >
                                                    <div className={`w-1.5 h-1.5 rounded-full ${category.id === selectedId ? 'bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.6)]' : 'bg-slate-700'}`} />
                                                    <span className={category.id === selectedId ? 'text-teal-400 font-bold' : 'text-slate-300'}>
                                                        {category.name}
                                                    </span>
                                                </button>
                                                <div className="flex items-center gap-1 pr-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {onUpdateCategory && (
                                                        <button 
                                                            type="button" 
                                                            onClick={(e) => { e.stopPropagation(); setEditingId(category.id); setEditName(category.name); }} 
                                                            className="p-1.5 text-slate-500 hover:text-teal-400 hover:bg-slate-800 rounded-lg transition-colors"
                                                        >
                                                            <Edit2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                    {onDeleteCategory && (
                                                        <button 
                                                            type="button" 
                                                            onClick={(e) => { e.stopPropagation(); setDeleteId(category.id); }} 
                                                            className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {categories.length === 0 && !isCreating && (
                                <div className="px-4 py-6 text-center">
                                    <p className="text-xs text-slate-600 uppercase font-bold tracking-widest leading-relaxed">Sin categorías</p>
                                </div>
                            )}

                            <div className="border-t border-slate-800" />

                            {/* Actions */}
                            <div className="p-2">
                                {isCreating ? (
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            value={newCategoryName}
                                            onChange={(e) => setNewCategoryName(e.target.value)}
                                            placeholder="Nombre..."
                                            className="flex-1 px-3 py-1.5 text-sm bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-teal-500/50"
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
                                            className="p-1.5 bg-teal-500 text-slate-950 rounded-lg hover:bg-teal-400 disabled:opacity-50"
                                        >
                                            <Check className="w-4 h-4" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => { setIsCreating(false); setNewCategoryName(''); }}
                                            className="p-1.5 bg-slate-800 text-slate-400 rounded-lg hover:text-white"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : onCreateNew && (
                                    <button
                                        type="button"
                                        onClick={() => setIsCreating(true)}
                                        className="w-full px-3 py-2 text-left text-xs font-bold text-teal-400 hover:text-teal-300 hover:bg-teal-500/5 rounded-lg flex items-center gap-2 transition-all"
                                    >
                                        <Plus className="h-4 w-4" />
                                        CREAR NUEVA CATEGORÍA
                                    </button>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>

            <ConfirmDialog 
                open={deleteId !== null}
                onConfirm={handleDelete}
                onCancel={() => setDeleteId(null)}
                title="Eliminar categoría"
                message={`¿Estás seguro de eliminar la categoría "${deleteCategoryName}"? Los proyectos quedarán sin categoría.`}
                confirmLabel="Eliminar"
                danger
            />
        </div>
    );
}

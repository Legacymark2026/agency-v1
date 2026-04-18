"use client";

import { useState, useEffect } from "react";
import { FolderOpen, Plus, Loader2, Folder, Image as ImageIcon, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
    createCollection,
    getCollections,
    deleteCollection,
    addAssetToCollection,
    removeAssetFromCollection,
} from "@/actions/marketing/creative-collaboration";
import Image from "next/image";

type Collection = Awaited<ReturnType<typeof getCollections>>[number];

export function AssetCollectionsPanel({ currentAssetId }: { currentAssetId?: string }) {
    const [collections, setCollections] = useState<Collection[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [newName, setNewName] = useState("");
    const [showCreate, setShowCreate] = useState(false);

    const loadCollections = () => {
        setIsLoading(true);
        getCollections().then(data => {
            setCollections(data);
            setIsLoading(false);
        });
    };

    useEffect(() => { loadCollections(); }, []);

    const handleCreate = async () => {
        if (!newName.trim()) return;
        setCreating(true);
        const res = await createCollection(newName);
        setCreating(false);
        if (res.success) {
            toast.success(`Colección "${newName}" creada.`);
            setNewName("");
            setShowCreate(false);
            loadCollections();
        } else {
            toast.error(res.error);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        await deleteCollection(id);
        toast.success(`Colección "${name}" eliminada.`);
        loadCollections();
    };

    const handleAddCurrent = async (collectionId: string) => {
        if (!currentAssetId) { toast.error("Selecciona un asset primero."); return; }
        const res = await addAssetToCollection(collectionId, currentAssetId);
        if (res.success) { toast.success("Asset añadido a la colección."); loadCollections(); }
        else toast.error("Error añadiendo asset.");
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <FolderOpen className="text-yellow-400" size={14} />
                    <span className="text-xs font-mono font-bold uppercase tracking-widest text-slate-400">Colecciones</span>
                </div>
                <Button
                    size="sm"
                    onClick={() => setShowCreate(!showCreate)}
                    className="h-7 text-xs font-mono gap-1 bg-slate-800 text-slate-300 hover:text-white"
                >
                    <Plus size={11} /> Nueva
                </Button>
            </div>

            {/* Create Form */}
            {showCreate && (
                <div className="flex gap-2 animate-in fade-in slide-in-from-top-2">
                    <Input
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                        placeholder="Nombre de la colección..."
                        className="flex-1 bg-slate-900 border-slate-700 text-sm h-9"
                        onKeyDown={e => e.key === "Enter" && handleCreate()}
                        autoFocus
                    />
                    <Button
                        size="sm"
                        onClick={handleCreate}
                        disabled={creating || !newName.trim()}
                        className="h-9 bg-yellow-600 hover:bg-yellow-500 text-white font-mono text-xs"
                    >
                        {creating ? <Loader2 size={12} className="animate-spin" /> : "Crear"}
                    </Button>
                </div>
            )}

            {/* Collections List */}
            {isLoading ? (
                <div className="flex items-center justify-center h-24 text-slate-600">
                    <Loader2 size={18} className="animate-spin" />
                </div>
            ) : collections.length === 0 ? (
                <div className="border border-dashed border-slate-800 rounded-xl p-8 text-center">
                    <Folder className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                    <p className="text-xs text-slate-500">Sin colecciones. Crea una para organizar tus assets.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {collections.map(col => (
                        <div key={col.id} className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 hover:border-yellow-500/30 transition-colors group">
                            <div className="flex items-center justify-between mb-3">
                                <div>
                                    <p className="text-sm font-semibold text-slate-100">{col.name}</p>
                                    <p className="text-xs font-mono text-slate-500">{col._count.items} asset{col._count.items !== 1 ? "s" : ""}</p>
                                </div>
                                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {currentAssetId && (
                                        <Button
                                            size="sm"
                                            onClick={() => handleAddCurrent(col.id)}
                                            className="h-7 text-xs font-mono gap-1 bg-yellow-600/20 text-yellow-400 hover:bg-yellow-600/30 border border-yellow-500/20"
                                        >
                                            <Plus size={10} /> Añadir seleccionado
                                        </Button>
                                    )}
                                    <button
                                        onClick={() => handleDelete(col.id, col.name)}
                                        className="text-slate-600 hover:text-red-400 transition p-1"
                                    >
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                            </div>

                            {/* Preview grid */}
                            {col.items.length > 0 && (
                                <div className="grid grid-cols-6 gap-1">
                                    {col.items.map(item => (
                                        <div key={item.id} className="relative aspect-square rounded overflow-hidden bg-slate-800">
                                            {item.asset.url && (
                                                <Image src={item.asset.url} alt={item.asset.name || ""} fill className="object-cover" />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

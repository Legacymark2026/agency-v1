"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { upsertKnowledgeBase, deleteKnowledgeBase } from "@/actions/ai-agents";
import {
    Database, FileText, ArrowLeft, Trash2, Plus, 
    Save, ChevronRight, Library, Search, Edit2
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface Props {
    companyId: string;
    isModal?: boolean;
    initialData: {
        id: string;
        name: string;
        description: string | null;
        content: string;
        _count: { agents: number };
        createdAt: Date;
    }[];
}

export function KnowledgeBaseManager({ companyId, initialData, isModal }: Props) {
    const router = useRouter();
    const [bases, setBases] = useState(initialData);
    const [isCreating, setIsCreating] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Form state
    const [name, setName] = useState("");
    const [content, setContent] = useState("");
    const [description, setDescription] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);

    const handleEdit = (kb: any) => {
        setName(kb.name);
        setDescription(kb.description || "");
        setContent(kb.content || "");
        setEditingId(kb.id);
        setIsCreating(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!name.trim()) {
            return toast.error("El nombre es obligatorio");
        }
        if (!file && !content.trim()) {
            return toast.error("Debes ingresar texto o subir un archivo multimedia.");
        }
        
        setIsSubmitting(true);
        const tid = toast.loading("Procesando conocimiento...");
        
        try {
            if (file) {
                // Subida Multimedia
                const formData = new FormData();
                formData.append("file", file);
                formData.append("name", name);
                formData.append("description", description);
                if (editingId) formData.append("kbId", editingId);
                const res = await fetch("/api/kb/upload", { method: "POST", body: formData });
                const json = await res.json();
                if (!res.ok) throw new Error(json.error || "Error al subir archivo");
                
                toast.success(editingId ? "¡Documento actualizado!" : "¡Documento multimedia integrado exitosamente!", { id: tid });
                if (editingId) {
                    setBases(bases.map(b => b.id === editingId ? { ...b, ...json.kb } : b));
                } else {
                    setBases([{ ...json.kb, _count: { agents: 0 }, createdAt: new Date() }, ...bases]);
                }
            } else {
                // Texto Crudo
                const payload: any = { companyId, name, description, content };
                if (editingId) payload.id = editingId;
                const res = await upsertKnowledgeBase(payload);
                if (res.success && res.kb) {
                    toast.success(editingId ? "¡Documento actualizado!" : "¡Documento integrado exitosamente!", { id: tid });
                    if (editingId) {
                        setBases(bases.map(b => b.id === editingId ? { ...b, ...res.kb } : b));
                    } else {
                        setBases([{ ...res.kb, _count: { agents: 0 }, createdAt: new Date() }, ...bases]);
                    }
                }
            }
            
            // Reset form
            setIsCreating(false);
            setEditingId(null);
            setName("");
            setContent("");
            setDescription("");
            setFile(null);
            router.refresh();
            
        } catch (err: any) {
            toast.error(err.message || "Error al guardar documento", { id: tid });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`¿Estás súper seguro de eliminar "${name}"? Los agentes que la usen perderán este conocimiento.`)) return;
        
        const tid = toast.loading("Borrando registros...");
        try {
            await deleteKnowledgeBase(id);
            setBases(bases.filter(b => b.id !== id));
            toast.success("Documento purgado del cerebro", { id: tid });
            router.refresh();
        } catch (err: any) {
            toast.error("Error al eliminar", { id: tid });
        }
    };

    return (
        <div className="space-y-6 pb-12">
            {/* Header */}
            {!isModal && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
                    <div>
                        <Link href="/dashboard/settings/agents/new" className="flex items-center text-sm text-slate-400 hover:text-white mb-4 transition-colors w-fit">
                            <ArrowLeft className="w-4 h-4 mr-1" />
                            Volver a Nuevo Agente
                        </Link>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                            <Database className="w-6 h-6 text-blue-400" />
                            Knowledge Base (RAG)
                        </h2>
                        <p className="text-sm text-slate-400 mt-1">Sube documentos crudos para que tus Agentes de IA puedan pensar y responder con contexto real de tu empresa.</p>
                    </div>
                    {!isCreating && (
                        <button
                            onClick={() => {
                                setEditingId(null);
                                setName("");
                                setContent("");
                                setDescription("");
                                setFile(null);
                                setIsCreating(true);
                            }}
                            className="inline-flex items-center gap-2 rounded-md bg-blue-500 text-slate-950 hover:bg-blue-400 h-10 px-6 py-2 text-sm font-bold transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)]"
                        >
                            <Plus className="w-4 h-4" />
                            Nuevo Documento
                        </button>
                    )}
                </div>
            )}
            
            {isModal && !isCreating && (
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Database className="w-5 h-5 text-blue-400" />
                        Archivos RAG
                    </h2>
                    <button
                        onClick={() => {
                            setEditingId(null);
                            setName("");
                            setContent("");
                            setDescription("");
                            setFile(null);
                            setIsCreating(true);
                        }}
                        className="inline-flex items-center gap-2 rounded-md bg-blue-500 text-slate-950 hover:bg-blue-400 h-9 px-4 text-sm font-bold transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)]"
                    >
                        <Plus className="w-4 h-4" />
                        Nuevo Documento
                    </button>
                </div>
            )}

            {isCreating ? (
                <form onSubmit={handleSave} className="animate-in fade-in slide-in-from-bottom-4 duration-500 rounded-2xl border border-slate-800 bg-slate-900/50 p-6 shadow-xl">
                    <div className="flex items-center justify-between mb-6 border-b border-slate-800/50 pb-4">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <FileText className="w-5 h-5 text-blue-400" />
                            {editingId ? "Actualizar Conocimiento" : "Ingresar Conocimiento"}
                        </h3>
                        <div className="flex items-center gap-4">
                            <button type="button" onClick={() => {
                                setIsCreating(false);
                                setEditingId(null);
                                setName("");
                                setContent("");
                                setDescription("");
                                setFile(null);
                            }} className="text-sm text-slate-400 hover:text-white">Cancelar</button>
                        </div>
                    </div>
                    
                    <div className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-bold text-slate-300 mb-1.5">Nombre del Documento</label>
                                <input 
                                    value={name} onChange={e => setName(e.target.value)}
                                    placeholder="Ej. Catálogo de Precios Q2 2026"
                                    className="w-full h-11 rounded-xl border border-slate-700 bg-[#0f111a] px-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500" 
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-300 mb-1.5">Descripción (Opcional)</label>
                                <input 
                                    value={description} onChange={e => setDescription(e.target.value)}
                                    placeholder="Breve contexto de qué trata este texto..."
                                    className="w-full h-11 rounded-xl border border-slate-700 bg-[#0f111a] px-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500" 
                                />
                            </div>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                                Modo de Ingreso
                            </label>
                            
                            <div className="grid grid-cols-2 gap-4 mb-4 select-none">
                                <label className={`flex flex-col border ${!file ? 'border-blue-500 bg-blue-500/10' : 'border-slate-700 bg-slate-800/50'} rounded-xl p-4 cursor-pointer transition-colors relative`}>
                                    <input type="radio" className="hidden" checked={!file} onChange={() => setFile(null)} />
                                    <div className="font-bold text-white mb-1">Texto Crudo</div>
                                    <p className="text-xs text-slate-400">Pega manuales, FAQs o artículos directamente aquí.</p>
                                </label>
                                <label className={`flex flex-col border ${file ? 'border-pink-500 bg-pink-500/10' : 'border-slate-700 bg-slate-800/50'} rounded-xl p-4 cursor-pointer transition-colors relative`}>
                                    <input type="radio" className="hidden" checked={!!file} onChange={() => {
                                        const el = document.getElementById("file-upload");
                                        if (el) el.click();
                                    }} />
                                    <div className="font-bold text-white mb-1">Archivo Multimedia</div>
                                    <p className="text-xs text-slate-400">PDF, Audios MP3/WAV, o videos para análisis RAG avanzado.</p>
                                </label>
                            </div>

                            {/* If no new file is selected, but the existing content is a Multimedia URI, show a distinct card */}
                            {!file && content.startsWith("[Contenido Multimedia Adjunto.") ? (
                                <div className="w-full min-h-[300px] rounded-xl border-2 border-slate-700 bg-slate-900/30 p-6 flex flex-col items-center justify-center text-center">
                                    <div className="p-4 bg-teal-500/10 rounded-full text-teal-400 mb-4">
                                        <FileText className="w-8 h-8" />
                                    </div>
                                    <h4 className="text-white font-bold mb-2">Archivo Multimedia Activo en la IA</h4>
                                    <p className="text-xs text-slate-500 max-w-sm mb-6">
                                        Este archivo ya se encuentra en el "Cerebro" de Gemini. Por seguridad y privacidad, el archivo crudo original no puede descargarse, pero puedes actualizar su nombre, descripción o reemplazarlo subiendo uno nuevo.
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const el = document.getElementById("file-upload");
                                            if (el) el.click();
                                        }}
                                        className="text-sm font-bold text-blue-400 hover:text-blue-300 bg-blue-500/10 px-4 py-2 rounded-lg transition-colors border border-blue-500/20"
                                    >
                                        Reemplazar Archivo...
                                    </button>
                                </div>
                            ) : !file ? (
                                <textarea
                                    value={content}
                                    onChange={e => setContent(e.target.value)}
                                    placeholder="Pega aquí todo el texto crudo que el agente debe leer y comprender..."
                                    className="w-full min-h-[300px] rounded-xl border border-slate-700 bg-[#0f111a] p-4 text-sm text-blue-50 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-mono resize-y transition-all"
                                    maxLength={50000}
                                />
                            ) : (
                                <div className="w-full min-h-[300px] rounded-xl border-2 border-dashed border-blue-500/50 bg-blue-900/10 p-6 flex flex-col items-center justify-center text-center transition-colors">
                                    <div className="p-4 bg-blue-500/20 rounded-full text-blue-400 mb-4">
                                        <Database className="w-8 h-8" />
                                    </div>
                                    <h4 className="text-white font-bold mb-2">Nuevo Archivo a Subir:</h4>
                                    <p className="text-sm text-slate-300 font-mono bg-slate-900 px-4 py-2 rounded-lg mb-2 truncate max-w-full border border-slate-800">
                                        {file.name}
                                    </p>
                                    <p className="text-xs text-slate-500 mb-6 font-medium">
                                        {(file.size / 1024 / 1024).toFixed(2)} MB • {file.type || "Archivo binario"}
                                    </p>
                                    <div className="flex gap-3">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const el = document.getElementById("file-upload");
                                                if (el) el.click();
                                            }}
                                            className="text-sm font-bold text-blue-400 hover:text-blue-300 bg-blue-500/10 px-4 py-2 rounded-lg transition-colors border border-blue-500/20"
                                        >
                                            Cambiar archivo
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Hidden File Input */}
                            <input 
                                id="file-upload" 
                                type="file" 
                                className="hidden"
                                accept="application/pdf,audio/*,video/*"
                                onChange={e => {
                                    if (e.target.files && e.target.files.length > 0) {
                                        setFile(e.target.files[0]);
                                        setContent(""); // Clear text if switching to file
                                    }
                                }}
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-4 mt-6 pt-6 border-t border-slate-800/50">
                        <button
                            type="button"
                            onClick={() => setIsCreating(false)}
                            className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="inline-flex items-center gap-2 ml-auto rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white disabled:opacity-50 px-8 py-2.5 text-sm font-bold transition-all shadow-lg hover:shadow-blue-500/25"
                        >
                            <Save className="w-4 h-4" />
                            {isSubmitting ? "Memorizando..." : "Memorizar Documento"}
                        </button>
                    </div>
                </form>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {bases.map(kb => (
                        <div key={kb.id} className="group relative flex flex-col rounded-2xl border border-slate-800 bg-slate-900/40 p-5 hover:bg-slate-800/60 hover:border-slate-700 transition-all">
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                    <Library className="w-5 h-5" />
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => handleEdit(kb)}
                                        className="p-2 text-slate-500 hover:text-blue-400 transition-colors"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(kb.id, kb.name)}
                                        className="p-2 text-slate-500 hover:text-red-400 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            
                            <h3 className="text-lg font-bold text-white mb-1">{kb.name}</h3>
                            <p className="text-xs text-slate-400 line-clamp-2 min-h-[32px] mb-4">
                                {kb.description || "Sin descripción proporcionada."}
                            </p>
                            
                            <div className="mt-auto pt-4 border-t border-slate-800/50 flex items-center justify-between text-xs font-medium text-slate-500">
                                <span className="flex items-center gap-1.5 bg-slate-800 px-2.5 py-1 rounded-md">
                                    <FileText className="w-3.5 h-3.5" />
                                    {(kb.content?.length || 0).toLocaleString()} chars
                                </span>
                                <span className="text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-md">
                                    {kb._count?.agents || 0} Agentes usando esto
                                </span>
                            </div>
                        </div>
                    ))}

                    {bases.length === 0 && (
                        <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-800 rounded-3xl bg-slate-900/20">
                            <Database className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                            <h3 className="text-lg font-bold text-white mb-2">Base de Conocimiento Vacía</h3>
                            <p className="text-sm text-slate-400 max-w-sm mx-auto mb-6">
                                Los Agentes de IA son mucho más inteligentes cuando les provees reglas claras, FAQs o catálogos en texto.
                            </p>
                            <button
                                onClick={() => setIsCreating(true)}
                                className="inline-flex items-center gap-2 rounded-lg bg-slate-800 text-white hover:bg-slate-700 hover:text-blue-400 px-6 py-2.5 text-sm font-bold transition-all"
                            >
                                <Plus className="w-4 h-4" />
                                Añadir primer documento
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

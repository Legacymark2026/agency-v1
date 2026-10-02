"use client";

import { useState } from "react";
import {
    Sliders, Plus, Edit2, Trash2, CheckCircle2, XCircle, Search,
    Save, X, Shield, Cpu, RefreshCw, Key, Database, AlertTriangle,
    Layers, ToggleLeft, ToggleRight, Sparkles
} from "lucide-react";

interface SystemParameter {
    id: string;
    key: string;
    name: string;
    category: "SYSTEM" | "SECURITY" | "AI" | "BILLING" | "INTEGRATIONS";
    value: string;
    type: "STRING" | "NUMBER" | "BOOLEAN" | "JSON";
    description: string;
    isActive: boolean;
    updatedAt: string;
}

const INITIAL_PARAMETERS: SystemParameter[] = [
    {
        id: "param-1",
        key: "SYSTEM_MAINTENANCE_MODE",
        name: "Modo Mantenimiento Global",
        category: "SYSTEM",
        value: "false",
        type: "BOOLEAN",
        description: "Habilita la pantalla de mantenimiento para todos los usuarios excepto SuperAdmin.",
        isActive: true,
        updatedAt: new Date().toISOString(),
    },
    {
        id: "param-2",
        key: "DEFAULT_CURRENCY_CODE",
        name: "Moneda Predeterminada del Sistema",
        category: "BILLING",
        value: "USD",
        type: "STRING",
        description: "Moneda de facturación y presupuestos predeterminada.",
        isActive: true,
        updatedAt: new Date().toISOString(),
    },
    {
        id: "param-3",
        key: "MAX_API_RATE_LIMIT_PER_MINUTE",
        name: "Límite de Peticiones API (Rate Limit)",
        category: "SECURITY",
        value: "1000",
        type: "NUMBER",
        description: "Número máximo de peticiones por minuto permitidas por cliente.",
        isActive: true,
        updatedAt: new Date().toISOString(),
    },
    {
        id: "param-4",
        key: "AI_DEFAULT_LLM_MODEL",
        name: "Modelo de IA Predeterminado",
        category: "AI",
        value: "gemini-2.5-flash",
        type: "STRING",
        description: "Motor cognitivo asignado a los agentes conversacionales de la empresa.",
        isActive: true,
        updatedAt: new Date().toISOString(),
    },
    {
        id: "param-5",
        key: "SESSION_TIMEOUT_MINUTES",
        name: "Tiempo de Inactividad de Sesión (Minutos)",
        category: "SECURITY",
        value: "120",
        type: "NUMBER",
        description: "Tiempo máximo de inactividad antes de cerrar la sesión automáticamente.",
        isActive: true,
        updatedAt: new Date().toISOString(),
    },
];

export default function SystemParametersPage() {
    const [parameters, setParameters] = useState<SystemParameter[]>(INITIAL_PARAMETERS);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
    const [editingParam, setEditingParam] = useState<SystemParameter | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Form state for creation
    const [newKey, setNewKey] = useState("");
    const [newName, setNewName] = useState("");
    const [newCategory, setNewCategory] = useState<any>("SYSTEM");
    const [newValue, setNewValue] = useState("");
    const [newType, setNewType] = useState<any>("STRING");
    const [newDesc, setNewDesc] = useState("");

    const filteredParameters = parameters.filter((param) => {
        const matchesSearch =
            param.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
            param.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            param.description.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesCategory = selectedCategory === "ALL" || param.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newKey || !newName || !newValue) return;

        const newParam: SystemParameter = {
            id: `param-${Date.now()}`,
            key: newKey.toUpperCase().replace(/\s+/g, "_"),
            name: newName,
            category: newCategory,
            value: newValue,
            type: newType,
            description: newDesc,
            isActive: true,
            updatedAt: new Date().toISOString(),
        };

        setParameters([newParam, ...parameters]);
        setShowCreateModal(false);
        setNewKey("");
        setNewName("");
        setNewValue("");
        setNewDesc("");
    };

    const handleToggleActive = (id: string) => {
        setParameters((prev) =>
            prev.map((p) => (p.id === id ? { ...p, isActive: !p.isActive, updatedAt: new Date().toISOString() } : p))
        );
    };

    const handleDelete = (id: string, key: string) => {
        if (!confirm(`¿Estás seguro de eliminar el parámetro "${key}"?`)) return;
        setParameters((prev) => prev.filter((p) => p.id !== id));
    };

    const handleSaveEdit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingParam) return;

        setParameters((prev) =>
            prev.map((p) => (p.id === editingParam.id ? { ...editingParam, updatedAt: new Date().toISOString() } : p))
        );
        setEditingParam(null);
    };

    return (
        <div className="space-y-8 pb-12 max-w-6xl mx-auto px-4 sm:px-6 py-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--ds-border)] pb-6">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono mb-2">
                        <Cpu className="w-3.5 h-3.5" />
                        <span>SISTEMA DE CONFIGURACIÓN DINÁMICA CRUD</span>
                    </div>
                    <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
                        <Sliders className="w-8 h-8 text-cyan-400" />
                        Parámetros Globales del Sistema
                    </h1>
                    <p className="text-[var(--ds-text-secondary)] text-sm mt-1">
                        Motor CRUD para crear, modificar, activar o eliminar variables de entorno y reglas del sistema en tiempo real.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs transition-all cursor-pointer shadow-lg shadow-cyan-500/20"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Nuevo Parámetro</span>
                    </button>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[var(--ds-surface)] border border-[var(--ds-border)] rounded-2xl p-4">
                <div className="relative w-full sm:w-80">
                    <Search className="w-4 h-4 text-[var(--ds-text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Buscar parámetro por llave, nombre..."
                        className="w-full pl-10 pr-4 py-2 rounded-xl bg-[var(--ds-bg-deep)] border border-[var(--ds-border)] focus:border-cyan-500 text-xs text-white placeholder:text-[var(--ds-text-muted)] focus:outline-none"
                    />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
                    {["ALL", "SYSTEM", "SECURITY", "AI", "BILLING"].map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                                selectedCategory === cat
                                    ? "bg-cyan-500/20 border border-cyan-500 text-cyan-400"
                                    : "bg-[var(--ds-surface-2)] text-[var(--ds-text-secondary)] hover:text-white"
                            }`}
                        >
                            {cat === "ALL" ? "Todas las Categorías" : cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Parameters Table */}
            <div className="bg-[var(--ds-surface)] border border-[var(--ds-border)] rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-[var(--ds-text-secondary)]">
                        <thead className="bg-[var(--ds-surface-2)] text-[var(--ds-text-muted)] font-mono uppercase text-[10px] tracking-wider border-b border-[var(--ds-border)]">
                            <tr>
                                <th className="py-3.5 px-4">Parámetro / Llave</th>
                                <th className="py-3.5 px-4">Categoría & Tipo</th>
                                <th className="py-3.5 px-4">Valor Configurado</th>
                                <th className="py-3.5 px-4">Estado</th>
                                <th className="py-3.5 px-4 text-right">Acciones (CRUD)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--ds-border)]/60">
                            {filteredParameters.map((param) => (
                                <tr key={param.id} className="hover:bg-[var(--ds-surface-2)]/40 transition-all">
                                    <td className="py-4 px-4">
                                        <div className="font-mono font-bold text-cyan-400">{param.key}</div>
                                        <div className="text-xs text-white font-medium mt-0.5">{param.name}</div>
                                        <div className="text-[10px] text-[var(--ds-text-muted)] truncate max-w-xs">{param.description}</div>
                                    </td>
                                    <td className="py-4 px-4 whitespace-nowrap">
                                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--ds-bg-deep)] border border-[var(--ds-border)] text-cyan-300 font-semibold block w-max mb-1">
                                            {param.category}
                                        </span>
                                        <span className="text-[9px] font-mono text-[var(--ds-text-muted)]">{param.type}</span>
                                    </td>
                                    <td className="py-4 px-4">
                                        <code className="text-xs font-mono px-2.5 py-1 rounded bg-[var(--ds-bg-deep)] border border-[var(--ds-border)] text-white font-bold inline-block">
                                            {param.value}
                                        </code>
                                    </td>
                                    <td className="py-4 px-4 whitespace-nowrap">
                                        <button
                                            onClick={() => handleToggleActive(param.id)}
                                            className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold"
                                        >
                                            {param.isActive ? (
                                                <span className="text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Activo</span>
                                            ) : (
                                                <span className="text-red-400 flex items-center gap-1"><XCircle className="w-4 h-4" /> Inactivo</span>
                                            )}
                                        </button>
                                    </td>
                                    <td className="py-4 px-4 text-right whitespace-nowrap">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => setEditingParam(param)}
                                                className="p-1.5 rounded-lg bg-[var(--ds-surface-2)] text-[var(--ds-text-secondary)] hover:text-cyan-400 hover:bg-cyan-500/10 transition-all cursor-pointer"
                                                title="Editar Parámetro"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(param.id, param.key)}
                                                className="p-1.5 rounded-lg bg-[var(--ds-surface-2)] text-[var(--ds-text-secondary)] hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
                                                title="Eliminar Parámetro"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal de Creación */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                    <div className="bg-[var(--ds-surface)] border border-[var(--ds-border)] rounded-2xl p-6 w-full max-w-md space-y-5 shadow-2xl">
                        <div className="flex items-center justify-between border-b border-[var(--ds-border)] pb-3">
                            <h3 className="text-base font-bold text-white flex items-center gap-2">
                                <Plus className="w-4 h-4 text-cyan-400" /> Nuevo Parámetro del Sistema
                            </h3>
                            <button onClick={() => setShowCreateModal(false)} className="text-[var(--ds-text-muted)] hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-white mb-1">Llave Única (KEY) *</label>
                                <input
                                    type="text"
                                    required
                                    value={newKey}
                                    onChange={(e) => setNewKey(e.target.value)}
                                    placeholder="EJ: ENABLE_AI_AUTO_REPLY"
                                    className="w-full px-3 py-2 rounded-xl bg-[var(--ds-bg-deep)] border border-[var(--ds-border)] text-xs text-white font-mono focus:border-cyan-500 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-white mb-1">Nombre Descriptivo *</label>
                                <input
                                    type="text"
                                    required
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    placeholder="Habilitar Respuestas Automáticas de IA"
                                    className="w-full px-3 py-2 rounded-xl bg-[var(--ds-bg-deep)] border border-[var(--ds-border)] text-xs text-white focus:border-cyan-500 focus:outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-white mb-1">Categoría</label>
                                    <select
                                        value={newCategory}
                                        onChange={(e) => setNewCategory(e.target.value as any)}
                                        className="w-full px-3 py-2 rounded-xl bg-[var(--ds-bg-deep)] border border-[var(--ds-border)] text-xs text-white focus:outline-none"
                                    >
                                        <option value="SYSTEM">SYSTEM</option>
                                        <option value="SECURITY">SECURITY</option>
                                        <option value="AI">AI</option>
                                        <option value="BILLING">BILLING</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-white mb-1">Tipo de Dato</label>
                                    <select
                                        value={newType}
                                        onChange={(e) => setNewType(e.target.value as any)}
                                        className="w-full px-3 py-2 rounded-xl bg-[var(--ds-bg-deep)] border border-[var(--ds-border)] text-xs text-white focus:outline-none"
                                    >
                                        <option value="STRING">STRING</option>
                                        <option value="NUMBER">NUMBER</option>
                                        <option value="BOOLEAN">BOOLEAN</option>
                                        <option value="JSON">JSON</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-white mb-1">Valor Asignado *</label>
                                <input
                                    type="text"
                                    required
                                    value={newValue}
                                    onChange={(e) => setNewValue(e.target.value)}
                                    placeholder="true / 100 / 'valor'"
                                    className="w-full px-3 py-2 rounded-xl bg-[var(--ds-bg-deep)] border border-[var(--ds-border)] text-xs text-white font-mono focus:border-cyan-500 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-white mb-1">Descripción / Propósito</label>
                                <textarea
                                    rows={2}
                                    value={newDesc}
                                    onChange={(e) => setNewDesc(e.target.value)}
                                    placeholder="Explica para qué sirve este parámetro..."
                                    className="w-full px-3 py-2 rounded-xl bg-[var(--ds-bg-deep)] border border-[var(--ds-border)] text-xs text-white focus:outline-none resize-none"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="px-4 py-2 rounded-xl bg-[var(--ds-surface-2)] text-xs text-[var(--ds-text-secondary)] hover:text-white"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs shadow-md"
                                >
                                    Guardar Parámetro
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal de Edición */}
            {editingParam && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                    <div className="bg-[var(--ds-surface)] border border-[var(--ds-border)] rounded-2xl p-6 w-full max-w-md space-y-5 shadow-2xl">
                        <div className="flex items-center justify-between border-b border-[var(--ds-border)] pb-3">
                            <h3 className="text-base font-bold text-white flex items-center gap-2">
                                <Edit2 className="w-4 h-4 text-cyan-400" /> Editar Parámetro ({editingParam.key})
                            </h3>
                            <button onClick={() => setEditingParam(null)} className="text-[var(--ds-text-muted)] hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveEdit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-white mb-1">Nombre Descriptivo</label>
                                <input
                                    type="text"
                                    value={editingParam.name}
                                    onChange={(e) => setEditingParam({ ...editingParam, name: e.target.value })}
                                    className="w-full px-3 py-2 rounded-xl bg-[var(--ds-bg-deep)] border border-[var(--ds-border)] text-xs text-white focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-white mb-1">Valor Configurado</label>
                                <input
                                    type="text"
                                    value={editingParam.value}
                                    onChange={(e) => setEditingParam({ ...editingParam, value: e.target.value })}
                                    className="w-full px-3 py-2 rounded-xl bg-[var(--ds-bg-deep)] border border-[var(--ds-border)] text-xs text-white font-mono focus:border-cyan-500 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-white mb-1">Descripción</label>
                                <textarea
                                    rows={2}
                                    value={editingParam.description}
                                    onChange={(e) => setEditingParam({ ...editingParam, description: e.target.value })}
                                    className="w-full px-3 py-2 rounded-xl bg-[var(--ds-bg-deep)] border border-[var(--ds-border)] text-xs text-white focus:outline-none resize-none"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setEditingParam(null)}
                                    className="px-4 py-2 rounded-xl bg-[var(--ds-surface-2)] text-xs text-[var(--ds-text-secondary)] hover:text-white"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs shadow-md"
                                >
                                    Actualizar Parámetro
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

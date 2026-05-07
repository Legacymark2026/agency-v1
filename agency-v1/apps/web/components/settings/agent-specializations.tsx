"use client";

import { useState, useEffect } from "react";
import { 
    getSpecializations, createSpecialization, updateSpecialization, deleteSpecialization,
    getSkills
} from "@/actions/agent-config";
import { toast } from "sonner";
import { 
    Plus, Trash2, Edit2, ChevronDown, ChevronUp, Brain, 
    Target, Headphones, Megaphone, Settings, Users, DollarSign, Scale, 
    Sparkles, Check, X, Lock, Unlock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

const ICONS: Record<string, any> = {
    target: Target,
    headset: Headphones,
    megaphone: Megaphone,
    settings: Settings,
    users: Users,
    dollar: DollarSign,
    scale: Scale,
    brain: Brain
};

const COLORS = [
    "#0d9488", "#6366f1", "#f59e0b", "#8b5cf6", 
    "#ec4899", "#10b981", "#64748b", "#ef4444"
];

interface Specialization {
    id: string;
    name: string;
    description: string | null;
    category: string;
    icon: string | null;
    color: string;
    isSystem: boolean;
    isActive: boolean;
    order: number;
    _count?: { skills: number };
}

interface Props {
    companyId: string;
    selectedSpecializations: string[];
    onSpecializationsChange: (ids: string[]) => void;
    readonly?: boolean;
}

export function AgentSpecializations({ 
    companyId, 
    selectedSpecializations, 
    onSpecializationsChange,
    readonly = false 
}: Props) {
    const [specializations, setSpecializations] = useState<Specialization[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    
    const [newSpec, setNewSpec] = useState({ name: "", description: "", category: "CUSTOM", icon: "brain", color: "#0d9488" });

    useEffect(() => {
        loadSpecializations();
    }, [companyId]);

    async function loadSpecializations() {
        try {
            const data = await getSpecializations(companyId);
            // Add skill count
            const specsWithCount = await Promise.all(
                data.map(async (spec: any) => ({
                    ...spec,
                    _count: { skills: spec._count?.skills ?? 0 }
                }))
            );
            setSpecializations(specsWithCount);
        } catch (error) {
            console.error("Error loading specializations:", error);
            toast.error("Error al cargar especializaciones");
        } finally {
            setLoading(false);
        }
    }

    async function handleCreate() {
        if (!newSpec.name.trim()) {
            toast.error("El nombre es requerido");
            return;
        }

        try {
            await createSpecialization({ ...newSpec, companyId });
            toast.success("Especialización creada");
            setIsCreateOpen(false);
            setNewSpec({ name: "", description: "", category: "CUSTOM", icon: "brain", color: "#0d9488" });
            loadSpecializations();
        } catch (error: any) {
            toast.error(error.message || "Error al crear");
        }
    }

    async function handleUpdate(id: string) {
        try {
            await updateSpecialization(id, newSpec);
            toast.success("Especialización actualizada");
            setEditingId(null);
            setNewSpec({ name: "", description: "", category: "CUSTOM", icon: "brain", color: "#0d9488" });
            loadSpecializations();
        } catch (error: any) {
            toast.error(error.message || "Error al actualizar");
        }
    }

    async function handleDelete(id: string) {
        if (!confirm("¿Estás seguro de eliminar esta especialización?")) return;
        
        try {
            await deleteSpecialization(id);
            toast.success("Especialización eliminada");
            loadSpecializations();
        } catch (error: any) {
            toast.error(error.message || "Error al eliminar");
        }
    }

    function toggleSelection(id: string) {
        if (readonly) return;
        
        const newSelection = selectedSpecializations.includes(id)
            ? selectedSpecializations.filter(s => s !== id)
            : [...selectedSpecializations, id];
        onSpecializationsChange(newSelection);
    }

    function startEdit(spec: Specialization) {
        setEditingId(spec.id);
        setNewSpec({
            name: spec.name,
            description: spec.description || "",
            category: spec.category,
            icon: spec.icon || "brain",
            color: spec.color
        });
    }

    function getCategoryIcon(category: string) {
        const icons: Record<string, string> = {
            SALES: "target",
            SUPPORT: "headset",
            MARKETING: "megaphone",
            OPERATIONS: "settings",
            CRM: "users",
            FINANCE: "dollar",
            LEGAL: "scale",
            GENERAL: "brain"
        };
        return icons[category] || "brain";
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-white">Especializaciones</h3>
                    <p className="text-sm text-slate-400">Selecciona las áreas de expertise del agente</p>
                </div>
                {!readonly && (
                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm" className="bg-teal-600 hover:bg-teal-700">
                                <Plus className="w-4 h-4 mr-2" />
                                Nueva
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-slate-900 border-slate-800">
                            <DialogHeader>
                                <DialogTitle className="text-white">Nueva Especialización</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 pt-4">
                                <div>
                                    <label className="text-sm text-slate-400">Nombre</label>
                                    <Input
                                        value={newSpec.name}
                                        onChange={(e) => setNewSpec(s => ({ ...s, name: e.target.value }))}
                                        placeholder="Ej: Ventas B2B"
                                        className="bg-slate-800 border-slate-700 text-white"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm text-slate-400">Descripción</label>
                                    <Textarea
                                        value={newSpec.description}
                                        onChange={(e) => setNewSpec(s => ({ ...s, description: e.target.value }))}
                                        placeholder="Describe el enfoque de esta especialización..."
                                        className="bg-slate-800 border-slate-700 text-white"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm text-slate-400">Categoría</label>
                                    <select
                                        value={newSpec.category}
                                        onChange={(e) => setNewSpec(s => ({ ...s, category: e.target.value }))}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-white"
                                    >
                                        <option value="SALES">Ventas</option>
                                        <option value="SUPPORT">Soporte</option>
                                        <option value="MARKETING">Marketing</option>
                                        <option value="OPERATIONS">Operaciones</option>
                                        <option value="CRM">CRM</option>
                                        <option value="FINANCE">Finanzas</option>
                                        <option value="LEGAL">Legal</option>
                                        <option value="CUSTOM">Personalizado</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm text-slate-400">Icono</label>
                                    <div className="flex gap-2 flex-wrap">
                                        {Object.entries(ICONS).map(([key, Icon]) => (
                                            <button
                                                key={key}
                                                type="button"
                                                onClick={() => setNewSpec(s => ({ ...s, icon: key }))}
                                                className={`p-2 rounded-lg border ${
                                                    newSpec.icon === key 
                                                        ? "border-teal-500 bg-teal-500/20" 
                                                        : "border-slate-700 hover:border-slate-600"
                                                }`}
                                            >
                                                <Icon className="w-5 h-5 text-slate-300" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm text-slate-400">Color</label>
                                    <div className="flex gap-2 flex-wrap">
                                        {COLORS.map((color) => (
                                            <button
                                                key={color}
                                                type="button"
                                                onClick={() => setNewSpec(s => ({ ...s, color }))}
                                                className={`w-8 h-8 rounded-full ${
                                                    newSpec.color === color ? "ring-2 ring-white" : ""
                                                }`}
                                                style={{ backgroundColor: color }}
                                            />
                                        ))}
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2 pt-4">
                                    <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                                        Cancelar
                                    </Button>
                                    <Button onClick={handleCreate} className="bg-teal-600 hover:bg-teal-700">
                                        Crear
                                    </Button>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            <div className="grid gap-3">
                {specializations.map((spec) => {
                    const IconComponent = ICONS[spec.icon || getCategoryIcon(spec.category)] || Brain;
                    const isSelected = selectedSpecializations.includes(spec.id);
                    const isExpanded = expandedId === spec.id;

                    return (
                        <div
                            key={spec.id}
                            className={`rounded-xl border transition-all ${
                                isSelected 
                                    ? "border-teal-500 bg-teal-500/10" 
                                    : "border-slate-800 bg-slate-900/50"
                            }`}
                        >
                            <div className="flex items-center gap-3 p-4">
                                <button
                                    type="button"
                                    onClick={() => !readonly && toggleSelection(spec.id)}
                                    disabled={readonly}
                                    className={`w-5 h-5 rounded border flex items-center justify-center ${
                                        isSelected 
                                            ? "bg-teal-500 border-teal-500" 
                                            : "border-slate-600"
                                    }`}
                                >
                                    {isSelected && <Check className="w-3 h-3 text-white" />}
                                </button>
                                
                                <div 
                                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                                    style={{ backgroundColor: spec.color + "20" }}
                                >
                                    <IconComponent className="w-5 h-5" style={{ color: spec.color }} />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-white">{spec.name}</span>
                                        {spec.isSystem && (
                                            <Badge variant="outline" className="text-xs border-slate-700 text-slate-400">
                                                <Lock className="w-3 h-3 mr-1" />
                                                Sistema
                                            </Badge>
                                        )}
                                    </div>
                                    {spec.description && (
                                        <p className="text-sm text-slate-400 truncate">{spec.description}</p>
                                    )}
                                </div>

                                <div className="flex items-center gap-2">
                                    <Badge variant="secondary" className="bg-slate-800 text-slate-300">
                                        {spec._count?.skills || 0} habilidades
                                    </Badge>
                                    
                                    <button
                                        type="button"
                                        onClick={() => setExpandedId(isExpanded ? null : spec.id)}
                                        className="p-1 hover:bg-slate-800 rounded"
                                    >
                                        {isExpanded ? (
                                            <ChevronUp className="w-4 h-4 text-slate-400" />
                                        ) : (
                                            <ChevronDown className="w-4 h-4 text-slate-400" />
                                        )}
                                    </button>

                                    {!readonly && !spec.isSystem && (
                                        <div className="flex gap-1">
                                            <button
                                                type="button"
                                                onClick={() => startEdit(spec)}
                                                className="p-1 hover:bg-slate-800 rounded"
                                            >
                                                <Edit2 className="w-4 h-4 text-slate-400" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDelete(spec.id)}
                                                className="p-1 hover:bg-slate-800 rounded"
                                            >
                                                <Trash2 className="w-4 h-4 text-red-400" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {isExpanded && (
                                <div className="px-4 pb-4 pt-0 border-t border-slate-800">
                                    <div className="mt-3 text-sm text-slate-400">
                                        <p><span className="text-slate-500">Categoría:</span> {spec.category}</p>
                                        {spec.description && (
                                            <p className="mt-1"><span className="text-slate-500">Descripción:</span> {spec.description}</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {editingId === spec.id && (
                                <div className="px-4 pb-4 pt-0 border-t border-slate-800">
                                    <div className="mt-3 space-y-3">
                                        <Input
                                            value={newSpec.name}
                                            onChange={(e) => setNewSpec(s => ({ ...s, name: e.target.value }))}
                                            placeholder="Nombre"
                                            className="bg-slate-800 border-slate-700 text-white"
                                        />
                                        <Textarea
                                            value={newSpec.description}
                                            onChange={(e) => setNewSpec(s => ({ ...s, description: e.target.value }))}
                                            placeholder="Descripción"
                                            className="bg-slate-800 border-slate-700 text-white"
                                        />
                                        <div className="flex gap-2">
                                            <Button 
                                                size="sm" 
                                                onClick={() => handleUpdate(spec.id)}
                                                className="bg-teal-600 hover:bg-teal-700"
                                            >
                                                Guardar
                                            </Button>
                                            <Button 
                                                size="sm" 
                                                variant="outline"
                                                onClick={() => setEditingId(null)}
                                            >
                                                Cancelar
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {specializations.length === 0 && (
                <div className="text-center py-8 text-slate-500">
                    <Brain className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No hay especializaciones disponibles</p>
                </div>
            )}
        </div>
    );
}
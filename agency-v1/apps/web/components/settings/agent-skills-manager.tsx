"use client";

import { useState, useEffect } from "react";
import { 
    getSkills, createSkill, updateSkill, deleteSkill,
    getSpecializations
} from "@/actions/agent-config";
import { toast } from "sonner";
import { 
    Plus, Trash2, Edit2, ChevronDown, ChevronUp, Zap, 
    MessageSquare, BarChart3, Settings, GitBranch, X, Save,
    ArrowUp, ArrowDown, ToggleLeft, ToggleRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";

const CATEGORIES = [
    { value: "COMMUNICATION", label: "Comunicación", icon: MessageSquare },
    { value: "ANALYSIS", label: "Análisis", icon: BarChart3 },
    { value: "AUTOMATION", label: "Automatización", icon: Settings },
    { value: "NEGOTIATION", label: "Negociación", icon: Zap },
    { value: "GENERAL", label: "General", icon: GitBranch }
];

interface Skill {
    id: string;
    name: string;
    description: string | null;
    category: string;
    parameters: Record<string, any> | null;
    isActive: boolean;
    priority: number;
    specializationId: string;
    specialization?: { id: string; name: string; color: string };
    agentId: string | null;
}

interface Specialization {
    id: string;
    name: string;
    color: string;
    category: string;
}

interface Props {
    companyId: string;
    selectedSpecializations: string[];
    selectedSkills?: string[];
    onSkillsChange?: (ids: string[]) => void;
    readonly?: boolean;
}

export function AgentSkillsManager({ 
    companyId, 
    selectedSpecializations,
    selectedSkills = [],
    onSkillsChange,
    readonly = false
}: Props) {
    const [skills, setSkills] = useState<Skill[]>([]);
    const [specializations, setSpecializations] = useState<Specialization[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [filterCategory, setFilterCategory] = useState<string>("all");
    const [filterSpecialization, setFilterSpecialization] = useState<string>("all");
    
    const [newSkill, setNewSkill] = useState({
        name: "",
        description: "",
        category: "COMMUNICATION",
        specializationId: "",
        priority: 0,
        parameters: {}
    });
    const [parametersJson, setParametersJson] = useState("{}");

    useEffect(() => {
        loadData();
    }, [companyId]);

    async function loadData() {
        try {
            const [skillsData, specsData] = await Promise.all([
                getSkills(companyId),
                getSpecializations(companyId)
            ]);
            setSkills(skillsData);
            setSpecializations(specsData);
            
            // Set default specialization if available
            if (specsData.length > 0 && !newSkill.specializationId) {
                setNewSkill(s => ({ ...s, specializationId: specsData[0].id }));
            }
        } catch (error) {
            console.error("Error loading data:", error);
            toast.error("Error al cargar habilidades");
        } finally {
            setLoading(false);
        }
    }

    async function handleCreate() {
        if (!newSkill.name.trim() || !newSkill.specializationId) {
            toast.error("Nombre y especialización son requeridos");
            return;
        }

        try {
            let params = {};
            try {
                params = JSON.parse(parametersJson);
            } catch {
                toast.error("JSON de parámetros inválido");
                return;
            }

            await createSkill({
                ...newSkill,
                parameters: params,
                companyId
            });
            toast.success("Habilidad creada");
            setIsCreateOpen(false);
            setNewSkill({ name: "", description: "", category: "COMMUNICATION", specializationId: specializations[0]?.id || "", priority: 0, parameters: {} });
            setParametersJson("{}");
            loadData();
        } catch (error: any) {
            toast.error(error.message || "Error al crear");
        }
    }

    async function handleUpdate(id: string) {
        try {
            let params = {};
            try {
                params = JSON.parse(parametersJson);
            } catch {
                toast.error("JSON de parámetros inválido");
                return;
            }

            await updateSkill(id, {
                ...newSkill,
                parameters: params
            });
            toast.success("Habilidad actualizada");
            setEditingId(null);
            loadData();
        } catch (error: any) {
            toast.error(error.message || "Error al actualizar");
        }
    }

    async function handleDelete(id: string) {
        if (!confirm("¿Eliminar esta habilidad?")) return;
        
        try {
            await deleteSkill(id);
            toast.success("Habilidad eliminada");
            loadData();
        } catch (error: any) {
            toast.error(error.message || "Error al eliminar");
        }
    }

    async function handleToggleActive(skill: Skill) {
        try {
            await updateSkill(skill.id, { isActive: !skill.isActive });
            loadData();
        } catch (error: any) {
            toast.error(error.message || "Error al actualizar");
        }
    }

    async function handlePriorityChange(skill: Skill, direction: "up" | "down") {
        const newPriority = direction === "up" ? skill.priority - 1 : skill.priority + 1;
        try {
            await updateSkill(skill.id, { priority: newPriority });
            loadData();
        } catch (error: any) {
            toast.error(error.message || "Error al cambiar prioridad");
        }
    }

    function startEdit(skill: Skill) {
        setEditingId(skill.id);
        setNewSkill({
            name: skill.name,
            description: skill.description || "",
            category: skill.category,
            specializationId: skill.specializationId,
            priority: skill.priority,
            parameters: skill.parameters
        });
        setParametersJson(JSON.stringify(skill.parameters, null, 2));
    }

    function toggleSkillSelection(id: string) {
        if (!onSkillsChange) return;
        
        const newSelection = selectedSkills.includes(id)
            ? selectedSkills.filter(s => s !== id)
            : [...selectedSkills, id];
        onSkillsChange(newSelection);
    }

    // Filter skills based on selected specializations
    const filteredSkills = skills.filter(skill => {
        const matchesCategory = filterCategory === "all" || skill.category === filterCategory;
        const matchesSpecialization = filterSpecialization === "all" || skill.specializationId === filterSpecialization;
        const matchesSelectedSpec = selectedSpecializations.length === 0 || selectedSpecializations.includes(skill.specializationId);
        return matchesCategory && matchesSpecialization && matchesSelectedSpec;
    });

    function getCategoryInfo(category: string) {
        return CATEGORIES.find(c => c.value === category) || CATEGORIES[4];
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
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h3 className="text-lg font-semibold text-white">Habilidades</h3>
                    <p className="text-sm text-slate-400">Gestiona las capacidades del agente</p>
                </div>
                {!readonly && (
                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm" className="bg-teal-600 hover:bg-teal-700">
                                <Plus className="w-4 h-4 mr-2" />
                                Nueva Habilidad
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-slate-900 border-slate-800 max-w-2xl">
                            <DialogHeader>
                                <DialogTitle className="text-white">Nueva Habilidad</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 pt-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm text-slate-400">Nombre</label>
                                        <Input
                                            value={newSkill.name}
                                            onChange={(e) => setNewSkill(s => ({ ...s, name: e.target.value }))}
                                            placeholder="Ej: Manejo de Objeciones"
                                            className="bg-slate-800 border-slate-700 text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm text-slate-400">Categoría</label>
                                        <select
                                            value={newSkill.category}
                                            onChange={(e) => setNewSkill(s => ({ ...s, category: e.target.value }))}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-white"
                                        >
                                            {CATEGORIES.map(cat => (
                                                <option key={cat.value} value={cat.value}>{cat.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm text-slate-400">Especialización</label>
                                    <select
                                        value={newSkill.specializationId}
                                        onChange={(e) => setNewSkill(s => ({ ...s, specializationId: e.target.value }))}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-white"
                                    >
                                        <option value="">Seleccionar...</option>
                                        {specializations.map(spec => (
                                            <option key={spec.id} value={spec.id}>{spec.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm text-slate-400">Descripción</label>
                                    <Textarea
                                        value={newSkill.description}
                                        onChange={(e) => setNewSkill(s => ({ ...s, description: e.target.value }))}
                                        placeholder="Describe qué hace esta habilidad..."
                                        className="bg-slate-800 border-slate-700 text-white"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm text-slate-400">Parámetros (JSON)</label>
                                    <Textarea
                                        value={parametersJson}
                                        onChange={(e) => setParametersJson(e.target.value)}
                                        placeholder='{"timeout": 30, "retries": 3}'
                                        className="bg-slate-800 border-slate-700 text-white font-mono text-sm h-32"
                                    />
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

            {/* Filters */}
            <div className="flex gap-3 flex-wrap">
                <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-white text-sm"
                >
                    <option value="all">Todas las categorías</option>
                    {CATEGORIES.map(cat => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                </select>
                <select
                    value={filterSpecialization}
                    onChange={(e) => setFilterSpecialization(e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-white text-sm"
                >
                    <option value="all">Todas las especializaciones</option>
                    {specializations.map(spec => (
                        <option key={spec.id} value={spec.id}>{spec.name}</option>
                    ))}
                </select>
            </div>

            {/* Skills List */}
            <div className="space-y-2">
                {filteredSkills.map((skill) => {
                    const categoryInfo = getCategoryInfo(skill.category);
                    const CategoryIcon = categoryInfo.icon;
                    const isExpanded = expandedId === skill.id;
                    const isSelected = selectedSkills.includes(skill.id);
                    const specColor = skill.specialization?.color || "#0d9488";

                    return (
                        <div
                            key={skill.id}
                            className={`rounded-lg border transition-all ${
                                isSelected 
                                    ? "border-teal-500 bg-teal-500/10" 
                                    : "border-slate-800 bg-slate-900/50"
                            }`}
                        >
                            <div className="flex items-center gap-3 p-3">
                                {!readonly && onSkillsChange && (
                                    <button
                                        type="button"
                                        onClick={() => toggleSkillSelection(skill.id)}
                                        className={`w-5 h-5 rounded border flex items-center justify-center ${
                                            isSelected 
                                                ? "bg-teal-500 border-teal-500" 
                                                : "border-slate-600"
                                        }`}
                                    >
                                        {isSelected && <Zap className="w-3 h-3 text-white" />}
                                    </button>
                                )}

                                <div 
                                    className="w-8 h-8 rounded flex items-center justify-center"
                                    style={{ backgroundColor: specColor + "20" }}
                                >
                                    <CategoryIcon className="w-4 h-4" style={{ color: specColor }} />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-white text-sm">{skill.name}</span>
                                        <Badge 
                                            variant="secondary" 
                                            className="text-xs"
                                            style={{ backgroundColor: specColor + "20", color: specColor }}
                                        >
                                            {skill.specialization?.name || "Sin spec"}
                                        </Badge>
                                    </div>
                                    {skill.description && (
                                        <p className="text-xs text-slate-400 truncate">{skill.description}</p>
                                    )}
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => handlePriorityChange(skill, "up")}
                                        className="p-1 hover:bg-slate-800 rounded"
                                        disabled={readonly}
                                    >
                                        <ArrowUp className="w-3 h-3 text-slate-400" />
                                    </button>
                                    <span className="text-xs text-slate-500 w-4 text-center">{skill.priority}</span>
                                    <button
                                        type="button"
                                        onClick={() => handlePriorityChange(skill, "down")}
                                        className="p-1 hover:bg-slate-800 rounded"
                                        disabled={readonly}
                                    >
                                        <ArrowDown className="w-3 h-3 text-slate-400" />
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => handleToggleActive(skill)}
                                        className="p-1"
                                        disabled={readonly}
                                    >
                                        {skill.isActive ? (
                                            <ToggleRight className="w-5 h-5 text-teal-500" />
                                        ) : (
                                            <ToggleLeft className="w-5 h-5 text-slate-500" />
                                        )}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setExpandedId(isExpanded ? null : skill.id)}
                                        className="p-1 hover:bg-slate-800 rounded"
                                    >
                                        {isExpanded ? (
                                            <ChevronUp className="w-4 h-4 text-slate-400" />
                                        ) : (
                                            <ChevronDown className="w-4 h-4 text-slate-400" />
                                        )}
                                    </button>

                                    {!readonly && (
                                        <div className="flex gap-1">
                                            <button
                                                type="button"
                                                onClick={() => startEdit(skill)}
                                                className="p-1 hover:bg-slate-800 rounded"
                                            >
                                                <Edit2 className="w-4 h-4 text-slate-400" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDelete(skill.id)}
                                                className="p-1 hover:bg-slate-800 rounded"
                                            >
                                                <Trash2 className="w-4 h-4 text-red-400" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {isExpanded && (
                                <div className="px-3 pb-3 pt-0 border-t border-slate-800">
                                    <div className="mt-2 text-xs text-slate-400 space-y-1">
                                        <p><span className="text-slate-500">Categoría:</span> {categoryInfo.label}</p>
                                        {skill.description && (
                                            <p><span className="text-slate-500">Descripción:</span> {skill.description}</p>
                                        )}
                                        {Object.keys(skill.parameters).length > 0 && (
                                            <div>
                                                <span className="text-slate-500">Parámetros:</span>
                                                <pre className="mt-1 bg-slate-800 p-2 rounded text-slate-300 overflow-x-auto">
                                                    {JSON.stringify(skill.parameters, null, 2)}
                                                </pre>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {editingId === skill.id && (
                                <div className="px-3 pb-3 pt-0 border-t border-slate-800">
                                    <div className="mt-2 space-y-3">
                                        <div className="grid grid-cols-2 gap-2">
                                            <Input
                                                value={newSkill.name}
                                                onChange={(e) => setNewSkill(s => ({ ...s, name: e.target.value }))}
                                                placeholder="Nombre"
                                                className="bg-slate-800 border-slate-700 text-white text-sm"
                                            />
                                            <select
                                                value={newSkill.category}
                                                onChange={(e) => setNewSkill(s => ({ ...s, category: e.target.value }))}
                                                className="bg-slate-800 border border-slate-700 rounded-md px-2 py-1 text-white text-sm"
                                            >
                                                {CATEGORIES.map(cat => (
                                                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <Textarea
                                            value={newSkill.description}
                                            onChange={(e) => setNewSkill(s => ({ ...s, description: e.target.value }))}
                                            placeholder="Descripción"
                                            className="bg-slate-800 border-slate-700 text-white text-sm"
                                        />
                                        <Textarea
                                            value={parametersJson}
                                            onChange={(e) => setParametersJson(e.target.value)}
                                            placeholder='{"key": "value"}'
                                            className="bg-slate-800 border-slate-700 text-white text-xs font-mono h-20"
                                        />
                                        <div className="flex gap-2">
                                            <Button 
                                                size="sm" 
                                                onClick={() => handleUpdate(skill.id)}
                                                className="bg-teal-600 hover:bg-teal-700"
                                            >
                                                <Save className="w-3 h-3 mr-1" />
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

            {filteredSkills.length === 0 && (
                <div className="text-center py-8 text-slate-500">
                    <Zap className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No hay habilidades que coincidan con los filtros</p>
                </div>
            )}
        </div>
    );
}
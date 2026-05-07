"use client";

import { useState, useEffect } from "react";
import { 
    getGlobalConfiguration, getPresets, createPreset, updatePreset, deletePreset, applyPresetToAgent,
    syncAgentConfiguration, seedSystemSpecializations
} from "@/actions/agent-config";
import { toast } from "sonner";
import { 
    Settings, RefreshCw, Save, Trash2, Edit2, Play, ChevronDown, ChevronUp,
    Layers, Cpu, Database, Wand2, CheckCircle, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Preset {
    id: string;
    name: string;
    description: string | null;
    config: any;
    isDefault: boolean;
    isGlobal: boolean;
    specializationId: string | null;
    specialization?: { id: string; name: string; color: string } | null;
}

interface GlobalConfig {
    specializations: any[];
    skills: any[];
    presets: Preset[];
    templates: any[];
    stats: {
        totalSpecializations: number;
        totalSkills: number;
        totalPresets: number;
        totalTemplates: number;
    };
}

interface Props {
    companyId: string;
    readonly?: boolean;
}

export function GlobalAgentConfig({ companyId, readonly = false }: Props) {
    const [config, setConfig] = useState<GlobalConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("overview");
    const [syncStatus, setSyncStatus] = useState<any>(null);
    const [isCreatePresetOpen, setIsCreatePresetOpen] = useState(false);
    const [selectedPreset, setSelectedPreset] = useState<Preset | null>(null);

    const [newPreset, setNewPreset] = useState({
        name: "",
        description: "",
        config: {},
        isDefault: false,
        isGlobal: false,
        specializationId: ""
    });
    const [configJson, setConfigJson] = useState("{}");

    useEffect(() => {
        loadConfig();
    }, [companyId]);

    async function loadConfig() {
        try {
            const data = await getGlobalConfiguration(companyId);
            setConfig(data);
        } catch (error) {
            console.error("Error loading config:", error);
            toast.error("Error al cargar configuración");
        } finally {
            setLoading(false);
        }
    }

    async function handleSeedSystemData() {
        try {
            await seedSystemSpecializations();
            toast.success("Datos del sistema inicializados");
            loadConfig();
        } catch (error: any) {
            toast.error(error.message || "Error al inicializar");
        }
    }

    async function handleCreatePreset() {
        if (!newPreset.name.trim()) {
            toast.error("El nombre es requerido");
            return;
        }

        try {
            let presetConfig = {};
            try {
                presetConfig = JSON.parse(configJson);
            } catch {
                toast.error("JSON de configuración inválido");
                return;
            }

            await createPreset({
                ...newPreset,
                config: presetConfig,
                companyId
            });
            toast.success("Preset creado");
            setIsCreatePresetOpen(false);
            setNewPreset({ name: "", description: "", config: {}, isDefault: false, isGlobal: false, specializationId: "" });
            setConfigJson("{}");
            loadConfig();
        } catch (error: any) {
            toast.error(error.message || "Error al crear");
        }
    }

    async function handleDeletePreset(id: string) {
        if (!confirm("¿Eliminar este preset?")) return;
        
        try {
            await deletePreset(id);
            toast.success("Preset eliminado");
            loadConfig();
        } catch (error: any) {
            toast.error(error.message || "Error al eliminar");
        }
    }

    async function handleSyncAgent(agentId: string) {
        try {
            const status = await syncAgentConfiguration(agentId, companyId);
            setSyncStatus(status);
            toast.success("Configuración sincronizada");
        } catch (error: any) {
            toast.error(error.message || "Error al sincronizar");
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Settings className="w-6 h-6 text-teal-500" />
                        Configuración Global de Agentes
                    </h2>
                    <p className="text-slate-400">Marco de configuración multi-especializado</p>
                </div>
                <div className="flex gap-2">
                    {!readonly && (
                        <Button
                            variant="outline"
                            onClick={handleSeedSystemData}
                            className="border-slate-700"
                        >
                            <Wand2 className="w-4 h-4 mr-2" />
                            Inicializar Datos del Sistema
                        </Button>
                    )}
                    <Button
                        variant="outline"
                        onClick={loadConfig}
                        className="border-slate-700"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-teal-500/20 flex items-center justify-center">
                            <Layers className="w-5 h-5 text-teal-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">{config?.stats.totalSpecializations}</p>
                            <p className="text-sm text-slate-400">Especializaciones</p>
                        </div>
                    </div>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                            <Cpu className="w-5 h-5 text-purple-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">{config?.stats.totalSkills}</p>
                            <p className="text-sm text-slate-400">Habilidades</p>
                        </div>
                    </div>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                            <Database className="w-5 h-5 text-amber-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">{config?.stats.totalPresets}</p>
                            <p className="text-sm text-slate-400">Presets</p>
                        </div>
                    </div>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                            <Settings className="w-5 h-5 text-blue-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">{config?.stats.totalTemplates}</p>
                            <p className="text-sm text-slate-400">Templates</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="bg-slate-900 border-slate-800">
                    <TabsTrigger value="overview" className="data-[state=active]:bg-slate-800">
                        Resumen
                    </TabsTrigger>
                    <TabsTrigger value="presets" className="data-[state=active]:bg-slate-800">
                        Presets de Configuración
                    </TabsTrigger>
                    <TabsTrigger value="sync" className="data-[state=active]:bg-slate-800">
                        Sincronización
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-4 space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        {/* Specializations Overview */}
                        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
                            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                                <Layers className="w-4 h-4 text-teal-500" />
                                Especializaciones Activas
                            </h3>
                            <div className="space-y-2">
                                {config?.specializations.slice(0, 6).map(spec => (
                                    <div key={spec.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-800/50">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: spec.color }} />
                                            <span className="text-sm text-slate-300">{spec.name}</span>
                                        </div>
                                        <Badge variant="outline" className="text-xs border-slate-700">
                                            {spec.category}
                                        </Badge>
                                    </div>
                                ))}
                                {config?.specializations.length > 6 && (
                                    <p className="text-xs text-slate-500 text-center">
                                        +{config.specializations.length - 6} más
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Skills Overview */}
                        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
                            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                                <Cpu className="w-4 h-4 text-purple-500" />
                                Habilidades Recientes
                            </h3>
                            <div className="space-y-2">
                                {config?.skills.slice(0, 6).map(skill => (
                                    <div key={skill.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-800/50">
                                        <span className="text-sm text-slate-300">{skill.name}</span>
                                        <Badge variant="outline" className="text-xs border-slate-700">
                                            {skill.category}
                                        </Badge>
                                    </div>
                                ))}
                                {config?.skills.length > 6 && (
                                    <p className="text-xs text-slate-500 text-center">
                                        +{config.skills.length - 6} más
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="presets" className="mt-4 space-y-4">
                    <div className="flex justify-between items-center">
                        <p className="text-slate-400">Administra los presets de configuración para los agentes</p>
                        {!readonly && (
                            <Dialog open={isCreatePresetOpen} onOpenChange={setIsCreatePresetOpen}>
                                <DialogTrigger asChild>
                                    <Button size="sm" className="bg-teal-600 hover:bg-teal-700">
                                        <Save className="w-4 h-4 mr-2" />
                                        Nuevo Preset
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="bg-slate-900 border-slate-800 max-w-2xl">
                                    <DialogHeader>
                                        <DialogTitle className="text-white">Nuevo Preset de Configuración</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4 pt-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-sm text-slate-400">Nombre</label>
                                                <Input
                                                    value={newPreset.name}
                                                    onChange={(e) => setNewPreset(p => ({ ...p, name: e.target.value }))}
                                                    placeholder="Ej: Ventas Conservador"
                                                    className="bg-slate-800 border-slate-700 text-white"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-sm text-slate-400">Especialización</label>
                                                <select
                                                    value={newPreset.specializationId}
                                                    onChange={(e) => setNewPreset(p => ({ ...p, specializationId: e.target.value }))}
                                                    className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-white"
                                                >
                                                    <option value="">Ninguna</option>
                                                    {config?.specializations.map(spec => (
                                                        <option key={spec.id} value={spec.id}>{spec.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-sm text-slate-400">Descripción</label>
                                            <Textarea
                                                value={newPreset.description}
                                                onChange={(e) => setNewPreset(p => ({ ...p, description: e.target.value }))}
                                                placeholder="Describe este preset..."
                                                className="bg-slate-800 border-slate-700 text-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-sm text-slate-400">Configuración (JSON)</label>
                                            <Textarea
                                                value={configJson}
                                                onChange={(e) => setConfigJson(e.target.value)}
                                                placeholder='{"llmModel": "gemini-2.0-flash", "temperature": 0.3, "maxTokens": 500}'
                                                className="bg-slate-800 border-slate-700 text-white font-mono text-sm h-48"
                                            />
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    id="isDefaultPreset"
                                                    checked={newPreset.isDefault}
                                                    onChange={(e) => setNewPreset(p => ({ ...p, isDefault: e.target.checked }))}
                                                    className="rounded bg-slate-800 border-slate-700"
                                                />
                                                <label htmlFor="isDefaultPreset" className="text-sm text-slate-400">
                                                    Hacer preset por defecto
                                                </label>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    id="isGlobalPreset"
                                                    checked={newPreset.isGlobal}
                                                    onChange={(e) => setNewPreset(p => ({ ...p, isGlobal: e.target.checked }))}
                                                    className="rounded bg-slate-800 border-slate-700"
                                                />
                                                <label htmlFor="isGlobalPreset" className="text-sm text-slate-400">
                                                    Disponible globalmente
                                                </label>
                                            </div>
                                        </div>
                                        <div className="flex justify-end gap-2 pt-4">
                                            <Button variant="outline" onClick={() => setIsCreatePresetOpen(false)}>
                                                Cancelar
                                            </Button>
                                            <Button onClick={handleCreatePreset} className="bg-teal-600 hover:bg-teal-700">
                                                Crear Preset
                                            </Button>
                                        </div>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        )}
                    </div>

                    <div className="grid gap-3">
                        {config?.presets.map(preset => (
                            <div
                                key={preset.id}
                                className="rounded-lg border border-slate-800 bg-slate-900/50 p-4"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        {preset.isDefault && (
                                            <Badge className="bg-teal-500/20 text-teal-400">
                                                <CheckCircle className="w-3 h-3 mr-1" />
                                                Default
                                            </Badge>
                                        )}
                                        {preset.isGlobal && (
                                            <Badge variant="outline" className="border-slate-700 text-slate-400">
                                                Global
                                            </Badge>
                                        )}
                                        <h4 className="font-medium text-white">{preset.name}</h4>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => setSelectedPreset(preset)}
                                        >
                                            <ChevronDown className="w-4 h-4" />
                                        </Button>
                                        {!readonly && (
                                            <>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => handleDeletePreset(preset.id)}
                                                    className="text-red-400"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </div>
                                {preset.description && (
                                    <p className="text-sm text-slate-400 mt-1">{preset.description}</p>
                                )}
                                {selectedPreset?.id === preset.id && (
                                    <div className="mt-3 pt-3 border-t border-slate-800">
                                        <pre className="bg-slate-800 p-3 rounded-lg text-xs text-slate-300 overflow-x-auto">
                                            {JSON.stringify(preset.config, null, 2)}
                                        </pre>
                                    </div>
                                )}
                            </div>
                        ))}

                        {config?.presets.length === 0 && (
                            <div className="text-center py-8 text-slate-500">
                                <Database className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                <p>No hay presets configurados</p>
                            </div>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="sync" className="mt-4 space-y-4">
                    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
                        <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                            <RefreshCw className="w-4 h-4 text-teal-500" />
                            Sincronización de Configuración
                        </h3>
                        <p className="text-sm text-slate-400 mb-4">
                            Sincroniza la configuración del agente con sus especializaciones y habilidades asignadas. 
                            Esto asegura que los parámetros del agente reflejen correctamente sus capacidades configuradas.
                        </p>
                        
                        {syncStatus && (
                            <div className="bg-slate-800/50 rounded-lg p-4 mb-4">
                                <h4 className="text-sm font-medium text-white mb-2">Última Sincronización</h4>
                                <div className="space-y-1 text-xs text-slate-400">
                                    <p><span className="text-slate-500">Agente:</span> {syncStatus.agentName}</p>
                                    <p><span className="text-slate-500">Habilidades:</span> {syncStatus.skillCount}</p>
                                    <p><span className="text-slate-500">Especializaciones:</span> {syncStatus.specializationCount}</p>
                                    <p><span className="text-slate-500">Fecha:</span> {new Date(syncStatus.syncedAt).toLocaleString()}</p>
                                </div>
                            </div>
                        )}

                        <div className="flex gap-2">
                            <Button 
                                variant="outline" 
                                className="border-slate-700"
                                onClick={() => {
                                    // For demo, using a placeholder agent ID
                                    toast.info("Selecciona un agente para sincronizar desde el formulario");
                                }}
                            >
                                <Play className="w-4 h-4 mr-2" />
                                Sincronizar Agente
                            </Button>
                        </div>
                    </div>

                    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
                        <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-amber-500" />
                            Estado de Sincronización
                        </h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex items-center justify-between p-2 rounded bg-slate-800/50">
                                <span className="text-slate-300">Especializaciones del Sistema</span>
                                <Badge className="bg-teal-500/20 text-teal-400">
                                    {config?.specializations.filter(s => s.isSystem).length} activas
                                </Badge>
                            </div>
                            <div className="flex items-center justify-between p-2 rounded bg-slate-800/50">
                                <span className="text-slate-300">Habilidades Configuradas</span>
                                <Badge className="bg-purple-500/20 text-purple-400">
                                    {config?.skills.length} total
                                </Badge>
                            </div>
                            <div className="flex items-center justify-between p-2 rounded bg-slate-800/50">
                                <span className="text-slate-300">Presets Disponibles</span>
                                <Badge className="bg-amber-500/20 text-amber-400">
                                    {config?.presets.length} configurados
                                </Badge>
                            </div>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
"use client";

import { useState, useEffect, useRef } from "react";
import { 
    getSkillTemplates, importSkillFromTemplate, createSkillTemplate, deleteSkillTemplate, exportSkillTemplate
} from "@/actions/agent-config";
import { toast } from "sonner";
import { 
    Download, Upload, Trash2, Eye, Star, BookOpen, Package, 
    Search, Filter, Plus, Download as DownloadIcon, ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger
} from "@/components/ui/dialog";

interface Template {
    id: string;
    name: string;
    description: string | null;
    category: string;
    content: Record<string, any>;
    parameters: Record<string, any>;
    isGlobal: boolean;
    isPremium: boolean;
    tags: string[];
    downloads: number;
    companyId: string | null;
    createdAt: string;
}

interface Props {
    companyId: string;
    onImportSuccess?: (skill: any) => void;
    readonly?: boolean;
}

export function SkillTemplatesLibrary({ companyId, onImportSuccess, readonly = false }: Props) {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterCategory, setFilterCategory] = useState("all");
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const [newTemplate, setNewTemplate] = useState({
        name: "",
        description: "",
        category: "GENERAL",
        content: {},
        parameters: {},
        tags: [] as string[],
        isGlobal: false
    });
    const [contentJson, setContentJson] = useState("{}");
    const [parametersJson, setParametersJson] = useState("{}");
    const [tagInput, setTagInput] = useState("");

    useEffect(() => {
        loadTemplates();
    }, [companyId]);

    async function loadTemplates() {
        try {
            const data = await getSkillTemplates(companyId);
            setTemplates(data);
        } catch (error) {
            console.error("Error loading templates:", error);
            toast.error("Error al cargar templates");
        } finally {
            setLoading(false);
        }
    }

    async function handleImport(templateId: string) {
        try {
            const skill = await importSkillFromTemplate(templateId, companyId);
            toast.success("Habilidad importada exitosamente");
            onImportSuccess?.(skill);
        } catch (error: any) {
            toast.error(error.message || "Error al importar");
        }
    }

    async function handleExport(templateId: string) {
        try {
            const data = await exportSkillTemplate(templateId);
            
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${data.name.replace(/\s+/g, "-").toLowerCase()}-template.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            toast.success("Template exportado");
        } catch (error: any) {
            toast.error(error.message || "Error al exportar");
        }
    }

    async function handleDelete(templateId: string) {
        if (!confirm("¿Eliminar este template?")) return;
        
        try {
            await deleteSkillTemplate(templateId);
            toast.success("Template eliminado");
            loadTemplates();
        } catch (error: any) {
            toast.error(error.message || "Error al eliminar");
        }
    }

    async function handleCreate() {
        if (!newTemplate.name.trim()) {
            toast.error("El nombre es requerido");
            return;
        }

        try {
            let content = {};
            let params = {};
            
            try {
                content = JSON.parse(contentJson);
            } catch {
                toast.error("JSON de contenido inválido");
                return;
            }
            
            try {
                params = JSON.parse(parametersJson);
            } catch {
                toast.error("JSON de parámetros inválido");
                return;
            }

            await createSkillTemplate({
                ...newTemplate,
                content,
                parameters: params,
                companyId
            });
            toast.success("Template creado");
            setIsCreateOpen(false);
            setNewTemplate({ name: "", description: "", category: "GENERAL", content: {}, parameters: {}, tags: [], isGlobal: false });
            setContentJson("{}");
            setParametersJson("{}");
            loadTemplates();
        } catch (error: any) {
            toast.error(error.message || "Error al crear");
        }
    }

    function addTag() {
        if (tagInput.trim() && !newTemplate.tags.includes(tagInput.trim())) {
            setNewTemplate(t => ({ ...t, tags: [...t.tags, tagInput.trim()] }));
            setTagInput("");
        }
    }

    function removeTag(tag: string) {
        setNewTemplate(t => ({ ...t, tags: t.tags.filter(t => t !== tag) }));
    }

    function handleFileImport(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const content = JSON.parse(event.target?.result as string);
                
                setNewTemplate(t => ({
                    ...t,
                    name: content.name || "",
                    description: content.description || "",
                    category: content.category || "GENERAL",
                    content: content.content || {},
                    parameters: content.parameters || {},
                    tags: content.tags || []
                }));
                setContentJson(JSON.stringify(content.content || {}, null, 2));
                setParametersJson(JSON.stringify(content.parameters || {}, null, 2));
                setIsCreateOpen(true);
                toast.success("Template cargado desde archivo");
            } catch {
                toast.error("Archivo JSON inválido");
            }
        };
        reader.readAsText(file);
    }

    const filteredTemplates = templates.filter(t => {
        const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesCategory = filterCategory === "all" || t.category === filterCategory;
        return matchesSearch && matchesCategory;
    });

    const categories = [...new Set(templates.map(t => t.category))];

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
                    <h3 className="text-lg font-semibold text-white">Biblioteca de Templates</h3>
                    <p className="text-sm text-slate-400">Importa y exporta habilidades profesionales</p>
                </div>
                <div className="flex gap-2">
                    <input
                        type="file"
                        ref={fileInputRef}
                        accept=".json"
                        className="hidden"
                        onChange={handleFileImport}
                    />
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        className="border-slate-700"
                    >
                        <Upload className="w-4 h-4 mr-2" />
                        Importar JSON
                    </Button>
                    {!readonly && (
                        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                            <DialogTrigger asChild>
                                <Button size="sm" className="bg-teal-600 hover:bg-teal-700">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Crear Template
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-slate-900 border-slate-800 max-w-2xl max-h-[80vh] overflow-y-auto">
                                <DialogHeader>
                                    <DialogTitle className="text-white">Nuevo Template</DialogTitle>
                                    <DialogDescription className="text-slate-400">
                                        Crea un template de habilidad para compartir o usar posteriormente
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 pt-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm text-slate-400">Nombre</label>
                                            <Input
                                                value={newTemplate.name}
                                                onChange={(e) => setNewTemplate(t => ({ ...t, name: e.target.value }))}
                                                placeholder="Ej: Gestión de Objeciones Premium"
                                                className="bg-slate-800 border-slate-700 text-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-sm text-slate-400">Categoría</label>
                                            <select
                                                value={newTemplate.category}
                                                onChange={(e) => setNewTemplate(t => ({ ...t, category: e.target.value }))}
                                                className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-white"
                                            >
                                                <option value="COMMUNICATION">Comunicación</option>
                                                <option value="ANALYSIS">Análisis</option>
                                                <option value="AUTOMATION">Automatización</option>
                                                <option value="NEGOTIATION">Negociación</option>
                                                <option value="GENERAL">General</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-sm text-slate-400">Descripción</label>
                                        <Textarea
                                            value={newTemplate.description}
                                            onChange={(e) => setNewTemplate(t => ({ ...t, description: e.target.value }))}
                                            placeholder="Describe qué hace este template..."
                                            className="bg-slate-800 border-slate-700 text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm text-slate-400">Contenido (JSON)</label>
                                        <Textarea
                                            value={contentJson}
                                            onChange={(e) => setContentJson(e.target.value)}
                                            placeholder='{"behavior": "proactive", "tone": "formal"}'
                                            className="bg-slate-800 border-slate-700 text-white font-mono text-sm h-32"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm text-slate-400">Parámetros por defecto (JSON)</label>
                                        <Textarea
                                            value={parametersJson}
                                            onChange={(e) => setParametersJson(e.target.value)}
                                            placeholder='{"timeout": 30, "retries": 3}'
                                            className="bg-slate-800 border-slate-700 text-white font-mono text-sm h-24"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm text-slate-400">Etiquetas</label>
                                        <div className="flex gap-2 flex-wrap mb-2">
                                            {newTemplate.tags.map(tag => (
                                                <Badge key={tag} variant="secondary" className="bg-slate-800">
                                                    {tag}
                                                    <button onClick={() => removeTag(tag)} className="ml-1">
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </Badge>
                                            ))}
                                        </div>
                                        <div className="flex gap-2">
                                            <Input
                                                value={tagInput}
                                                onChange={(e) => setTagInput(e.target.value)}
                                                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                                                placeholder="Agregar etiqueta..."
                                                className="bg-slate-800 border-slate-700 text-white"
                                            />
                                            <Button type="button" onClick={addTag} variant="outline" size="sm">
                                                <Plus className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="isGlobal"
                                            checked={newTemplate.isGlobal}
                                            onChange={(e) => setNewTemplate(t => ({ ...t, isGlobal: e.target.checked }))}
                                            className="rounded bg-slate-800 border-slate-700"
                                        />
                                        <label htmlFor="isGlobal" className="text-sm text-slate-400">
                                            Disponible para todas las empresas (Global)
                                        </label>
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
            </div>

            {/* Search and Filters */}
            <div className="flex gap-3 flex-wrap">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Buscar templates..."
                        className="pl-10 bg-slate-800 border-slate-700 text-white"
                    />
                </div>
                <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-white text-sm"
                >
                    <option value="all">Todas las categorías</option>
                    {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                    ))}
                </select>
            </div>

            {/* Templates Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredTemplates.map((template) => (
                    <div
                        key={template.id}
                        className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 hover:border-slate-700 transition-colors"
                    >
                        <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <Package className="w-5 h-5 text-teal-500" />
                                <h4 className="font-medium text-white">{template.name}</h4>
                            </div>
                            {template.isPremium && (
                                <Badge className="bg-amber-500/20 text-amber-400 text-xs">
                                    Premium
                                </Badge>
                            )}
                        </div>

                        {template.description && (
                            <p className="text-sm text-slate-400 mb-3 line-clamp-2">{template.description}</p>
                        )}

                        <div className="flex flex-wrap gap-1 mb-3">
                            {template.tags.slice(0, 3).map((tag) => (
                                <Badge key={tag} variant="outline" className="text-xs border-slate-700 text-slate-400">
                                    {tag}
                                </Badge>
                            ))}
                            {template.tags.length > 3 && (
                                <Badge variant="outline" className="text-xs border-slate-700 text-slate-400">
                                    +{template.tags.length - 3}
                                </Badge>
                            )}
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                            <div className="flex items-center gap-1 text-xs text-slate-500">
                                <DownloadIcon className="w-3 h-3" />
                                {template.downloads} descargas
                            </div>
                            <div className="flex gap-1">
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setPreviewTemplate(template)}
                                    className="h-7 px-2"
                                >
                                    <Eye className="w-3 h-3" />
                                </Button>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleExport(template.id)}
                                    className="h-7 px-2"
                                >
                                    <DownloadIcon className="w-3 h-3" />
                                </Button>
                                {!readonly && (
                                    <>
                                        <Button
                                            size="sm"
                                            onClick={() => handleImport(template.id)}
                                            className="h-7 px-2 bg-teal-600 hover:bg-teal-700"
                                        >
                                            <Download className="w-3 h-3" />
                                        </Button>
                                        {template.companyId && (
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => handleDelete(template.id)}
                                                className="h-7 px-2 text-red-400 hover:text-red-300"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </Button>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {filteredTemplates.length === 0 && (
                <div className="text-center py-12 text-slate-500">
                    <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">No se encontraron templates</p>
                    <p className="text-sm mt-1">Crea uno nuevo o importa desde JSON</p>
                </div>
            )}

            {/* Preview Dialog */}
            <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
                <DialogContent className="bg-slate-900 border-slate-800 max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-white">{previewTemplate?.name}</DialogTitle>
                        <DialogDescription className="text-slate-400">
                            {previewTemplate?.description}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                        {previewTemplate?.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {previewTemplate.tags.map(tag => (
                                    <Badge key={tag} variant="secondary" className="bg-slate-800">
                                        {tag}
                                    </Badge>
                                ))}
                            </div>
                        )}
                        <div>
                            <h4 className="text-sm text-slate-400 mb-2">Contenido</h4>
                            <pre className="bg-slate-800 p-4 rounded-lg text-xs text-slate-300 overflow-x-auto max-h-60">
                                {JSON.stringify(previewTemplate?.content, null, 2)}
                            </pre>
                        </div>
                        {Object.keys(previewTemplate?.parameters || {}).length > 0 && (
                            <div>
                                <h4 className="text-sm text-slate-400 mb-2">Parámetros</h4>
                                <pre className="bg-slate-800 p-4 rounded-lg text-xs text-slate-300 overflow-x-auto max-h-40">
                                    {JSON.stringify(previewTemplate?.parameters, null, 2)}
                                </pre>
                            </div>
                        )}
                        <div className="flex justify-end gap-2 pt-4">
                            <Button variant="outline" onClick={() => setPreviewTemplate(null)}>
                                Cerrar
                            </Button>
                            {!readonly && (
                                <Button 
                                    onClick={() => previewTemplate && handleImport(previewTemplate.id)}
                                    className="bg-teal-600 hover:bg-teal-700"
                                >
                                    <Download className="w-4 h-4 mr-2" />
                                    Importar Habilidad
                                </Button>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
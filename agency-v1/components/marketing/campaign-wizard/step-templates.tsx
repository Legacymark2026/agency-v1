'use client';

import { useCampaignWizard, CampaignTemplate, PlatformKey } from './wizard-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
    Save, FolderOpen, Trash2, Plus, 
    Layout, Zap, TrendingUp, Target,
    ArrowRight, Search
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

const PRESET_TEMPLATES: CampaignTemplate[] = [
    {
        id: 'tpl_leads_facebook',
        name: 'Generación de Leads - Facebook',
        description: 'Optimizado para generar leads en Facebook e Instagram',
        category: 'leads',
        platforms: ['FACEBOOK_ADS'],
        objective: 'LEAD_GENERATION',
        budget: { type: 'DAILY', amount: 50, bidStrategy: 'LOWEST_COST', currency: 'USD', pacing: 'STANDARD', dayParting: { enabled: false, schedule: {} } },
        targeting: { ageMin: 25, ageMax: 55, genders: ['ALL'], locations: [{ id: 'loc-co', type: 'COUNTRY', name: 'Colombia' }], interests: ['Marketing Digital', 'Emprendimiento'] },
        creative: { headlines: [''], descriptions: [''], primaryTexts: [''], assetUrls: [], utmConfig: { source: 'facebook', medium: 'cpc', campaign: '' } },
        createdAt: '',
        usageCount: 156,
    },
    {
        id: 'tpl_ecommerce_multi',
        name: 'E-commerce - Multiplataforma',
        description: 'Campaña completa para tiendas online en todas las plataformas',
        category: 'ecommerce',
        platforms: ['FACEBOOK_ADS', 'GOOGLE_ADS', 'TIKTOK_ADS'],
        objective: 'CONVERSIONS',
        budget: { type: 'DAILY', amount: 100, bidStrategy: 'LOWEST_COST', currency: 'USD', pacing: 'STANDARD', dayParting: { enabled: false, schedule: {} } },
        targeting: { ageMin: 18, ageMax: 45, genders: ['ALL'], locations: [{ id: 'loc-co', type: 'COUNTRY', name: 'Colombia' }], interests: ['E-commerce', 'Compras Online'] },
        creative: { headlines: [''], descriptions: [''], primaryTexts: [''], assetUrls: [], utmConfig: { source: 'multi', medium: 'cpc', campaign: '' } },
        createdAt: '',
        usageCount: 89,
    },
    {
        id: 'tpl_brand_awareness',
        name: 'Reconocimiento de Marca',
        description: 'Alcance máximo para construir reconocimiento de marca',
        category: 'branding',
        platforms: ['FACEBOOK_ADS', 'TIKTOK_ADS'],
        objective: 'BRAND_AWARENESS',
        budget: { type: 'DAILY', amount: 200, bidStrategy: 'LOWEST_COST', currency: 'USD', pacing: 'ACCELERATED', dayParting: { enabled: false, schedule: {} } },
        targeting: { ageMin: 18, ageMax: 35, genders: ['ALL'], locations: [{ id: 'loc-co', type: 'COUNTRY', name: 'Colombia' }], interests: [] },
        creative: { headlines: [''], descriptions: [''], primaryTexts: [''], assetUrls: [], utmConfig: { source: 'brand', medium: 'display', campaign: '' } },
        createdAt: '',
        usageCount: 45,
    },
    {
        id: 'tpl_b2b_linkedin',
        name: 'B2B - LinkedIn',
        description: 'Campaña orientada a profesionales y empresas en LinkedIn',
        category: 'b2b',
        platforms: ['LINKEDIN_ADS'],
        objective: 'LEAD_GENERATION',
        budget: { type: 'DAILY', amount: 150, bidStrategy: 'TARGET_COST', currency: 'USD', pacing: 'STANDARD', dayParting: { enabled: false, schedule: {} } },
        targeting: { ageMin: 30, ageMax: 55, genders: ['ALL'], locations: [{ id: 'loc-co', type: 'COUNTRY', name: 'Colombia' }], interests: ['Emprendimiento', 'Finanzas'] },
        creative: { headlines: [''], descriptions: [''], primaryTexts: [''], assetUrls: [], utmConfig: { source: 'linkedin', medium: 'sponsored', campaign: '' } },
        createdAt: '',
        usageCount: 67,
    },
];

export function StepTemplates() {
    const { templates, setTemplates, saveAsTemplate, loadTemplate, setStep, name, platforms, budget, targeting, creative, objective, setPlatforms, setObjective, setBudget, setTargeting, setCreative } = useCampaignWizard();
    
    const [searchQuery, setSearchQuery] = useState('');
    const [saveModalOpen, setSaveModalOpen] = useState(false);
    const [templateName, setTemplateName] = useState('');
    const [templateDesc, setTemplateDesc] = useState('');
    const [activeTab, setActiveTab] = useState('presets');

    const filteredTemplates = [...PRESET_TEMPLATES, ...templates].filter(t => 
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const allTemplates = [...PRESET_TEMPLATES, ...templates];

    useEffect(() => {
        fetch('/api/marketing/templates')
            .then(res => res.json())
            .then(data => {
                if (data.success && data.data) {
                    setTemplates(data.data);
                }
            })
            .catch(err => console.error("Error loading custom templates:", err));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function handleLoadTemplate(template: CampaignTemplate) {
        loadTemplate(template);
        toast.success(`Plantilla "${template.name}" cargada`);
        setStep(1); // FIX 1: Go to Platform step (1) first so user confirms platforms
    }

    async function handleSaveAsTemplate() {
        if (!templateName.trim()) {
            toast.error("Ingresa un nombre para la plantilla");
            return;
        }
        
        const template = {
            id: `tpl_${Date.now()}`,
            name: templateName,
            description: templateDesc,
            category: 'custom',
            platforms,
            objective,
            budget,
            targeting,
            creative,
            createdAt: new Date().toISOString(),
            usageCount: 0,
        };

        try {
            const res = await fetch('/api/marketing/templates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ template })
            });

            const data = await res.json();
            if (data.success) {
                setTemplates(data.data);
                toast.success("Plantilla guardada exitosamente en la nube");
                setSaveModalOpen(false);
                setTemplateName('');
                setTemplateDesc('');
            } else {
                toast.error("Error del servidor al guardar la plantilla");
            }
        } catch (err) {
            toast.error("Error de conexión al guardar");
        }
    }

    const getPlatformIcons = (pls: PlatformKey[]) => pls.map(p => p.replace('_ADS', '')).join(' + ');

    return (
        <div className="space-y-6">
            {/* Header Actions */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                        <FolderOpen className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-white">Plantillas de Campaña</h2>
                        <p className="text-sm text-slate-400">Guarda y carga configuraciones</p>
                    </div>
                </div>
                <Button 
                    onClick={() => setSaveModalOpen(true)}
                    className="bg-purple-600 hover:bg-purple-500 text-white"
                >
                    <Save className="w-4 h-4 mr-2" />
                    Guardar Actual
                </Button>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="bg-slate-900 border-slate-800">
                    <TabsTrigger value="presets" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
                        <Layout className="w-4 h-4 mr-2" />
                        Predefinidas
                    </TabsTrigger>
                    <TabsTrigger value="custom" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
                        <FolderOpen className="w-4 h-4 mr-2" />
                        Personalizadas ({templates.length})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="presets" className="mt-6">
                    {/* Search */}
                    <div className="relative mb-6">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                        <Input 
                            placeholder="Buscar plantillas..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 bg-slate-900 border-slate-800 text-white"
                        />
                    </div>

                    {/* Template Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredTemplates.map((template) => (
                            <Card key={template.id} className="bg-slate-900 border-slate-800 hover:border-purple-500/50 transition-colors cursor-pointer group">
                                <CardContent className="p-5">
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <h3 className="font-semibold text-white group-hover:text-purple-400 transition-colors">{template.name}</h3>
                                            <p className="text-xs text-slate-500 mt-1">{template.description}</p>
                                        </div>
                                        <Badge variant="outline" className="border-slate-700 text-slate-400 text-xs">
                                            {getPlatformIcons(template.platforms)}
                                        </Badge>
                                    </div>
                                    
                                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-800">
                                        <div className="flex items-center gap-2 text-xs text-slate-500">
                                            <Target className="w-3 h-3" />
                                            <span>{template.objective.replace('_', ' ')}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-slate-500">{template.usageCount} usos</span>
                                            <Button 
                                                size="sm" 
                                                variant="ghost"
                                                onClick={() => handleLoadTemplate(template)}
                                                className="h-7 text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
                                            >
                                                Usar <ArrowRight className="w-3 h-3 ml-1" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="custom" className="mt-6">
                    {templates.length === 0 ? (
                        <div className="text-center py-12">
                            <FolderOpen className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                            <p className="text-slate-400">No tienes plantillas guardadas</p>
                            <p className="text-sm text-slate-500 mt-2">Crea una desde la configuración actual</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {templates.map((template) => (
                                <Card key={template.id} className="bg-slate-900 border-slate-800">
                                    <CardContent className="p-5">
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <h3 className="font-semibold text-white">{template.name}</h3>
                                                <p className="text-xs text-slate-500 mt-1">{template.description || 'Sin descripción'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-800">
                                            <Badge variant="outline" className="border-purple-500/30 text-purple-400 text-xs">
                                                Personalizada
                                            </Badge>
                                            <Button 
                                                size="sm" 
                                                variant="ghost"
                                                onClick={() => handleLoadTemplate(template)}
                                                className="h-7 text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
                                            >
                                                Cargar <ArrowRight className="w-3 h-3 ml-1" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            {/* Save Modal */}
            {saveModalOpen && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                    <Card className="bg-slate-900 border-slate-800 w-full max-w-md">
                        <CardHeader>
                            <CardTitle className="text-white flex items-center gap-2">
                                <Save className="w-5 h-5 text-purple-400" />
                                Guardar como Plantilla
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label className="text-slate-300">Nombre de la plantilla</Label>
                                <Input 
                                    value={templateName}
                                    onChange={(e) => setTemplateName(e.target.value)}
                                    placeholder="Ej: Mi Campaña de Verano"
                                    className="bg-slate-800 border-slate-700 text-white mt-1"
                                />
                            </div>
                            <div>
                                <Label className="text-slate-300">Descripción</Label>
                                <Textarea 
                                    value={templateDesc}
                                    onChange={(e) => setTemplateDesc(e.target.value)}
                                    placeholder="Describe para qué sirve esta plantilla..."
                                    className="bg-slate-800 border-slate-700 text-white mt-1"
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-4">
                                <Button variant="ghost" onClick={() => setSaveModalOpen(false)} className="text-slate-400">
                                    Cancelar
                                </Button>
                                <Button onClick={handleSaveAsTemplate} className="bg-purple-600 hover:bg-purple-500">
                                    Guardar
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}

import { Textarea } from '@/components/ui/textarea';
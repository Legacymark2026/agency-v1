'use client';

import { useState, useRef, useEffect } from 'react';
import { useCampaignWizard, type BrandManual } from './wizard-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Upload, Download, Building2, Sparkles, AlertTriangle, Image } from 'lucide-react';
import { toast } from 'sonner';

const DEFAULT_COLORS = ['#0d9488', '#2dd4bf', '#14b8a6', '#5eead4', '#0f766e'];

const TONE_OPTIONS = [
    { value: 'emotional', label: 'Emocional' },
    { value: 'rational', label: 'Racional' },
    { value: 'humorous', label: 'Humorístico' },
    { value: 'authoritative', label: 'Autoritativo' },
];

export function BrandManualPanel() {
    const store = useCampaignWizard();
    const { creative, setCreative, setBrandManual } = store || {};
    
    // Safe fallbacks
    const manual = creative?.brandManual as Partial<BrandManual> | undefined;
    
    const [companyName, setCompanyName] = useState(manual?.companyName || '');
    const [tagline, setTagline] = useState(manual?.tagline || '');
    const [website, setWebsite] = useState(manual?.website || '');
    const [brandColors, setBrandColors] = useState<string[]>(manual?.brandColors || DEFAULT_COLORS);
    const [brandLogo, setBrandLogo] = useState(manual?.logo || '');
    const [history, setHistory] = useState(manual?.history || '');
    const [mission, setMission] = useState(manual?.mission || '');
    const [vision, setVision] = useState(manual?.vision || '');
    const [values, setValues] = useState<string[]>(manual?.values || []);
    const [newValue, setNewValue] = useState('');
    const [dos, setDos] = useState<string[]>(manual?.dos || []);
    const [newDo, setNewDo] = useState('');
    const [donts, setDonts] = useState<string[]>(manual?.donts || []);
    const [newDont, setNewDont] = useState('');
    const [forbiddenWords, setForbiddenWords] = useState<string[]>(manual?.forbiddenWords || []);
    const [newForbidden, setNewForbidden] = useState('');
    const [personality, setPersonality] = useState(manual?.personality || '');
    const [audienceIdeal, setAudienceIdeal] = useState(manual?.audienceIdeal || '');
    const [toneVariations, setToneVariations] = useState<string[]>(
        (manual as any)?.toneVariations || ['rational']
    );
    
    const [isUploading, setIsUploading] = useState(false);
    const logoFileInputRef = useRef<HTMLInputElement>(null);
    const [showBasic, setShowBasic] = useState(true);
    const [showStory, setShowStory] = useState(false);
    const [showGuidelines, setShowGuidelines] = useState(false);
    
    function addColor() {
        if (brandColors.length < 5) {
            setBrandColors([...brandColors, '#000000']);
        }
    }
    
    function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsUploading(true);
        try {
            const objectUrl = URL.createObjectURL(file);
            setBrandLogo(objectUrl);
            toast.success('Logo cargado');
        } catch (err) {
            toast.error('Error al cargar');
        } finally {
            setIsUploading(false);
        }
    }
    
    function addValue() {
        if (newValue.trim() && !values.includes(newValue.trim())) {
            setValues([...values, newValue.trim()]);
            setNewValue('');
        }
    }
    
    function addDo() {
        if (newDo.trim() && !dos.includes(newDo.trim())) {
            setDos([...dos, newDo.trim()]);
            setNewDo('');
        }
    }
    
    function addDont() {
        if (newDont.trim() && !donts.includes(newDont.trim())) {
            setDonts([...donts, newDont.trim()]);
            setNewDont('');
        }
    }
    
    function addForbidden() {
        if (newForbidden.trim() && !forbiddenWords.includes(newForbidden.trim())) {
            setForbiddenWords([...forbiddenWords, newForbidden.trim()]);
            setNewForbidden('');
        }
    }
    
    function toggleTone(tone: string) {
        if (toneVariations.includes(tone)) {
            setToneVariations(toneVariations.filter(t => t !== tone));
        } else {
            setToneVariations([...toneVariations, tone]);
        }
    }
    
    function saveBrandManual() {
        if (!setBrandManual || !setCreative) {
            toast.error('Error: store no disponible');
            return;
        }
        
        const newManual: any = {
            companyName,
            tagline,
            logo: brandLogo,
            website,
            brandColors,
            history,
            mission,
            vision,
            values,
            personality,
            audienceIdeal,
            dos,
            donts,
            forbiddenWords,
            fewShotExamples: [],
            createdAt: manual?.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        
        setBrandManual(newManual);
        setCreative({ ...creative, brandManual: newManual });
        toast.success('¡Manual guardado!');
    }
    
    function exportManual() {
        const data = JSON.stringify({ companyName, tagline, brandColors, logo: brandLogo, website, history, mission, vision, values, dos, donts, forbiddenWords, personality, audienceIdeal }, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `brand-manual-${companyName || 'export'}.json`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Exportado');
    }
    
    return (
        <div className="space-y-4">
            <Card className="bg-slate-900 border-slate-800">
                <CardHeader className="pb-4">
                    <CardTitle className="text-white text-lg flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-teal-400" />
                        Manual de Marca
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Basic Info */}
                    <div className="space-y-3">
                        <div className="flex gap-2">
                            <button onClick={() => { setShowBasic(true); setShowStory(false); setShowGuidelines(false); }} className={`px-3 py-1.5 rounded text-sm ${showBasic ? 'bg-teal-600 text-white' : 'bg-slate-800 text-slate-300'}`}>Básico</button>
                            <button onClick={() => { setShowStory(true); setShowBasic(false); setShowGuidelines(false); }} className={`px-3 py-1.5 rounded text-sm ${showStory ? 'bg-teal-600 text-white' : 'bg-slate-800 text-slate-300'}`}>Historia</button>
                            <button onClick={() => { setShowGuidelines(true); setShowBasic(false); setShowStory(false); }} className={`px-3 py-1.5 rounded text-sm ${showGuidelines ? 'bg-teal-600 text-white' : 'bg-slate-800 text-slate-300'}`}>Directrices</button>
                        </div>
                    </div>
                    
                    {showBasic && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label className="text-slate-300 text-sm">Empresa</Label>
                                    <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Tu Empresa" className="bg-slate-950 border-slate-700 text-white" />
                                </div>
                                <div>
                                    <Label className="text-slate-300 text-sm">Website</Label>
                                    <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://..." className="bg-slate-950 border-slate-700 text-white" />
                                </div>
                            </div>
                            <div>
                                <Label className="text-slate-300 text-sm">Tagline</Label>
                                <Input value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="Tu slogan" className="bg-slate-950 border-slate-700 text-white" />
                            </div>
                            <div>
                                <Label className="text-slate-300 text-sm">Logo</Label>
                                <div className="flex gap-2">
                                    <input ref={logoFileInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                                    <Button type="button" variant="outline" onClick={() => logoFileInputRef.current?.click()} disabled={isUploading} className="border-slate-700 text-slate-300">
                                        <Image className="w-4 h-4 mr-1" />
                                        {isUploading ? 'Cargando...' : 'Subir Logo'}
                                    </Button>
                                    <Input value={brandLogo} onChange={(e) => setBrandLogo(e.target.value)} placeholder="O URL..." className="bg-slate-950 border-slate-700 text-white flex-1" />
                                </div>
                                {brandLogo && <img src={brandLogo} alt="Logo" className="h-12 mt-2" />}
                            </div>
                            <div>
                                <Label className="text-slate-300 text-sm">Colores</Label>
                                <div className="flex gap-2 flex-wrap">
                                    {brandColors.map((color, idx) => (
                                        <div key={idx} className="flex items-center gap-1">
                                            <input type="color" value={color} onChange={(e) => {
                                                const c = [...brandColors];
                                                c[idx] = e.target.value;
                                                setBrandColors(c);
                                            }} className="w-10 h-10 rounded cursor-pointer" />
                                            <button onClick={() => setBrandColors(brandColors.filter((_, i) => i !== idx))} className="text-slate-500 hover:text-red-400">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                    {brandColors.length < 5 && (
                                        <Button variant="outline" size="sm" onClick={addColor} className="h-10">
                                            <Plus className="w-4 h-4" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {showStory && (
                        <div className="space-y-4">
                            <div>
                                <Label className="text-slate-300 text-sm">Historia</Label>
                                <Textarea value={history} onChange={(e) => setHistory(e.target.value)} placeholder="Cómo nació tu empresa..." className="bg-slate-950 border-slate-700 text-white min-h-[100px]" />
                            </div>
                            <div>
                                <Label className="text-slate-300 text-sm">Misión</Label>
                                <Textarea value={mission} onChange={(e) => setMission(e.target.value)} placeholder="Propósito de tu empresa..." className="bg-slate-950 border-slate-700 text-white" />
                            </div>
                            <div>
                                <Label className="text-slate-300 text-sm">Visión</Label>
                                <Textarea value={vision} onChange={(e) => setVision(e.target.value)} placeholder="Qué quieres lograr..." className="bg-slate-950 border-slate-700 text-white" />
                            </div>
                            <div>
                                <Label className="text-slate-300 text-sm">Personalidad</Label>
                                <Textarea value={personality} onChange={(e) => setPersonality(e.target.value)} placeholder="Cómo habla tu marca..." className="bg-slate-950 border-slate-700 text-white" />
                            </div>
                            <div>
                                <Label className="text-slate-300 text-sm">Audience Ideal</Label>
                                <Textarea value={audienceIdeal} onChange={(e) => setAudienceIdeal(e.target.value)} placeholder="Tu cliente ideal..." className="bg-slate-950 border-slate-700 text-white" />
                            </div>
                        </div>
                    )}
                    
                    {showGuidelines && (
                        <div className="space-y-4">
                            <div>
                                <Label className="text-slate-300 text-sm">Valores</Label>
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {values.map((v, i) => (
                                        <Badge key={i} variant="outline" className="border-teal-500/30 text-teal-400">{v}</Badge>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <Input value={newValue} onChange={(e) => setNewValue(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addValue()} placeholder="Agregar valor..." className="bg-slate-950 border-slate-700 text-white" />
                                    <Button onClick={addValue} variant="outline" className="border-slate-700 text-slate-300"><Plus className="w-4 h-4" /></Button>
                                </div>
                            </div>
                            <div>
                                <Label className="text-slate-300 text-sm">Tonos</Label>
                                <div className="flex flex-wrap gap-2">
                                    {TONE_OPTIONS.map(t => (
                                        <button key={t.value} onClick={() => toggleTone(t.value)} className={`px-3 py-1 rounded text-sm ${toneVariations.includes(t.value) ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-300'}`}>{t.label}</button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <Label className="text-slate-300 text-sm flex items-center gap-1"><AlertTriangle className="w-4 h-4" /> Do's</Label>
                                <div className="flex flex-wrap gap-2 mb-2">{dos.map((d, i) => <Badge key={i} variant="outline" className="border-green-500/30 text-green-400">{d}</Badge>)}</div>
                                <div className="flex gap-2">
                                    <Input value={newDo} onChange={(e) => setNewDo(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addDo()} placeholder="Qué hacer..." className="bg-slate-950 border-slate-700 text-white" />
                                    <Button onClick={addDo} variant="outline" className="border-slate-700 text-slate-300"><Plus className="w-4 h-4" /></Button>
                                </div>
                            </div>
                            <div>
                                <Label className="text-slate-300 text-sm flex items-center gap-1"><AlertTriangle className="w-4 h-4 text-red-400" /> Don'ts</Label>
                                <div className="flex flex-wrap gap-2 mb-2">{donts.map((d, i) => <Badge key={i} variant="outline" className="border-red-500/30 text-red-400">{d}</Badge>)}</div>
                                <div className="flex gap-2">
                                    <Input value={newDont} onChange={(e) => setNewDont(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addDont()} placeholder="Qué NO hacer..." className="bg-slate-950 border-slate-700 text-white" />
                                    <Button onClick={addDont} variant="outline" className="border-slate-700 text-slate-300"><Plus className="w-4 h-4" /></Button>
                                </div>
                            </div>
                            <div>
                                <Label className="text-slate-300 text-sm flex items-center gap-1">Palabras Prohibidas</Label>
                                <div className="flex flex-wrap gap-2 mb-2">{forbiddenWords.map((w, i) => <Badge key={i} variant="outline" className="border-yellow-500/30 text-yellow-400">{w}</Badge>)}</div>
                                <div className="flex gap-2">
                                    <Input value={newForbidden} onChange={(e) => setNewForbidden(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addForbidden()} placeholder="Evitar..." className="bg-slate-950 border-slate-700 text-white" />
                                    <Button onClick={addForbidden} variant="outline" className="border-slate-700 text-slate-300"><Plus className="w-4 h-4" /></Button>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    <div className="flex gap-2 pt-4 border-t border-slate-700">
                        <Button onClick={exportManual} variant="outline" className="border-slate-700 text-slate-300">
                            <Download className="w-4 h-4 mr-1" /> Export
                        </Button>
                        <Button onClick={saveBrandManual} className="bg-teal-600 hover:bg-teal-500 flex-1">
                            <Sparkles className="w-4 h-4 mr-2" /> Guardar
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
'use client';

import { useCampaignWizard, LocationTarget } from './wizard-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { X, Plus, MapPin, Globe, Target } from 'lucide-react';
import { useState } from 'react';

const COMMON_INTERESTS = [
    'Tecnología', 'Emprendimiento', 'Marketing Digital', 'Pequeñas Empresas',
    'CRM / Software', 'Finanzas', 'E-commerce', 'Real Estate',
];

export function StepTargeting() {
    const { targeting, setTargeting, nextStep, prevStep } = useCampaignWizard();
    const [interestInput, setInterestInput] = useState('');
    
    // Advanced Location Inputs
    const [locType, setLocType] = useState<'COUNTRY' | 'REGION' | 'CITY' | 'SECTOR' | 'COORDINATES'>('COUNTRY');
    const [locName, setLocName] = useState('');
    const [locLat, setLocLat] = useState('');
    const [locLng, setLocLng] = useState('');
    const [locRadius, setLocRadius] = useState('20');

    function addInterest(interest: string) {
        if (!interest.trim() || targeting.interests.includes(interest)) return;
        setTargeting({ interests: [...targeting.interests, interest] });
        setInterestInput('');
    }

    function removeInterest(interest: string) {
        setTargeting({ interests: targeting.interests.filter((i) => i !== interest) });
    }

    function addLocation() {
        if (locType !== 'COORDINATES' && !locName.trim()) return;
        if (locType === 'COORDINATES' && (!locLat || !locLng)) return;

        if (locType === 'SECTOR') {
            const tagsList = locName.split(',').map(s => s.trim()).filter(Boolean);
            const newLoc: LocationTarget = {
                id: `loc-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                type: locType,
                name: tagsList.length === 1 ? tagsList[0] : `Múltiples Sectores (${tagsList.length})`,
                tags: tagsList,
            };
            setTargeting({ locations: [...targeting.locations, newLoc] });
            setLocName('');
            return;
        }

        const newLoc: LocationTarget = {
            id: `loc-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            type: locType,
            name: locType === 'COORDINATES' ? `Coords: ${locLat}, ${locLng}` : locName.trim(),
        };

        if (locType === 'COORDINATES') {
            newLoc.lat = parseFloat(locLat);
            newLoc.lng = parseFloat(locLng);
            newLoc.radiusKm = parseFloat(locRadius) || 20;
        }

        setTargeting({ locations: [...targeting.locations, newLoc] });
        setLocName('');
        setLocLat('');
        setLocLng('');
    }

    function removeLocation(id: string) {
        setTargeting({ locations: targeting.locations.filter((l) => l.id !== id) });
    }

    return (
        <div className="space-y-10">
            {/* Age & Gender Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Age Range */}
                <div className="space-y-4">
                    <Label className="text-sm font-semibold text-gray-300">Rango de Edad</Label>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="age-min" className="text-xs text-gray-500">Mínima</Label>
                            <Input
                                id="age-min"
                                type="number"
                                min={13}
                                max={65}
                                value={targeting.ageMin}
                                onChange={(e) => setTargeting({ ageMin: parseInt(e.target.value) || 18 })}
                                className="bg-white/5 border-white/10 text-white h-11"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="age-max" className="text-xs text-gray-500">Máxima</Label>
                            <Input
                                id="age-max"
                                type="number"
                                min={13}
                                max={65}
                                value={targeting.ageMax}
                                onChange={(e) => setTargeting({ ageMax: parseInt(e.target.value) || 65 })}
                                className="bg-white/5 border-white/10 text-white h-11"
                            />
                        </div>
                    </div>
                </div>

                {/* Gender */}
                <div className="space-y-4">
                    <Label className="text-sm font-semibold text-gray-300">Género</Label>
                    <div className="flex gap-2">
                        {(['ALL', 'MALE', 'FEMALE'] as const).map((g) => (
                            <button
                                key={g}
                                id={`gender-${g.toLowerCase()}`}
                                type="button"
                                onClick={() => setTargeting({ genders: [g] })}
                                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all border ${targeting.genders.includes(g)
                                        ? 'border-teal-500 bg-teal-500/10 text-teal-300 shadow-[0_0_10px_rgba(20,184,166,0.1)]'
                                        : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20'
                                    }`}
                            >
                                {g === 'ALL' ? 'Todos' : g === 'MALE' ? 'Hombres' : 'Mujeres'}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Advanced Locations */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold text-gray-300">Segmentación Geográfica Avanzada</Label>
                    <span className="text-xs text-teal-500 font-medium px-2 py-0.5 bg-teal-500/10 rounded-full border border-teal-500/20">Spatial Engine v2</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-white/5 p-5 rounded-2xl border border-white/10 shadow-lg">
                    <div className="space-y-2">
                        <Label className="text-xs text-gray-400 font-medium">Tipo de Capa Geográfica</Label>
                        <select 
                            className="w-full bg-slate-950 border border-white/10 text-white rounded-lg h-11 px-3 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-shadow outline-none"
                            value={locType}
                            onChange={(e) => setLocType(e.target.value as any)}
                        >
                            <option value="COUNTRY">País (Macro)</option>
                            <option value="REGION">Estado / Región</option>
                            <option value="CITY">Ciudad</option>
                            <option value="SECTOR">Código Postal / Barrio</option>
                            <option value="COORDINATES">📍 Coordenadas de Precisión (GPS)</option>
                        </select>
                    </div>

                    {locType === 'COORDINATES' ? (
                        <>
                            <div className="space-y-2">
                                <Label className="text-xs text-gray-400 font-medium">Latitud</Label>
                                <Input value={locLat} onChange={e => setLocLat(e.target.value)} placeholder="Ej: 4.6097" type="number" step="any" className="bg-slate-950 border-white/10 h-11 font-mono text-sm" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs text-gray-400 font-medium">Longitud</Label>
                                <Input value={locLng} onChange={e => setLocLng(e.target.value)} placeholder="Ej: -74.0817" type="number" step="any" className="bg-slate-950 border-white/10 h-11 font-mono text-sm" />
                            </div>
                            <div className="space-y-2 flex items-end gap-2">
                                <div className="flex-1">
                                    <Label className="text-xs text-gray-400 font-medium">Radio Mínimo (km)</Label>
                                    <Input value={locRadius} onChange={e => setLocRadius(e.target.value)} type="number" className="bg-slate-950 border-white/10 h-11 text-center" />
                                </div>
                                <Button type="button" onClick={addLocation} className="h-11 w-11 bg-teal-600 hover:bg-teal-500 p-0 text-white shadow-lg shrink-0 rounded-lg">
                                    <Plus className="w-5 h-5" />
                                </Button>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="space-y-2 md:col-span-2">
                                <Label className="text-xs text-gray-400 font-medium">Nombre de la Ubicación</Label>
                                <Input 
                                    value={locName} 
                                    onChange={e => setLocName(e.target.value)} 
                                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addLocation())} 
                                    placeholder={locType === 'COUNTRY' ? 'Ej: Colombia, México, España...' : locType === 'CITY' ? 'Ej: Bogotá, Madrid, Miami...' : 'Ej: Zona T, 90210, Polanco (separa por comas)'} 
                                    className="bg-slate-950 border-white/10 h-11" 
                                />
                            </div>
                            <div className="flex items-end">
                                <Button type="button" onClick={addLocation} className="h-11 w-full bg-teal-600 hover:bg-teal-500 text-white rounded-lg shadow-lg font-semibold tracking-wide">
                                    Añadir Capa
                                </Button>
                            </div>
                        </>
                    )}
                </div>

                {/* Selected Locations Array */}
                {targeting.locations.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
                        {targeting.locations.map((loc) => (
                            <div key={loc.id} className="flex flex-col border border-white/10 bg-slate-900/50 p-3.5 rounded-xl relative group shadow-sm hover:border-teal-500/30 transition-colors">
                                <button type="button" onClick={() => removeLocation(loc.id)} className="absolute top-2 right-2 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-white/5 rounded-full backdrop-blur-sm">
                                    <X className="w-3.5 h-3.5" />
                                </button>
                                <div className="flex items-center gap-2 mb-1.5">
                                    {loc.type === 'COUNTRY' ? <Globe className="w-3.5 h-3.5 text-emerald-500" /> : loc.type === 'COORDINATES' ? <Target className="w-3.5 h-3.5 text-rose-500" /> : <MapPin className="w-3.5 h-3.5 text-teal-400"/>}
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{loc.type}</span>
                                </div>
                                <span className="text-sm font-semibold text-slate-200 pr-6 truncate">{loc.name}</span>
                                {loc.type === 'COORDINATES' && (
                                    <div className="mt-2 pt-2 border-t border-white/5 flex gap-3 text-xs font-mono text-slate-400">
                                        <span>Lat: <span className="text-slate-300">{loc.lat}</span></span>
                                        <span>Lng: <span className="text-slate-300">{loc.lng}</span></span>
                                        <span className="text-teal-500 bg-teal-500/10 px-1.5 rounded">{loc.radiusKm}km</span>
                                    </div>
                                )}
                                {loc.type === 'SECTOR' && loc.tags && loc.tags.length > 0 && (
                                    <div className="mt-2 pt-2 border-t border-white/5 flex flex-wrap gap-1">
                                        {loc.tags.map(t => (
                                            <Badge key={t} className="px-1 py-0 bg-white/5 text-[10px] text-slate-300 border-none font-normal">{t}</Badge>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center p-8 border border-dashed border-white/10 rounded-2xl bg-white/5">
                        <p className="text-sm text-slate-400 font-medium mb-1">Sin restricciones geográficas.</p>
                        <p className="text-xs text-slate-500">Añade coordenadas exactas o regiones para acotar el presupuesto de pauta eficientemente.</p>
                    </div>
                )}
            </div>

            {/* Interests & Matrix */}
            <div className="space-y-4 pt-4 border-t border-white/5">
                <Label className="text-sm font-semibold text-gray-300">Intereses y Matriz de Audiencias</Label>
                <div className="flex gap-3">
                    <Input
                        id="interest-input"
                        value={interestInput}
                        onChange={(e) => setInterestInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addInterest(interestInput))}
                        placeholder="Ingresa un interés comercial (ej: Relojería fina) y presiona Enter..."
                        className="bg-white/5 border-white/10 text-white h-12 flex-1 rounded-xl focus:border-teal-500/50"
                    />
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => addInterest(interestInput)}
                        className="h-12 w-12 border-white/10 bg-white/5 text-gray-300 hover:bg-teal-500 hover:text-white rounded-xl"
                    >
                        <Plus className="w-5 h-5" />
                    </Button>
                </div>

                {/* Quick Add Clusters */}
                <div className="flex flex-wrap gap-2 pt-2">
                    <span className="text-xs font-semibold text-slate-500 mr-2 py-1.5">Sugerencias B2B:</span>
                    {COMMON_INTERESTS.filter(i => !targeting.interests.includes(i)).map((interest) => (
                        <button
                            key={interest}
                            type="button"
                            onClick={() => addInterest(interest)}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 border border-dashed border-white/10 hover:border-teal-500 hover:bg-teal-500/10 hover:text-teal-300 transition-all"
                        >
                            + {interest}
                        </button>
                    ))}
                </div>

                {/* Selected Interests Layer */}
                {targeting.interests.length > 0 && (
                    <div className="flex flex-wrap gap-2 p-4 bg-slate-900/50 border border-white/5 rounded-2xl shadow-inner mt-4">
                        {targeting.interests.map((interest) => (
                            <Badge
                                key={interest}
                                className="px-3 py-1.5 bg-violet-500/10 text-violet-300 border border-violet-500/20 hover:bg-violet-500/20 gap-2 font-medium"
                            >
                                {interest}
                                <button type="button" onClick={() => removeInterest(interest)} className="hover:text-red-400 transition-colors">
                                    <X className="w-3 h-3" />
                                </button>
                            </Badge>
                        ))}
                    </div>
                )}
            </div>

            {/* Lookalike & Exclusions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-white/5">
                <div className="space-y-2">
                    <Label htmlFor="custom-audiences" className="text-sm font-semibold text-gray-300 flex justify-between">
                        Cruce de Bases de Datos (CRM)
                        <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded border border-blue-500/30 uppercase tracking-widest">Opcional</span>
                    </Label>
                    <Input
                        id="custom-audiences"
                        value={targeting.customAudiences ?? ''}
                        onChange={(e) => setTargeting({ customAudiences: e.target.value })}
                        placeholder="IDs de Pixel, Listas de Mails (separadas por coma)"
                        className="bg-white/5 border-white/10 text-white h-11"
                    />
                    <p className="text-xs text-slate-500 leading-relaxed font-light">
                        El sistema sincronizará automáticamente mediante Conversions API (CAPI) de Meta y TikTok.
                    </p>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="excluded-audiences" className="text-sm font-semibold text-gray-300">
                        Exclusiones Negativas
                    </Label>
                    <Input
                        id="excluded-audiences"
                        value={targeting.excludedAudiences ?? ''}
                        onChange={(e) => setTargeting({ excludedAudiences: e.target.value })}
                        placeholder="IDs de Clientes Actuales (evitar re-impacto)"
                        className="bg-white/5 border-white/10 text-white h-11"
                    />
                </div>
            </div>

            {/* Actions Bar */}
            <div className="flex justify-between pt-8 border-t border-white/10">
                <Button variant="ghost" onClick={prevStep} className="text-slate-400 hover:text-white hover:bg-white/5 rounded-xl h-12 px-6">
                    ← Volver a Presupuesto
                </Button>
                <Button
                    id="wizard-next-step-3"
                    onClick={nextStep}
                    className="bg-teal-600 hover:bg-teal-500 text-white px-10 h-12 rounded-xl shadow-lg shadow-teal-900/50 font-semibold tracking-wide"
                >
                    Continuar a Creativos →
                </Button>
            </div>
        </div>
    );
}

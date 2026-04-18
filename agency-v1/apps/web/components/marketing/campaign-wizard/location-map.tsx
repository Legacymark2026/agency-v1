'use client';

import { LocationTarget } from './wizard-store';
import { MapPin, Layers, Radio, Globe, Building2, CheckCircle, ExternalLink } from 'lucide-react';
import { useState, useEffect } from 'react';

interface LocationMapProps {
    locations: LocationTarget[];
}

const DEFAULT_COORDS: Record<string, { lat: number; lng: number }> = {
    'colombia': { lat: 4.5709, lng: -74.2973 },
    'bogota': { lat: 4.7110, lng: -74.0721 },
    'medellin': { lat: 6.2476, lng: -75.5658 },
    'cali': { lat: 3.4516, lng: -76.5320 },
    'barranquilla': { lat: 10.9685, lng: -74.7813 },
    'mexico': { lat: 23.6345, lng: -102.5528 },
    'usa': { lat: 37.0902, lng: -95.7129 },
    'espana': { lat: 40.4637, lng: -3.7492 },
};

const GEO_TYPE_CONFIG = {
    COUNTRY: { icon: Globe, color: 'text-emerald-400', label: 'País' },
    REGION: { icon: Building2, color: 'text-blue-400', label: 'Estado/Región' },
    CITY: { icon: MapPin, color: 'text-teal-400', label: 'Ciudad' },
    SECTOR: { icon: Layers, color: 'text-purple-400', label: 'Sector/Barrio' },
    COORDINATES: { icon: MapPin, color: 'text-rose-400', label: 'Coordenadas GPS' },
};

function validateCoordinates(lat: number, lng: number): { valid: boolean; message: string } {
    if (isNaN(lat) || isNaN(lng)) return { valid: false, message: 'Coordenadas inválidas' };
    if (lat < -90 || lat > 90) return { valid: false, message: 'Latitud debe estar entre -90 y 90' };
    if (lng < -180 || lng > 180) return { valid: false, message: 'Longitud debe estar entre -180 y 180' };
    return { valid: true, message: 'Coordenadas válidas' };
}

function getCoordinatesForLocation(loc: LocationTarget): { lat: number; lng: number } | null {
    if (loc.lat && loc.lng) return { lat: loc.lat, lng: loc.lng };
    const nameLower = loc.name.toLowerCase();
    for (const [key, coords] of Object.entries(DEFAULT_COORDS)) {
        if (nameLower.includes(key)) return coords;
    }
    return null;
}

export function LocationMap({ locations }: LocationMapProps) {
    const [selectedLocation, setSelectedLocation] = useState<LocationTarget | null>(null);
    const [showRadius, setShowRadius] = useState(true);

    const coordinateLocations = locations.filter(l => l.type === 'COORDINATES' && l.lat && l.lng);
    const countryLocations = locations.filter(l => l.type === 'COUNTRY');
    const regionLocations = locations.filter(l => l.type === 'REGION');
    const cityLocations = locations.filter(l => l.type === 'CITY');

    useEffect(() => {
        if (coordinateLocations.length > 0) setSelectedLocation(coordinateLocations[0]);
        else if (locations.length > 0) setSelectedLocation(locations[0]);
    }, [coordinateLocations, locations]);

    const selectedCoords = selectedLocation ? getCoordinatesForLocation(selectedLocation) : null;
    const mapCenter = selectedCoords ? `${selectedCoords.lat},${selectedCoords.lng}` : '4.5709,-74.2973';
    const mapZoom = selectedCoords ? '12' : '5';

    const allMarkers = locations.map(loc => {
        const coords = getCoordinatesForLocation(loc);
        if (!coords) return null;
        return { ...loc, displayCoords: coords, validation: loc.lat && loc.lng ? validateCoordinates(loc.lat, loc.lng) : null };
    }).filter(Boolean);

    const openStreetMapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(
        allMarkers.length > 0 
            ? `${(selectedCoords?.lng || -74.3) - 0.1},${(selectedCoords?.lat || 4.5) - 0.1},${(selectedCoords?.lng || -74.3) + 0.1},${(selectedCoords?.lat || 4.5) + 0.1}`
            : '-74.3,4.4,-73.9,4.7'
    )}&layer=mapnik&marker=${mapCenter}`;

    if (locations.length === 0) {
        return (
            <div className="text-center py-8 text-slate-500">
                <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Agrega ubicaciones para ver el mapa</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                        <Layers className="w-4 h-4" />
                        <span>Ubicaciones ({locations.length})</span>
                    </div>
                    <div className="flex gap-2">
                        {countryLocations.length > 0 && <span className="text-xs px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-full">{countryLocations.length} País</span>}
                        {regionLocations.length > 0 && <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full">{regionLocations.length} Región</span>}
                        {cityLocations.length > 0 && <span className="text-xs px-2 py-1 bg-teal-500/20 text-teal-400 rounded-full">{cityLocations.length} Ciudad</span>}
                        {coordinateLocations.length > 0 && <span className="text-xs px-2 py-1 bg-rose-500/20 text-rose-400 rounded-full">{coordinateLocations.length} GPS</span>}
                    </div>
                </div>
                <button type="button" onClick={() => setShowRadius(!showRadius)} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs ${showRadius ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
                    <Radio className="w-3 h-3" /> Radio {showRadius ? 'ON' : 'OFF'}
                </button>
            </div>

            {/* Map using OpenStreetMap embed */}
            <div className="relative rounded-xl overflow-hidden border border-slate-700 bg-slate-800">
                <div className="w-full h-[350px] relative">
                    <iframe
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        src={openStreetMapUrl}
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        title="Mapa de ubicaciones"
                    />
                </div>
                
                {/* Custom overlay for radius visualization - simplified */}
                {showRadius && coordinateLocations.length > 0 && (
                    <div className="absolute bottom-4 right-4 bg-slate-900/90 p-3 rounded-lg border border-slate-700 backdrop-blur-sm">
                        <div className="flex items-center gap-2 text-xs text-teal-300">
                            <Radio className="w-4 h-4" />
                            <span>Radio activo</span>
                        </div>
                    </div>
                )}
            </div>

            {/* OpenStreetMap link for full view */}
            <div className="text-center">
                <a 
                    href={`https://www.openstreetmap.org/?mlat=${selectedCoords?.lat || 4.5709}&mlon=${selectedCoords?.lng || -74.2973}#map=12/${selectedCoords?.lat || 4.5709}/${selectedCoords?.lng || -74.2973}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-teal-400 transition-colors"
                >
                    <ExternalLink className="w-3 h-3" />
                    Ver en OpenStreetMap (pantalla completa)
                </a>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div className="p-2 bg-slate-800/50 rounded-lg text-center"><Globe className="w-4 h-4 mx-auto mb-1 text-emerald-400" /><p className="text-xs text-slate-400">Países</p><p className="text-sm font-bold text-white">{countryLocations.length}</p></div>
                <div className="p-2 bg-slate-800/50 rounded-lg text-center"><Building2 className="w-4 h-4 mx-auto mb-1 text-blue-400" /><p className="text-xs text-slate-400">Regiones</p><p className="text-sm font-bold text-white">{regionLocations.length}</p></div>
                <div className="p-2 bg-slate-800/50 rounded-lg text-center"><MapPin className="w-4 h-4 mx-auto mb-1 text-teal-400" /><p className="text-xs text-slate-400">Ciudades</p><p className="text-sm font-bold text-white">{cityLocations.length}</p></div>
                <div className="p-2 bg-slate-800/50 rounded-lg text-center"><Layers className="w-4 h-4 mx-auto mb-1 text-purple-400" /><p className="text-xs text-slate-400">Coordenadas</p><p className="text-sm font-bold text-white">{coordinateLocations.length}</p></div>
            </div>

            {coordinateLocations.length > 0 && showRadius && (
                <div className="p-3 bg-teal-500/10 rounded-lg border border-teal-500/20">
                    <div className="flex items-center gap-2 text-xs text-teal-300"><Radio className="w-4 h-4" /><span>Las coordenadas GPS permiten círculo de radio. Ver en mapa completo para visualizar.</span></div>
                </div>
            )}

            <div className="space-y-2 max-h-48 overflow-y-auto">
                {locations.map((loc) => {
                    const coords = getCoordinatesForLocation(loc);
                    const validation = loc.lat && loc.lng ? validateCoordinates(loc.lat, loc.lng) : null;
                    const typeConfig = GEO_TYPE_CONFIG[loc.type as keyof typeof GEO_TYPE_CONFIG] || GEO_TYPE_CONFIG.COORDINATES;
                    const TypeIcon = typeConfig.icon;
                    return (
                        <div key={loc.id} className={`p-3 rounded-lg border transition-all cursor-pointer ${selectedLocation?.id === loc.id ? 'border-teal-500 bg-teal-500/10' : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'}`} onClick={() => coords && setSelectedLocation(loc)}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <TypeIcon className={`w-4 h-4 ${typeConfig.color}`} />
                                    <div><p className="text-sm text-white font-medium">{loc.name}</p><p className="text-xs text-slate-500">{typeConfig.label}</p></div>
                                </div>
                                <div className="text-right">
                                    {validation ? validation.valid ? <div className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-green-400" /><span className="text-xs text-green-400">Válido</span></div> : <span className="text-xs text-red-400">{validation.message}</span> : coords ? <span className="text-xs text-teal-400">{loc.radiusKm || 20}km</span> : <span className="text-xs text-slate-500">Sin coords</span>}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
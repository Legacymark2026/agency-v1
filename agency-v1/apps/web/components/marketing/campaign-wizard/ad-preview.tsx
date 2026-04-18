'use client';

import { useState } from 'react';
import { Ad, BrandIdentity } from './wizard-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Facebook, Instagram, Linkedin, Youtube, Smartphone, Monitor, Globe, Play, LayoutGrid, Image as ImageIcon } from 'lucide-react';

const PLATFORMS = [
    { id: 'facebook_feed', label: 'Facebook Feed', icon: Facebook, color: '#1877F2', width: 500 },
    { id: 'facebook_story', label: 'Facebook Story', icon: Facebook, color: '#1877F2', width: 1080, height: 1920 },
    { id: 'instagram_feed', label: 'Instagram Feed', icon: Instagram, color: '#E4405F', width: 1080 },
    { id: 'instagram_story', label: 'Instagram Story', icon: Instagram, color: '#E4405F', width: 1080, height: 1920 },
    { id: 'linkedin_feed', label: 'LinkedIn Feed', icon: Linkedin, color: '#0A66C2', width: 1200 },
    { id: 'google_display', label: 'Google Display', icon: Globe, color: '#4285F4', width: 300, height: 250 },
    { id: 'tiktok_feed', label: 'TikTok In-Feed', icon: Play, color: '#000000', width: 1080, height: 1920 },
];

const FORMAT_STYLES: Record<string, {
    container: string;
    imageOverlay: string;
    textOverlay: string;
    textPosition: string;
    maxHeadline: number;
    maxDescription: number;
}> = {
    feed: {
        container: 'bg-white rounded-lg overflow-hidden',
        imageOverlay: 'aspect-video',
        textOverlay: 'p-3 bg-white',
        textPosition: 'flex-col',
        maxHeadline: 40,
        maxDescription: 125,
    },
    story: {
        container: 'aspect-[9/16] rounded-lg overflow-hidden',
        imageOverlay: 'absolute inset-0',
        textOverlay: 'absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent text-white',
        textPosition: 'flex-col',
        maxHeadline: 40,
        maxDescription: 125,
    },
    carousel: {
        container: 'bg-white rounded-lg overflow-hidden',
        imageOverlay: 'aspect-square',
        textOverlay: 'p-3 bg-white border-t',
        textPosition: 'flex-col',
        maxHeadline: 40,
        maxDescription: 125,
    },
    display: {
        container: 'bg-white rounded-lg overflow-hidden w-[300px]',
        imageOverlay: 'h-[250px]',
        textOverlay: 'p-2 bg-gray-100',
        textPosition: 'flex-col',
        maxHeadline: 30,
        maxDescription: 70,
    },
};

interface AdPreviewProps {
    ad: Ad;
    brand?: BrandIdentity;
    platform?: string;
}

export function AdPreview({ ad, brand, platform }: AdPreviewProps) {
    const [selectedPlatform, setSelectedPlatform] = useState(platform || 'facebook_feed');
    const [showLabels, setShowLabels] = useState(true);
    
    const platformConfig = PLATFORMS.find(p => p.id === selectedPlatform) || PLATFORMS[0];
    const colors = brand?.brandColors || ['#0d9488', '#2dd4bf'];
    const primaryColor = colors[0] || '#0d9488';
    
    const getFormatType = () => {
        if (selectedPlatform.includes('story')) return 'story';
        if (selectedPlatform.includes('carousel')) return 'carousel';
        if (selectedPlatform.includes('display')) return 'display';
        return 'feed';
    };
    
    const format = FORMAT_STYLES[getFormatType()];
    
    return (
        <div className="space-y-4">
            {/* Platform Selector */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                {PLATFORMS.map((p) => (
                    <button
                        key={p.id}
                        type="button"
                        onClick={() => setSelectedPlatform(p.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap flex items-center gap-2 transition-all ${
                            selectedPlatform === p.id
                                ? 'bg-teal-600 text-white'
                                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                    >
                        <p.icon className="w-3 h-3" style={{ color: selectedPlatform === p.id ? 'white' : p.color }} />
                        {p.label}
                    </button>
                ))}
            </div>
            
            {/* Preview */}
            <div className="flex justify-center">
                <div 
                    className={`${format.container} shadow-lg`}
                    style={{ 
                        width: platformConfig.width ? `${platformConfig.width}px` : '100%',
                        maxWidth: '400px',
                        height: platformConfig.height ? `${platformConfig.height}px` : undefined,
                    }}
                >
                    {/* Image/Video Area */}
                    <div className={`${format.imageOverlay} bg-slate-800 relative flex items-center justify-center`}>
                        {ad.assetUrls.length > 0 ? (
                            <img 
                                src={ad.assetUrls[0]} 
                                alt={ad.name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="text-center p-4">
                                <ImageIcon className="w-12 h-12 text-slate-600 mx-auto mb-2" />
                                {showLabels && (
                                    <p className="text-xs text-slate-500">Sube una imagen en el Media Hub</p>
                                )}
                            </div>
                        )}
                        
                        {/* Brand overlay for stories */}
                        {getFormatType() === 'story' && brand?.brandLogo && (
                            <div className="absolute top-4 left-4">
                                <img src={brand.brandLogo} alt="Logo" className="h-8 object-contain" />
                            </div>
                        )}
                        
                        {/* CTA button overlay */}
                        {format.textOverlay.includes('from-black') && ad.callToAction && (
                            <div className="absolute bottom-20 left-0 right-0 flex justify-center">
                                <button 
                                    className="px-4 py-2 rounded font-medium text-sm text-white"
                                    style={{ backgroundColor: primaryColor }}
                                >
                                    {ad.callToAction}
                                </button>
                            </div>
                        )}
                    </div>
                    
                    {/* Text Area */}
                    <div className={format.textOverlay}>
                        {showLabels && (
                            <>
                                <p className="font-semibold text-sm text-gray-900 line-clamp-2">
                                    {ad.headlines?.[0] || 'Tu headline aquí'}
                                </p>
                                <p className="text-xs text-gray-600 mt-1 line-clamp-3">
                                    {ad.descriptions?.[0] || 'Tu descripción aquí...'}
                                </p>
                            </>
                        )}
                        
                        {/* Meta info */}
                        {getFormatType() === 'feed' && (
                            <div className="flex items-center justify-between mt-2 pt-2 border-t">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-slate-200" />
                                    <span className="text-xs text-slate-500">{brand?.companyName || 'Tu Empresa'}</span>
                                </div>
                                <span className="text-xs text-slate-400">Sponsored</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            {/* Labels Toggle */}
            <div className="flex justify-center">
                <button
                    onClick={() => setShowLabels(!showLabels)}
                    className="text-xs text-slate-500 hover:text-slate-300"
                >
                    {showLabels ? 'Ocultar textos' : 'Mostrar textos'}
                </button>
            </div>
            
            {/* Ad Info */}
            {showLabels && (
                <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 bg-slate-800 rounded">
                        <span className="text-slate-500">Headline:</span>
                        <span className="text-white ml-1">{(ad.headlines?.[0] || '').length}/40</span>
                    </div>
                    <div className="p-2 bg-slate-800 rounded">
                        <span className="text-slate-500">Descripción:</span>
                        <span className="text-white ml-1">{(ad.descriptions?.[0] || '').length}/125</span>
                    </div>
                </div>
            )}
            
            {/* Brand Colors Preview */}
            {brand?.brandColors && brand.brandColors.length > 0 && (
                <div className="space-y-2">
                    <p className="text-xs text-slate-500">Colores de marca</p>
                    <div className="flex gap-1">
                        {brand.brandColors.map((color, idx) => (
                            <div 
                                key={idx}
                                className="w-8 h-8 rounded shadow-sm"
                                style={{ backgroundColor: color }}
                                title={color}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

interface AdPreviewModalProps {
    ad: Ad;
    brand?: BrandIdentity;
    open: boolean;
    onClose: () => void;
}

export function AdPreviewModal({ ad, brand, open, onClose }: AdPreviewModalProps) {
    if (!open) return null;
    
    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div 
                className="bg-slate-900 rounded-xl p-6 max-w-3xl w-full max-h-[90vh] overflow-auto"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white font-semibold">Vista Previa del Anuncio</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
                </div>
                <AdPreview ad={ad} brand={brand} />
            </div>
        </div>
    );
}
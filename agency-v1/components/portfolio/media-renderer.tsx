'use client';

import { useState } from 'react';
import { Play, Pause, FileText, Download, ExternalLink } from 'lucide-react';

interface MediaAsset {
    url: string;
    type?: 'image' | 'video' | 'document' | 'external' | string;
    name?: string;
    alt?: string;
    caption?: string;
    mimeType?: string;
    size?: number;
}

export function MediaRenderer({ asset, className = '' }: { asset: MediaAsset | string; className?: string }) {
    const [isPlaying, setIsPlaying] = useState(false);

    // Handle legacy string format
    const media: MediaAsset = typeof asset === 'string' ? { 
        url: asset, 
        type: asset.match(/\.(mp4|webm|mov)$/i) ? 'video' : 'image',
        alt: 'Portfolio asset' 
    } : asset;

    if (!media || !media.url) return null;

    // Intercept legacy Next.js static paths to bypass the 404 aggressive cache
    if (media.url.startsWith('/uploads/')) {
        media.url = media.url.replace('/uploads/', '/api/serve/');
    }

    // External Youtube / Vimeo
    if (media.type === 'external' || media.url.includes('youtube.com') || media.url.includes('youtu.be') || media.url.includes('vimeo.com')) {
        let embedUrl = media.url;
        
        // Basic YouTube conversion
        if (media.url.includes('youtube.com/watch?v=')) {
            embedUrl = media.url.replace('watch?v=', 'embed/');
        } else if (media.url.includes('youtu.be/')) {
            embedUrl = media.url.replace('youtu.be/', 'youtube.com/embed/');
        }

        return (
            <div className={`relative w-full aspect-video rounded-xl overflow-hidden bg-slate-950 border border-slate-800 ${className}`}>
                <iframe
                    src={embedUrl}
                    className="absolute inset-0 w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                />
                {media.caption && (
                    <div className="absolute bottom-0 inset-x-0 bg-black/80 backdrop-blur-md p-3 text-sm text-slate-300">
                        {media.caption}
                    </div>
                )}
            </div>
        );
    }

    if (media.type === 'video') {
        return (
            <div className={`relative w-full rounded-xl overflow-hidden bg-slate-950 border border-slate-800 group ${className}`}>
                <video
                    src={media.url}
                    controls
                    preload="metadata"
                    className="w-full h-auto max-h-[70vh] object-contain"
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                />
                {media.caption && (
                    <div className="absolute bottom-12 inset-x-0 bg-black/80 backdrop-blur-md p-3 text-sm text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity">
                        {media.caption}
                    </div>
                )}
            </div>
        );
    }

    if (media.type === 'document' || media.url.match(/\.(pdf|doc|docx|xls|xlsx)$/i)) {
        return (
            <div className={`flex flex-col items-center justify-center p-8 bg-slate-900 border border-slate-800 rounded-xl hover:border-teal-500/50 transition-colors ${className}`}>
                <div className="w-16 h-16 bg-blue-900/20 text-blue-500 rounded-full flex items-center justify-center mb-4">
                    <FileText className="w-8 h-8" />
                </div>
                <h4 className="text-lg font-bold text-slate-200 mb-2 truncate max-w-full">
                    {media.name || 'Document Asset'}
                </h4>
                {media.caption && <p className="text-sm text-slate-400 mb-6 text-center">{media.caption}</p>}
                
                <a 
                    href={media.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors font-medium text-sm"
                >
                    <Download className="w-4 h-4" />
                    Download File
                </a>
            </div>
        );
    }

    // Default: Image
    return (
        <div className={`relative w-full rounded-xl overflow-hidden bg-slate-950 border border-slate-800 group ${className}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src={media.url}
                alt={media.alt || media.name || 'Portfolio image'}
                className="w-full h-auto max-h-[80vh] object-contain"
                loading="lazy"
            />
            {media.caption && (
                <div className="absolute bottom-0 inset-x-0 bg-black/80 backdrop-blur-md p-4 text-sm text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-2 group-hover:translate-y-0">
                    <p className="font-medium text-white">{media.name}</p>
                    <p className="mt-1">{media.caption}</p>
                </div>
            )}
        </div>
    );
}

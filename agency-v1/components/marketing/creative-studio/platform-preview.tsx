'use client';

import { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

type Platform = 'FACEBOOK_FEED' | 'INSTAGRAM_STORY' | 'TIKTOK_FEED' | 'LINKEDIN_FEED';

// ─── ANIMATED SCROLL FEED SIMULATION ─────────────────────────────────────────

function scrollFeedAnim() {
    return `
    @keyframes feedScroll {
        0%   { transform: translateY(0); }
        30%  { transform: translateY(-30px); }
        60%  { transform: translateY(-30px); }
        90%  { transform: translateY(0); }
        100% { transform: translateY(0); }
    }
    @keyframes storyPulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.7; }
    }
    @keyframes typingDots {
        0%,80%,100% { transform: scale(0); }
        40% { transform: scale(1); }
    }
    @keyframes heartBeat {
        0%  { transform: scale(1); }
        14% { transform: scale(1.3); }
        28% { transform: scale(1); }
        42% { transform: scale(1.3); }
        70% { transform: scale(1); }
    }
    `;
}

// ─── MOCKUP COMPONENTS ────────────────────────────────────────────────────────

function FacebookMockup({ imageUrl, headline, description }: { imageUrl?: string; headline?: string; description?: string }) {
    return (
        <div className="bg-white rounded-2xl shadow-2xl w-80 font-sans overflow-hidden select-none">
            <style>{scrollFeedAnim()}</style>
            {/* Simulated scroll context */}
            <div style={{ animation: 'feedScroll 4s ease-in-out infinite' }}>
                {/* Ghost post above */}
                <div className="p-3 opacity-30 pointer-events-none">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-7 h-7 rounded-full bg-gray-300" />
                        <div className="space-y-1"><div className="h-2 w-24 bg-gray-200 rounded" /><div className="h-1.5 w-16 bg-gray-100 rounded" /></div>
                    </div>
                    <div className="h-24 bg-gray-100 rounded-lg" />
                </div>
                {/* ACTUAL AD */}
                <div className="border-t border-gray-100">
                    <div className="flex items-center gap-2 p-3">
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">M</div>
                        <div>
                            <p className="text-xs font-semibold text-gray-900 leading-none">Tu Empresa</p>
                            <p className="text-[10px] text-gray-400 mt-0.5">Publicidad · 🌐</p>
                        </div>
                        <div className="ml-auto text-gray-400 text-lg">···</div>
                    </div>
                    {description && <p className="px-3 pb-2 text-xs text-gray-700 leading-snug">{description}</p>}
                    <div className="relative aspect-square bg-gradient-to-br from-violet-400 to-indigo-600">
                        {imageUrl && <Image src={imageUrl} alt="Ad" fill className="object-cover" unoptimized />}
                        <div className="absolute top-2 right-2 bg-black/20 text-white text-[9px] px-2 py-0.5 rounded-full backdrop-blur-sm">Patrocinado</div>
                    </div>
                    <div className="p-3 border-t border-gray-100 flex items-center justify-between">
                        <div className="min-w-0 pr-2">
                            <p className="text-[10px] text-gray-400 uppercase tracking-wide">tudominio.com</p>
                            <p className="text-sm font-bold text-gray-900 leading-tight truncate">{headline ?? 'Tu titular aquí'}</p>
                        </div>
                        <button className="bg-[#1877F2] text-white text-xs px-3 py-1.5 rounded-lg font-bold whitespace-nowrap shadow-sm hover:bg-blue-700 transition-colors">Más info</button>
                    </div>
                    {/* Reactions bar */}
                    <div className="px-3 py-2 flex items-center justify-between border-t border-gray-50 text-gray-500 text-xs">
                        <div className="flex items-center gap-1">
                            <span>👍 ❤️</span><span className="text-[10px]">1.2K</span>
                        </div>
                        <div className="flex gap-3 text-[10px]">
                            <span>248 comentarios</span>
                            <span>56 compartir</span>
                        </div>
                    </div>
                </div>
                {/* Ghost post below */}
                <div className="p-3 opacity-30 pointer-events-none">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-7 h-7 rounded-full bg-gray-300" />
                        <div className="space-y-1"><div className="h-2 w-20 bg-gray-200 rounded" /><div className="h-1.5 w-14 bg-gray-100 rounded" /></div>
                    </div>
                    <div className="h-32 bg-gray-100 rounded-lg" />
                </div>
            </div>
        </div>
    );
}

function InstagramStoryMockup({ imageUrl, callToAction }: { imageUrl?: string; callToAction?: string }) {
    return (
        <div className="relative w-64 rounded-3xl overflow-hidden shadow-2xl select-none bg-black" style={{ aspectRatio: '9/16' }}>
            <style>{scrollFeedAnim()}</style>
            {imageUrl
                ? <Image src={imageUrl} alt="Story" fill className="object-cover" unoptimized />
                : <div className="absolute inset-0 bg-gradient-to-b from-violet-800 via-violet-600 to-pink-600" />
            }
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60" />
            {/* Top UI */}
            <div className="absolute top-3 left-3 right-3">
                <div className="flex gap-1 mb-2">
                    {[100, 30, 0].map((w, i) => (
                        <div key={i} className="flex-1 h-0.5 rounded-full overflow-hidden bg-white/30">
                            <div className="h-full bg-white rounded-full" style={{ width: `${w}%`, animation: i === 1 ? 'feedScroll 5s linear infinite' : undefined }} />
                        </div>
                    ))}
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full border-2 border-white" style={{ background: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)' }} />
                    <div>
                        <p className="text-white text-xs font-semibold leading-none">Tu Empresa</p>
                        <p className="text-white/60 text-[9px]">Publicidad</p>
                    </div>
                    <div className="ml-auto text-white text-xs px-2 py-0.5 border border-white/30 rounded-full backdrop-blur-sm">Seguir</div>
                </div>
            </div>
            {/* Bottom CTA */}
            <div className="absolute bottom-6 left-0 right-0 flex flex-col items-center gap-1">
                <div className="flex flex-col items-center" style={{ animation: 'storyPulse 2s ease-in-out infinite' }}>
                    <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center mb-0.5">
                        <span className="text-white text-xs">↑</span>
                    </div>
                    <span className="text-white text-xs font-semibold drop-shadow">{callToAction ?? 'Desliza arriba'}</span>
                </div>
            </div>
        </div>
    );
}

function TikTokMockup({ imageUrl, headline }: { imageUrl?: string; headline?: string }) {
    const [liked, setLiked] = useState(false);
    return (
        <div className="relative w-64 rounded-2xl overflow-hidden shadow-2xl select-none bg-black" style={{ aspectRatio: '9/16' }}>
            <style>{scrollFeedAnim()}</style>
            {imageUrl
                ? <Image src={imageUrl} alt="TikTok" fill className="object-cover" unoptimized />
                : <div className="absolute inset-0 bg-gradient-to-b from-gray-900 to-black" />
            }
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60" />
            {/* Top bar */}
            <div className="absolute top-3 left-0 right-0 flex items-center justify-center">
                <div className="flex gap-6 text-white/70 text-xs">
                    <span>Siguiendo</span><span className="text-white font-bold border-b border-white pb-0.5">Para ti</span><span>En vivo</span>
                </div>
            </div>
            {/* Side actions */}
            <div className="absolute right-3 bottom-20 flex flex-col items-center gap-4">
                <div className="w-10 h-10 rounded-full border-2 border-white overflow-hidden bg-gray-700">
                    <div className="w-full h-full bg-gradient-to-br from-violet-500 to-pink-500" />
                </div>
                <div className="flex flex-col items-center gap-1">
                    <button onClick={() => setLiked((l) => !l)}
                        style={{ animation: liked ? 'heartBeat 0.3s ease-in-out' : undefined }}>
                        <span className="text-2xl">{liked ? '❤️' : '🤍'}</span>
                    </button>
                    <span className="text-white text-[10px]">{liked ? '2.4K' : '2.3K'}</span>
                </div>
                {[{ icon: '💬', n: '183' }, { icon: '↗️', n: '48' }, { icon: '⊕', n: '' }].map(({ icon, n }) => (
                    <div key={icon} className="flex flex-col items-center gap-0.5">
                        <span className="text-xl">{icon}</span>
                        {n && <span className="text-white text-[10px]">{n}</span>}
                    </div>
                ))}
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center" style={{ animation: 'feedScroll 3s linear infinite' }}>
                    <span className="text-xs">🎵</span>
                </div>
            </div>
            {/* Bottom text */}
            <div className="absolute bottom-4 left-3 right-14">
                <p className="text-white text-[11px] font-bold mb-0.5">@tuempresa · <span className="font-normal opacity-70 text-[10px]">Publicidad</span></p>
                <p className="text-white text-xs leading-snug line-clamp-2">{headline ?? 'Tu mensaje viral aquí 🔥'}</p>
                <div className="flex items-center gap-1 mt-1">
                    <span className="text-[10px] text-white/70">🎵 Sonido original</span>
                </div>
            </div>
            <div className="absolute top-3 right-3 bg-black/30 text-white text-[9px] px-2 py-0.5 rounded-full backdrop-blur-sm">Patrocinado</div>
        </div>
    );
}

function LinkedInMockup({ imageUrl, headline }: { imageUrl?: string; headline?: string }) {
    return (
        <div className="bg-white rounded-xl shadow-2xl w-80 font-sans overflow-hidden select-none">
            <style>{scrollFeedAnim()}</style>
            <div style={{ animation: 'feedScroll 4s ease-in-out infinite 0.5s' }}>
                <div className="p-3 opacity-25 pointer-events-none border-b">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-full bg-blue-800" /><div className="space-y-1"><div className="h-2 w-28 bg-gray-200 rounded" /><div className="h-1.5 w-20 bg-gray-100 rounded" /></div>
                    </div>
                    <div className="h-24 bg-gray-100 rounded" />
                </div>
                <div className="p-3">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-10 h-10 rounded-full bg-blue-700 flex items-center justify-center text-white font-bold">T</div>
                        <div>
                            <p className="text-sm font-semibold text-gray-900">Tu Empresa</p>
                            <p className="text-[10px] text-gray-400">Publicidad · 24.000 seguidores</p>
                        </div>
                        <button className="ml-auto text-blue-700 text-xs font-bold border border-blue-700 px-2.5 py-0.5 rounded-full hover:bg-blue-50">+ Seguir</button>
                    </div>
                    <div className="relative aspect-video bg-blue-900 rounded-lg overflow-hidden mb-3">
                        {imageUrl ? <Image src={imageUrl} alt="" fill className="object-cover" unoptimized /> : <div className="absolute inset-0 bg-gradient-to-br from-blue-700 to-blue-900" />}
                    </div>
                    <p className="text-sm font-semibold text-gray-900 leading-snug mb-2">{headline ?? 'Tu titular profesional aquí'}</p>
                    <button className="border border-blue-600 text-blue-600 text-xs px-4 py-1.5 rounded-full font-semibold hover:bg-blue-50 transition-colors">Más información</button>
                    <div className="mt-3 pt-3 border-t border-gray-100 flex gap-4 text-xs text-gray-400">
                        <span>👍 Me gusta</span><span>💬 Comentar</span><span>↗️ Compartir</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

interface PlatformPreviewProps {
    imageUrl?: string;
    headline?: string;
    description?: string;
    callToAction?: string;
}

const PLATFORMS: { key: Platform; label: string; icon: string }[] = [
    { key: 'FACEBOOK_FEED', label: 'Meta Feed', icon: '📘' },
    { key: 'INSTAGRAM_STORY', label: 'Story/Reel', icon: '📸' },
    { key: 'TIKTOK_FEED', label: 'TikTok', icon: '🎵' },
    { key: 'LINKEDIN_FEED', label: 'LinkedIn', icon: '💼' },
];

export function PlatformPreview({ imageUrl, headline, description, callToAction }: PlatformPreviewProps) {
    const [platform, setPlatform] = useState<Platform>('FACEBOOK_FEED');
    const [animated, setAnimated] = useState(true);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex gap-2 flex-wrap">
                    {PLATFORMS.map((p) => (
                        <button key={p.key} type="button" onClick={() => setPlatform(p.key)}
                            className={cn('px-3 py-1.5 rounded-lg text-xs font-medium border transition-all flex items-center gap-1.5',
                                platform === p.key ? 'border-violet-500 bg-violet-500/20 text-violet-300' : 'border-white/10 text-gray-400 hover:border-white/20')}>
                            {p.icon} {p.label}
                        </button>
                    ))}
                </div>
                <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
                    <div onClick={() => setAnimated((a) => !a)}
                        className={cn('w-9 h-5 rounded-full transition-colors relative cursor-pointer', animated ? 'bg-violet-600' : 'bg-white/10')}>
                        <div className={cn('absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all', animated ? 'left-4' : 'left-0.5')} />
                    </div>
                    Animado
                </label>
            </div>

            <div className={cn('flex justify-center py-4', !animated && '[&_*]:animation-none')}>
                {platform === 'FACEBOOK_FEED' && <FacebookMockup imageUrl={imageUrl} headline={headline} description={description} />}
                {platform === 'INSTAGRAM_STORY' && <InstagramStoryMockup imageUrl={imageUrl} callToAction={callToAction} />}
                {platform === 'TIKTOK_FEED' && <TikTokMockup imageUrl={imageUrl} headline={headline} />}
                {platform === 'LINKEDIN_FEED' && <LinkedInMockup imageUrl={imageUrl} headline={headline} />}
            </div>

            <p className="text-center text-xs text-gray-600">Preview interactivo. Dimensiones reales validadas al lanzar.</p>
        </div>
    );
}

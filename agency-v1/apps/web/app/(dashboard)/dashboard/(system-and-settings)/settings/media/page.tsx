import { Metadata } from "next";
import Link from "next/link";
import { 
    Wand2, Image as ImageIcon, Share2, Video, Mic, Settings, ArrowRight, ShieldCheck, 
    Layers, Globe, Sparkles, Sliders
} from "lucide-react";

export const metadata: Metadata = {
    title: "Configuración de Contenido & Media | LegacyMark",
    description: "Parámetros de renderizado, CDN de medios, perfiles sociales y marcas de agua.",
};

export default function MediaSettingsPage() {
    const settingsCards = [
        {
            title: "Perfiles Sociales del Visualizador",
            desc: "Configura links, nombres y credenciales públicas de perfiles sociales en el muro y portafolio.",
            href: "/dashboard/settings/social-profiles",
            icon: Share2,
            badge: "Social",
        },
        {
            title: "Bóveda de Medios & Almacenamiento CDN",
            desc: "Administra cuotas de subida, formatos permitidos (WebP/MP4) y compresión de archivos multimedia.",
            href: "/dashboard/media",
            icon: ImageIcon,
            badge: "Assets",
        },
        {
            title: "Creative Studio IA & Parámetros Generativos",
            desc: "Motores generativos para copys publicitarios, banners con IA y optimización de prompts.",
            href: "/dashboard/admin/marketing/creative-studio",
            icon: Sparkles,
            badge: "GenAI",
        },
        {
            title: "Estudio de Síntesis de Voz (Voicebox)",
            desc: "Voces neuronales configuradas, muestreo de audio y cuotas de texto a voz multilingüe.",
            href: "/dashboard/voice",
            icon: Mic,
            badge: "Audio AI",
        },
        {
            title: "Video Studio Pro & Render Engine",
            desc: "Presets de formato vertical 9:16 para Reels y TikTok, subtitulado automático y marcas de agua.",
            href: "/dashboard/video",
            icon: Video,
            badge: "Video 9:16",
        },
        {
            title: "Marca de Agua y Branding Corporativo",
            desc: "Aplica logotipos y firmas de marca blanca automáticamente en las publicaciones del muro.",
            href: "/dashboard/settings/company",
            icon: Globe,
            badge: "Branding",
        }
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-300 pb-12 max-w-6xl mx-auto px-4 sm:px-6 py-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
                <div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">
                        <span>Área de Contenido</span>
                        <span className="text-slate-700">/</span>
                        <span className="text-pink-400 font-bold">Configuración de Media</span>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-3">
                        <Settings className="w-7 h-7 text-pink-400" />
                        Configuración de Contenido & Media
                    </h1>
                    <p className="text-sm text-slate-400 mt-2 max-w-2xl">
                        Ajusta parámetros de almacenamiento multimedia, motores de renderizado de video, voces neuronales y vinculación de perfiles sociales.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-pink-500/10 text-pink-400 border border-pink-500/20">
                        <ShieldCheck className="w-3.5 h-3.5" /> Media Engine Activo
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {settingsCards.map((card) => {
                    const Icon = card.icon;
                    return (
                        <Link
                            key={card.href}
                            href={card.href}
                            className="group relative flex flex-col justify-between p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-pink-500/40 hover:bg-slate-900/90 transition-all duration-200 shadow-lg hover:shadow-pink-500/5 hover:-translate-y-0.5"
                        >
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                                        {card.badge}
                                    </span>
                                </div>
                                <h3 className="text-base font-bold text-white group-hover:text-pink-300 transition-colors">
                                    {card.title}
                                </h3>
                                <p className="text-xs text-slate-400 leading-relaxed">
                                    {card.desc}
                                </p>
                            </div>

                            <div className="pt-4 mt-4 border-t border-slate-800/60 flex items-center justify-between text-xs font-semibold text-pink-400 group-hover:text-pink-300">
                                <span>Administrar regla</span>
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}

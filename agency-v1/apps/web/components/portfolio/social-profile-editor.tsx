"use client";

import { useState } from "react";
import { upsertSocialProfile, SocialProfileData } from "@/actions/social-profiles";
import { Instagram, Facebook, Smartphone, Save, Loader2, CheckCircle, Globe, Users, Heart } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const PLATFORMS: { key: SocialProfileData["platform"]; label: string; icon: React.ReactNode; color: string }[] = [
    { key: "instagram", label: "Instagram", icon: <Instagram className="w-4 h-4" />, color: "from-pink-500 to-orange-400" },
    { key: "tiktok",   label: "TikTok",    icon: <Smartphone className="w-4 h-4" />, color: "from-slate-900 to-slate-700" },
    { key: "facebook", label: "Facebook",  icon: <Facebook className="w-4 h-4" />,  color: "from-blue-600 to-blue-400" },
];

const DEFAULTS: Record<string, Partial<SocialProfileData>> = {
    instagram: { followersCount: 0, followingCount: 0, emoji: "😎" },
    tiktok:    { followersCount: 0, followingCount: 0, emoji: "🎬" },
    facebook:  { followersCount: 0, followingCount: 0, emoji: "👍" },
};

type ProfileFormState = {
    username: string;
    displayName: string;
    avatarUrl: string;
    bio: string;
    website: string;
    followersCount: string;
    followingCount: string;
    emoji: string;
};

const EMPTY: ProfileFormState = {
    username: "", displayName: "", avatarUrl: "",
    bio: "", website: "", followersCount: "0", followingCount: "0", emoji: "😎",
};

interface SocialProfileEditorProps {
    initialProfiles?: Array<{ platform: string; username: string; displayName: string; avatarUrl: string | null; bio: string | null; website: string | null; followersCount: number; followingCount: number; emoji: string | null }>;
}

/**
 * Premium HUD Social Profile Editor.
 * Allows agencies to configure the dynamic data shown in public mockups.
 */
export function SocialProfileEditor({ initialProfiles = [] }: SocialProfileEditorProps) {
    const [activePlatform, setActivePlatform] = useState<SocialProfileData["platform"]>("instagram");
    const [loading, setLoading] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const buildInitial = (platform: string): ProfileFormState => {
        const existing = initialProfiles.find(p => p.platform === platform);
        if (!existing) return { ...EMPTY, ...DEFAULTS[platform], emoji: DEFAULTS[platform]?.emoji || "😎" };
        return {
            username: existing.username,
            displayName: existing.displayName,
            avatarUrl: existing.avatarUrl || "",
            bio: existing.bio || "",
            website: existing.website || "",
            followersCount: String(existing.followersCount),
            followingCount: String(existing.followingCount),
            emoji: existing.emoji || "😎",
        };
    };

    const [forms, setForms] = useState<Record<string, ProfileFormState>>({
        instagram: buildInitial("instagram"),
        tiktok:    buildInitial("tiktok"),
        facebook:  buildInitial("facebook"),
    });

    const currentForm = forms[activePlatform];
    const setField = (field: keyof ProfileFormState, value: string) => {
        setForms(prev => ({ ...prev, [activePlatform]: { ...prev[activePlatform], [field]: value } }));
    };

    const handleSave = async () => {
        setLoading(true);
        setError(null);
        setSaved(false);
        const result = await upsertSocialProfile({
            platform: activePlatform,
            username: currentForm.username,
            displayName: currentForm.displayName,
            avatarUrl: currentForm.avatarUrl || undefined,
            bio: currentForm.bio || undefined,
            website: currentForm.website || undefined,
            followersCount: parseInt(currentForm.followersCount) || 0,
            followingCount: parseInt(currentForm.followingCount) || 0,
            emoji: currentForm.emoji || "😎",
        });
        setLoading(false);
        if (result.success) {
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } else {
            setError(result.error || "Error al guardar");
        }
    };

    const InputField = ({ label, field, placeholder, type = "text", icon: Icon }: { label: string; field: keyof ProfileFormState; placeholder: string; type?: string; icon?: any }) => (
        <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                {Icon && <Icon className="w-3 h-3 text-slate-600" />}
                {label}
            </label>
            <input
                type={type}
                value={currentForm[field]}
                onChange={e => setField(field, e.target.value)}
                placeholder={placeholder}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-200 placeholder:text-slate-700 focus:outline-none focus:border-teal-500/50 transition-all font-medium"
            />
        </div>
    );

    return (
        <div className="bg-[#0d1117] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in duration-500">
            {/* Header */}
            <div className="px-8 py-6 border-b border-slate-800 bg-[#161b22]/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-teal-500/10 rounded-2xl border border-teal-500/20">
                        <Smartphone className="w-5 h-5 text-teal-400" />
                    </div>
                    <div>
                        <h3 className="font-mono font-black text-white text-base tracking-tight uppercase">Datos de Redes Sociales</h3>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Control dinámico para simuladores de redes</p>
                    </div>
                </div>
                {saved && (
                    <Badge className="bg-teal-500/20 text-teal-400 border-teal-500/30 px-4 py-1.5 animate-in slide-in-from-right-4 duration-300">
                        <CheckCircle className="w-3 h-3 mr-2" />
                        ¡CAMBIOS SINCRONIZADOS!
                    </Badge>
                )}
            </div>

            {/* Platform Selector Tabs */}
            <div className="flex bg-[#0a0f1a] p-2 gap-2">
                {PLATFORMS.map(({ key, label, icon }) => (
                    <button
                        key={key}
                        type="button"
                        onClick={() => setActivePlatform(key)}
                        className={`flex-1 flex items-center justify-center gap-3 py-3 rounded-xl transition-all duration-300 group ${
                            activePlatform === key
                                ? "bg-teal-500 text-slate-950 shadow-[0_0_20px_rgba(20,184,166,0.2)]"
                                : "text-slate-500 hover:text-slate-300 hover:bg-slate-900"
                        }`}
                    >
                        <div className={`p-1.5 rounded-lg transition-colors ${activePlatform === key ? "bg-slate-950/20" : "bg-slate-800/50 group-hover:bg-slate-800"}`}>
                            {icon}
                        </div>
                        <span className="text-[11px] font-black uppercase tracking-[0.1em]">{label}</span>
                    </button>
                ))}
            </div>

            {/* Form Content */}
            <div className="p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <InputField label="Usuario (@handle)" field="username" placeholder="@tu_agencia" icon={Users} />
                    <InputField label="Nombre a Mostrar" field="displayName" placeholder="Tu Agencia · Mkt" icon={Smartphone} />
                    <InputField label="Emoji de Perfil" field="emoji" placeholder="😎" />
                    <InputField label="URL Foto de Perfil" field="avatarUrl" placeholder="https://..." icon={Globe} />
                    <InputField label="Seguidores" field="followersCount" placeholder="13.6K" type="number" icon={Heart} />
                    <InputField label="Siguiendo" field="followingCount" placeholder="261" type="number" icon={Users} />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField label="Biografía Corta" field="bio" placeholder="Escribe tu bio dinámica aquí..." />
                    <InputField label="Enlace del Perfil" field="website" placeholder="www.tuagencia.com" icon={Globe} />
                </div>

                {error && (
                    <div className="bg-red-950/20 border border-red-900/40 rounded-2xl p-4 flex items-center gap-3 animate-in shake duration-300">
                        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                        <p className="text-xs font-bold text-red-400 uppercase tracking-widest">{error}</p>
                    </div>
                )}

                <div className="flex gap-4 pt-4">
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={loading}
                        className="flex-1 flex items-center justify-center gap-3 py-4 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs uppercase tracking-[0.2em] rounded-2xl transition-all disabled:opacity-50 shadow-[0_4px_25px_rgba(20,184,166,0.2)] active:scale-[0.98]"
                    >
                        {loading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : saved ? (
                            <CheckCircle className="w-4 h-4" />
                        ) : (
                            <Save className="w-4 h-4" />
                        )}
                        {loading ? "Sincronizando..." : saved ? "Información Guardada" : `Guardar Cambios ${activePlatform}`}
                    </button>
                    
                    <button
                        type="button"
                        onClick={() => window.open('/es/portfolio', '_blank')}
                        className="px-8 py-4 bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 font-bold text-[10px] uppercase tracking-widest rounded-2xl transition-all"
                    >
                        Ver Live
                    </button>
                </div>
            </div>

            {/* Footer / Tip */}
            <div className="px-8 py-4 bg-slate-950/50 border-t border-slate-800">
                <p className="text-[9px] font-medium text-slate-600 uppercase tracking-[0.15em] leading-relaxed">
                    Nota: Los cambios realizados aquí se verán reflejados instantáneamente en el Grid Real-Time Visualizer de tu portafolio público.
                </p>
            </div>
        </div>
    );
}

// Simple AlertCircle fallback since it was missing in the copy context but used in the logic
function AlertCircle(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
    );
}

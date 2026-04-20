"use client";

import { useState } from "react";
import { upsertSocialProfile, SocialProfileData } from "@/actions/social-profiles";
import { Instagram, Facebook, Smartphone, Save, Loader2, CheckCircle } from "lucide-react";

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

export function SocialProfileEditor({ initialProfiles = [] }: SocialProfileEditorProps) {
    const [activePlatform, setActivePlatform] = useState<SocialProfileData["platform"]>("instagram");
    const [loading, setLoading] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Build initial form states from DB data
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

    const InputField = ({ label, field, placeholder, type = "text" }: { label: string; field: keyof ProfileFormState; placeholder: string; type?: string }) => (
        <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</label>
            <input
                type={type}
                value={currentForm[field]}
                onChange={e => setField(field, e.target.value)}
                placeholder={placeholder}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-teal-500 transition-colors"
            />
        </div>
    );

    return (
        <div className="bg-[#0a0f1a] border border-slate-800 rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                <div>
                    <h3 className="font-bold text-slate-100 text-base">Perfiles de Redes Sociales</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Personaliza los datos que aparecen en el visualizador público</p>
                </div>
            </div>

            {/* Platform tabs */}
            <div className="flex border-b border-slate-800">
                {PLATFORMS.map(({ key, label, icon, color }) => (
                    <button
                        key={key}
                        type="button"
                        onClick={() => setActivePlatform(key)}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold transition-all ${
                            activePlatform === key
                                ? "text-white border-b-2 border-teal-500 bg-slate-900/50"
                                : "text-slate-500 hover:text-slate-300"
                        }`}
                    >
                        {icon}
                        {label}
                    </button>
                ))}
            </div>

            {/* Form */}
            <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField label="Usuario (@handle)" field="username" placeholder="@tu_agencia" />
                    <InputField label="Nombre a Mostrar" field="displayName" placeholder="Tu Agencia · Marketing" />
                    <InputField label="Emoji de Avatar" field="emoji" placeholder="😎" />
                    <InputField label="URL Foto de Perfil" field="avatarUrl" placeholder="https://..." />
                    <InputField label="Seguidores" field="followersCount" placeholder="13600" type="number" />
                    <InputField label="Siguiendo" field="followingCount" placeholder="261" type="number" />
                </div>
                <InputField label="Bio" field="bio" placeholder="🚀 Tu descripción aquí..." />
                <InputField label="Sitio Web" field="website" placeholder="https://legacymarksas.com" />

                {error && (
                    <div className="bg-red-950/30 border border-red-900/50 rounded-lg px-4 py-2.5 text-red-400 text-xs">{error}</div>
                )}

                <button
                    type="button"
                    onClick={handleSave}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm rounded-xl transition-all disabled:opacity-60"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                    {loading ? "Guardando..." : saved ? "¡Guardado!" : `Guardar perfil de ${activePlatform}`}
                </button>
            </div>
        </div>
    );
}

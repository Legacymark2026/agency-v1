"use client";

import { useState, useEffect, useTransition } from "react";
import { Palette, Moon, Sun, Monitor, Zap, AlignJustify, Type, Check } from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { useUIStore, AccentColor, Density, FontType, BgTheme } from "@/lib/stores/ui-store";

const THEMES = [
    { key: "dark", label: "HUD Dark", desc: "Slate-950 background, teal accents", icon: <Moon className="w-4 h-4" />, preview: "bg-slate-950 border-teal-500/40" },
    { key: "light", label: "Corporate Light", desc: "White background, professional look", icon: <Sun className="w-4 h-4" />, preview: "bg-white border-slate-300" },
    { key: "system", label: "Sistema", desc: "Sigue la preferencia del dispositivo", icon: <Monitor className="w-4 h-4" />, preview: "bg-gradient-to-br from-slate-950 to-white border-slate-500" },
];

const DENSITIES = [
    { key: "compact", label: "Compacto", desc: "Más información en pantalla" },
    { key: "normal", label: "Normal", desc: "Balance óptimo" },
    { key: "comfortable", label: "Cómodo", desc: "Mayor espacio entre elementos" },
];

const ACCENT_COLORS = [
    { key: "teal", label: "Teal", bg: "bg-teal-500", border: "border-teal-500", ring: "ring-teal-500" },
    { key: "violet", label: "Violeta", bg: "bg-violet-500", border: "border-violet-500", ring: "ring-violet-500" },
    { key: "blue", label: "Azul", bg: "bg-blue-500", border: "border-blue-500", ring: "ring-blue-500" },
    { key: "amber", label: "Ámbar", bg: "bg-amber-500", border: "border-amber-500", ring: "ring-amber-500" },
    { key: "rose", label: "Rosa", bg: "bg-rose-500", border: "border-rose-500", ring: "ring-rose-500" },
    { key: "emerald", label: "Esmeralda", bg: "bg-emerald-500", border: "border-emerald-500", ring: "ring-emerald-500" },
];

const FONTS = [
    { key: "inter", label: "Inter", preview: "Modern & Clean" },
    { key: "roboto", label: "Roboto", preview: "Classic Google" },
    { key: "jetbrains", label: "JetBrains Mono", preview: "Data-focused" },
    { key: "geist", label: "Geist", preview: "Developer-first" },
];

const BG_THEMES = [
    { key: "slate", label: "Sleek Slate", desc: "Gris azulado (Predeterminado)", preview: "bg-slate-950 border-slate-800" },
    { key: "amoled", label: "AMOLED Black", desc: "Negro absoluto de alto contraste", preview: "bg-black border-zinc-900" },
    { key: "zinc", label: "Carbon Zinc", desc: "Gris carbón neutro moderno", preview: "bg-zinc-950 border-zinc-800" },
    { key: "indigo", label: "Midnight Indigo", desc: "Azul noche con tintes cósmicos", preview: "bg-[rgb(3,3,20)] border-indigo-950" },
    { key: "forest", label: "Obsidian Forest", desc: "Verde oliva profundo orgánico", preview: "bg-[rgb(2,8,4)] border-emerald-950" },
];

function SectionCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
    return (
        <div className="bg-[var(--ds-surface)] border border-[var(--ds-border)] rounded-[0.15rem] overflow-hidden backdrop-blur-md">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--ds-border)] bg-[var(--ds-surface-2)]/30">
                <div className="p-2 bg-[var(--ds-surface-2)] border border-[var(--ds-border)] rounded-[0.15rem] text-[var(--ds-teal)]">{icon}</div>
                <h3 className="text-sm font-semibold text-[var(--ds-text-primary)]">{title}</h3>
            </div>
            <div className="p-5">{children}</div>
        </div>
    );
}

export default function AppearancePage() {
    const { theme, setTheme } = useTheme();
    const { 
        accent, setAccent, 
        density, setDensity, 
        font, setFont, 
        bgTheme, setBgTheme,
        sidebarCollapsed, setSidebarCollapsed, 
        animationsEnabled, setAnimationsEnabled 
    } = useUIStore();
    
    const [isPending, startTransition] = useTransition();
    const [mounted, setMounted] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Prevent hydration mismatch
    if (!mounted) return null;

    const handleSave = async () => {
        setIsSaving(true);
        await new Promise(r => setTimeout(r, 600));
        setIsSaving(false);
        toast.success("Preferencias de apariencia guardadas");
    };

    return (
        <div className="space-y-6 pb-10">
            {/* Header */}
            <div>
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-[0.15rem] bg-[var(--ds-teal-dim)] border border-[var(--ds-border-glow)] text-[var(--ds-teal)] text-xs font-mono mb-3">
                    <Palette className="w-3.5 h-3.5" /> PERSONALIZACIÓN VISUAL
                </div>
                <h2 className="text-2xl font-bold text-[var(--ds-text-primary)] tracking-tight">Apariencia</h2>
                <p className="text-[var(--ds-text-secondary)] text-sm mt-1">Personaliza el tema, tipografía y densidad de la interfaz.</p>
            </div>

            {/* Themes */}
            <SectionCard title="Tema de la Interfaz" icon={<Moon className="w-4 h-4 text-[var(--ds-teal)]" />}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {THEMES.map(t => (
                        <button key={t.key} onClick={() => startTransition(() => setTheme(t.key))}
                            className={`relative p-4 rounded-[0.15rem] border text-left transition-all ${theme === t.key ? "border-[var(--ds-teal-md)] bg-[var(--ds-teal-dim)] ring-1 ring-[var(--ds-teal-md)]" : "border-[var(--ds-border)] hover:border-[var(--ds-border-glow)] bg-[var(--ds-surface-2)]/20"}`}>
                            {/* Preview */}
                            <div className={`h-16 rounded-[0.15rem] ${t.preview} border mb-3 flex items-center justify-center`}>
                                <div className={`text-2xl ${t.key === "light" ? "text-slate-700" : "text-slate-100"}`}>{t.icon}</div>
                            </div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-semibold text-[var(--ds-text-primary)]">{t.label}</p>
                                    <p className="text-xs text-[var(--ds-text-muted)] mt-0.5">{t.desc}</p>
                                </div>
                                {theme === t.key && <Check className="w-4 h-4 text-[var(--ds-teal-bright)] shrink-0" />}
                            </div>
                        </button>
                    ))}
                </div>
            </SectionCard>

            {/* Background Theme */}
            <SectionCard title="Tema de Fondo" icon={<Palette className="w-4 h-4 text-[var(--ds-teal)]" />}>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                    {BG_THEMES.map(b => (
                        <button key={b.key} onClick={() => startTransition(() => setBgTheme(b.key as BgTheme))}
                            className={`relative p-3 rounded-[0.15rem] border text-left transition-all ${bgTheme === b.key ? "border-[var(--ds-teal-md)] bg-[var(--ds-teal-dim)] ring-1 ring-[var(--ds-teal-md)]" : "border-[var(--ds-border)] hover:border-[var(--ds-border-glow)] bg-[var(--ds-surface-2)]/20"}`}>
                            {/* Preview */}
                            <div className={`h-12 rounded-[0.15rem] ${b.preview} border mb-2 flex items-center justify-center`} />
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-semibold text-[var(--ds-text-primary)]">{b.label}</p>
                                    <p className="text-[10px] text-[var(--ds-text-muted)] mt-0.5 leading-tight">{b.desc}</p>
                                </div>
                                {bgTheme === b.key && <Check className="w-3.5 h-3.5 text-[var(--ds-teal-bright)] shrink-0 ml-1" />}
                            </div>
                        </button>
                    ))}
                </div>
            </SectionCard>

            {/* Accent Colors */}
            <SectionCard title="Color de Acento" icon={<Palette className="w-4 h-4 text-[var(--ds-teal)]" />}>
                <div className="flex flex-wrap gap-3">
                    {ACCENT_COLORS.map(c => (
                        <button key={c.key} onClick={() => startTransition(() => setAccent(c.key as AccentColor))} className="group flex flex-col items-center gap-2">
                            <div className={`w-9 h-9 rounded-[0.15rem] ${c.bg} transition-all group-hover:scale-110 ${accent === c.key ? "ring-2 ring-offset-2 ring-offset-[var(--ds-bg)] " + c.ring : ""}`}>
                                {accent === c.key && <div className="w-full h-full flex items-center justify-center"><Check className="w-4 h-4 text-white" /></div>}
                            </div>
                            <span className="text-xs text-[var(--ds-text-muted)]">{c.label}</span>
                        </button>
                    ))}
                </div>
            </SectionCard>

            {/* Density */}
            <SectionCard title="Densidad de la UI" icon={<AlignJustify className="w-4 h-4 text-[var(--ds-teal)]" />}>
                <div className="grid grid-cols-3 gap-3">
                    {DENSITIES.map(d => (
                        <button key={d.key} onClick={() => startTransition(() => setDensity(d.key as Density))}
                            className={`p-4 rounded-[0.15rem] border text-left transition-all ${density === d.key ? "border-[var(--ds-teal-md)] bg-[var(--ds-teal-dim)] ring-1 ring-[var(--ds-teal-md)]" : "border-[var(--ds-border)] hover:border-[var(--ds-border-glow)] bg-[var(--ds-surface-2)]/20"}`}>
                            <div className="flex items-center gap-2 mb-2">
                                <div className={`flex flex-col gap-0.5 ${d.key === "compact" ? "gap-0.5" : d.key === "comfortable" ? "gap-2" : "gap-1"}`}>
                                    {[1, 2, 3].map(i => <div key={i} className="h-0.5 w-6 bg-[var(--ds-text-muted)] rounded-full" />)}
                                </div>
                                {density === d.key && <Check className="w-3.5 h-3.5 text-[var(--ds-teal-bright)] ml-auto" />}
                            </div>
                            <p className="text-sm font-semibold text-[var(--ds-text-primary)]">{d.label}</p>
                            <p className="text-xs text-[var(--ds-text-muted)] mt-0.5">{d.desc}</p>
                        </button>
                    ))}
                </div>
            </SectionCard>

            {/* Font */}
            <SectionCard title="Tipografía" icon={<Type className="w-4 h-4 text-[var(--ds-teal)]" />}>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {FONTS.map(f => (
                        <button key={f.key} onClick={() => startTransition(() => setFont(f.key as FontType))}
                            className={`p-4 rounded-[0.15rem] border text-left transition-all ${font === f.key ? "border-[var(--ds-teal-md)] bg-[var(--ds-teal-dim)] ring-1 ring-[var(--ds-teal-md)]" : "border-[var(--ds-border)] hover:border-[var(--ds-border-glow)] bg-[var(--ds-surface-2)]/20"}`}>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-2xl font-bold text-[var(--ds-text-primary)]">Aa</span>
                                {font === f.key && <Check className="w-3.5 h-3.5 text-[var(--ds-teal-bright)]" />}
                            </div>
                            <p className="text-xs font-semibold text-[var(--ds-text-secondary)]">{f.label}</p>
                            <p className="text-xs text-[var(--ds-text-muted)]">{f.preview}</p>
                        </button>
                    ))}
                </div>
            </SectionCard>

            {/* Toggles */}
            <SectionCard title="Preferencias Adicionales" icon={<Zap className="w-4 h-4 text-[var(--ds-teal)]" />}>
                <div className="space-y-4">
                    {[
                        { key: "sidebar", label: "Sidebar colapsado por defecto", desc: "La barra lateral iniciará minimizada", val: sidebarCollapsed, set: setSidebarCollapsed },
                        { key: "anim", label: "Animaciones y transiciones", desc: "Efectos visuales al interactuar con la UI", val: animationsEnabled, set: setAnimationsEnabled },
                    ].map(opt => (
                        <div key={opt.key} className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-[var(--ds-text-primary)]">{opt.label}</p>
                                <p className="text-xs text-[var(--ds-text-muted)] mt-0.5">{opt.desc}</p>
                            </div>
                            <button onClick={() => startTransition(() => opt.set(!opt.val))}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${opt.val ? "bg-[var(--ds-teal-md)]" : "bg-[var(--ds-surface-2)] border border-[var(--ds-border)]"}`}>
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${opt.val ? "translate-x-6" : "translate-x-1"}`} />
                            </button>
                        </div>
                    ))}
                </div>
            </SectionCard>

            {/* Save */}
            <div className="flex justify-end">
                <button onClick={handleSave} disabled={isSaving}
                    className="px-6 py-3 bg-[var(--ds-teal)] hover:bg-[var(--ds-teal-md)] text-white font-semibold rounded-[0.15rem] border border-[var(--ds-border-glow)] text-sm transition-all shadow-[var(--ds-shadow-teal)] disabled:opacity-50">
                    {isSaving ? "Guardando..." : "Guardar Preferencias"}
                </button>
            </div>
        </div>
    );
}

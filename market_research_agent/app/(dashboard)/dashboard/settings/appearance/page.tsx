"use client";

import { useState } from "react";
import { Palette, Moon, Sun, Monitor, Zap, AlignJustify, Type, Check } from "lucide-react";
import { toast } from "sonner";

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

function SectionCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-800">
                <div className="p-2 bg-slate-800 rounded-lg">{icon}</div>
                <h3 className="text-sm font-semibold text-white">{title}</h3>
            </div>
            <div className="p-5">{children}</div>
        </div>
    );
}

export default function AppearancePage() {
    const [theme, setTheme] = useState("dark");
    const [density, setDensity] = useState("normal");
    const [accent, setAccent] = useState("teal");
    const [font, setFont] = useState("inter");
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [animationsEnabled, setAnimationsEnabled] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

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
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 text-xs font-mono mb-3">
                    <Palette className="w-3.5 h-3.5" /> PERSONALIZACIÓN VISUAL
                </div>
                <h2 className="text-2xl font-bold text-white tracking-tight">Apariencia</h2>
                <p className="text-slate-400 text-sm mt-1">Personaliza el tema, tipografía y densidad de la interfaz.</p>
            </div>

            {/* Themes */}
            <SectionCard title="Tema de la Interfaz" icon={<Moon className="w-4 h-4 text-slate-400" />}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {THEMES.map(t => (
                        <button key={t.key} onClick={() => setTheme(t.key)}
                            className={`relative p-4 rounded-xl border text-left transition-all ${theme === t.key ? "border-teal-500/50 bg-teal-500/5 ring-1 ring-teal-500/20" : "border-slate-700 hover:border-slate-600 bg-slate-950/40"}`}>
                            {/* Preview */}
                            <div className={`h-16 rounded-lg ${t.preview} border mb-3 flex items-center justify-center`}>
                                <div className={`text-2xl ${t.key === "light" ? "text-slate-700" : "text-white"}`}>{t.icon}</div>
                            </div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-semibold text-slate-200">{t.label}</p>
                                    <p className="text-xs text-slate-500 mt-0.5">{t.desc}</p>
                                </div>
                                {theme === t.key && <Check className="w-4 h-4 text-teal-400 shrink-0" />}
                            </div>
                        </button>
                    ))}
                </div>
            </SectionCard>

            {/* Accent Colors */}
            <SectionCard title="Color de Acento" icon={<Palette className="w-4 h-4 text-slate-400" />}>
                <div className="flex flex-wrap gap-3">
                    {ACCENT_COLORS.map(c => (
                        <button key={c.key} onClick={() => setAccent(c.key)} className="group flex flex-col items-center gap-2">
                            <div className={`w-9 h-9 rounded-xl ${c.bg} transition-all group-hover:scale-110 ${accent === c.key ? "ring-2 ring-offset-2 ring-offset-slate-900 " + c.ring : ""}`}>
                                {accent === c.key && <div className="w-full h-full flex items-center justify-center"><Check className="w-4 h-4 text-white" /></div>}
                            </div>
                            <span className="text-[10px] text-slate-500">{c.label}</span>
                        </button>
                    ))}
                </div>
            </SectionCard>

            {/* Density */}
            <SectionCard title="Densidad de la UI" icon={<AlignJustify className="w-4 h-4 text-slate-400" />}>
                <div className="grid grid-cols-3 gap-3">
                    {DENSITIES.map(d => (
                        <button key={d.key} onClick={() => setDensity(d.key)}
                            className={`p-4 rounded-xl border text-left transition-all ${density === d.key ? "border-teal-500/50 bg-teal-500/5 ring-1 ring-teal-500/20" : "border-slate-700 hover:border-slate-600 bg-slate-950/40"}`}>
                            <div className="flex items-center gap-2 mb-2">
                                <div className={`flex flex-col gap-0.5 ${d.key === "compact" ? "gap-0.5" : d.key === "comfortable" ? "gap-2" : "gap-1"}`}>
                                    {[1, 2, 3].map(i => <div key={i} className="h-0.5 w-6 bg-slate-500 rounded-full" />)}
                                </div>
                                {density === d.key && <Check className="w-3.5 h-3.5 text-teal-400 ml-auto" />}
                            </div>
                            <p className="text-sm font-semibold text-slate-200">{d.label}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{d.desc}</p>
                        </button>
                    ))}
                </div>
            </SectionCard>

            {/* Font */}
            <SectionCard title="Tipografía" icon={<Type className="w-4 h-4 text-slate-400" />}>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {FONTS.map(f => (
                        <button key={f.key} onClick={() => setFont(f.key)}
                            className={`p-4 rounded-xl border text-left transition-all ${font === f.key ? "border-teal-500/50 bg-teal-500/5 ring-1 ring-teal-500/20" : "border-slate-700 hover:border-slate-600 bg-slate-950/40"}`}>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-2xl font-bold text-slate-200">Aa</span>
                                {font === f.key && <Check className="w-3.5 h-3.5 text-teal-400" />}
                            </div>
                            <p className="text-xs font-semibold text-slate-300">{f.label}</p>
                            <p className="text-[10px] text-slate-600">{f.preview}</p>
                        </button>
                    ))}
                </div>
            </SectionCard>

            {/* Toggles */}
            <SectionCard title="Preferencias Adicionales" icon={<Zap className="w-4 h-4 text-slate-400" />}>
                <div className="space-y-4">
                    {[
                        { key: "sidebar", label: "Sidebar colapsado por defecto", desc: "La barra lateral iniciará minimizada", val: sidebarCollapsed, set: setSidebarCollapsed },
                        { key: "anim", label: "Animaciones y transiciones", desc: "Efectos visuales al interactuar con la UI", val: animationsEnabled, set: setAnimationsEnabled },
                    ].map(opt => (
                        <div key={opt.key} className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-200">{opt.label}</p>
                                <p className="text-xs text-slate-500 mt-0.5">{opt.desc}</p>
                            </div>
                            <button onClick={() => opt.set(!opt.val)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${opt.val ? "bg-teal-600" : "bg-slate-700"}`}>
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${opt.val ? "translate-x-6" : "translate-x-1"}`} />
                            </button>
                        </div>
                    ))}
                </div>
            </SectionCard>

            {/* Save */}
            <div className="flex justify-end">
                <button onClick={handleSave} disabled={isSaving}
                    className="px-6 py-3 bg-teal-600 hover:bg-teal-500 text-white font-semibold rounded-xl text-sm transition-colors shadow-[0_0_15px_rgba(20,184,166,0.3)] disabled:opacity-50">
                    {isSaving ? "Guardando..." : "Guardar Preferencias"}
                </button>
            </div>
        </div>
    );
}

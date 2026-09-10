"use client";

import { useState, useEffect, useTransition } from "react";
import { 
    Palette, Moon, Sun, Monitor, Zap, AlignJustify, Type, Check, 
    Loader2, Save, RotateCcw, Sparkles, Volume2, VolumeX, Eye, 
    Layers, Square, SlidersHorizontal, CheckCircle2, ArrowUpRight, 
    Activity, ShieldCheck, Box
} from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { 
    useUIStore, 
    AccentColor, 
    Density, 
    FontType, 
    BgTheme, 
    BorderRadius, 
    playUiSound, 
    UIAppearanceConfig 
} from "@/lib/stores/ui-store";
import { updateUserAppearance } from "@/actions/settings";

const THEMES = [
    { key: "dark", label: "HUD Dark", desc: "Fondo oscuro profundo con contraste optimizado", icon: <Moon className="w-4 h-4" />, preview: "bg-slate-950 border-teal-500/40" },
    { key: "light", label: "Corporate Light", desc: "Fondo blanco pulido para entornos corporativos", icon: <Sun className="w-4 h-4" />, preview: "bg-white border-slate-300" },
    { key: "system", label: "Automático / Sistema", desc: "Se adapta a la configuración del sistema operativo", icon: <Monitor className="w-4 h-4" />, preview: "bg-gradient-to-br from-slate-950 to-white border-slate-500" },
];

const BG_THEMES = [
    { key: "slate", label: "Sleek Slate", desc: "Gris azulado espacial (Predeterminado)", preview: "bg-slate-950 border-slate-800" },
    { key: "amoled", label: "AMOLED Black", desc: "Negro puro de contraste infinito (0 lux)", preview: "bg-black border-zinc-900" },
    { key: "zinc", label: "Carbon Zinc", desc: "Gris carbón neutro industrial", preview: "bg-zinc-950 border-zinc-800" },
    { key: "indigo", label: "Midnight Indigo", desc: "Azul cósmico profundo de alta tecnología", preview: "bg-[rgb(3,3,20)] border-indigo-950" },
    { key: "forest", label: "Obsidian Forest", desc: "Verde esmeralda orgánico profundo", preview: "bg-[rgb(2,8,4)] border-emerald-950" },
];

const ACCENT_COLORS = [
    { key: "teal", label: "Teal Matrix", colorHex: "#0d9488", bg: "bg-teal-500", border: "border-teal-500", ring: "ring-teal-500" },
    { key: "violet", label: "Electric Violet", colorHex: "#7c3aed", bg: "bg-violet-500", border: "border-violet-500", ring: "ring-violet-500" },
    { key: "blue", label: "Cobalt Blue", colorHex: "#2563eb", bg: "bg-blue-500", border: "border-blue-500", ring: "ring-blue-500" },
    { key: "amber", label: "Solar Amber", colorHex: "#d97706", bg: "bg-amber-500", border: "border-amber-500", ring: "ring-amber-500" },
    { key: "rose", label: "Neon Rose", colorHex: "#e11d48", bg: "bg-rose-500", border: "border-rose-500", ring: "ring-rose-500" },
    { key: "emerald", label: "Quantum Emerald", colorHex: "#059669", bg: "bg-emerald-500", border: "border-emerald-500", ring: "ring-emerald-500" },
];

const DENSITIES = [
    { key: "compact", label: "Compacto", desc: "Máximo volumen de datos por pantalla para analistas" },
    { key: "normal", label: "Normal (Recomendado)", desc: "Equilibrio armónico entre información y respiración" },
    { key: "comfortable", label: "Cómodo", desc: "Espaciado generoso optimizado para lectura y táctil" },
];

const FONTS = [
    { key: "inter", label: "Inter", desc: "Estándar de interfaz moderna, neutral y geométrica", preview: "123,456 Aa" },
    { key: "roboto", label: "Roboto", desc: "Clásico confiable y legible de alta densidad", preview: "123,456 Aa" },
    { key: "jetbrains", label: "JetBrains Mono", desc: "Monoespaciado táctico enfocado en código y métricas", preview: "123,456 Aa" },
    { key: "geist", label: "Geist / Outfit", desc: "Diseño tipográfico vanguardista de próxima generación", preview: "123,456 Aa" },
];

const BORDER_RADII = [
    { key: "sharp", label: "Sharp HUD (0.15rem)", desc: "Estilo técnico angular y futurista", icon: <Square className="w-4 h-4" /> },
    { key: "rounded", label: "Modern Rounded (0.5rem)", desc: "Curvatura contemporánea equilibrada", icon: <Box className="w-4 h-4" /> },
    { key: "pill", label: "Soft Curved (1.0rem)", desc: "Bordes amigables y redondeados", icon: <Layers className="w-4 h-4" /> },
];

const PRESETS: Array<{
    id: string;
    name: string;
    desc: string;
    badge: string;
    colors: [string, string];
    config: Partial<UIAppearanceConfig> & { theme: "dark" | "light" | "system" };
}> = [
    {
        id: "cyberpunk",
        name: "Cyberpunk HUD",
        desc: "Negro AMOLED puro con acento Rosa Neón y tipografía táctica JetBrains Mono",
        badge: "TÁCTICO",
        colors: ["#000000", "#e11d48"],
        config: {
            theme: "dark",
            bgTheme: "amoled",
            accent: "rose",
            font: "jetbrains",
            borderRadius: "sharp",
            highContrast: true,
            glassmorphism: false,
        }
    },
    {
        id: "enterprise-blue",
        name: "Enterprise Prime",
        desc: "Sleek Slate espacial con acento Azul Cobalto y tipografía Inter pulida",
        badge: "CORPORATIVO",
        colors: ["#020617", "#2563eb"],
        config: {
            theme: "dark",
            bgTheme: "slate",
            accent: "blue",
            font: "inter",
            borderRadius: "rounded",
            highContrast: false,
            glassmorphism: true,
        }
    },
    {
        id: "matrix-emerald",
        name: "Terminal Matrix",
        desc: "Obsidian Forest con acento Esmeralda Cuántico de alta luminancia",
        badge: "HACKER",
        colors: ["#020804", "#059669"],
        config: {
            theme: "dark",
            bgTheme: "forest",
            accent: "emerald",
            font: "jetbrains",
            borderRadius: "sharp",
            highContrast: true,
            glassmorphism: true,
        }
    },
    {
        id: "cosmic-indigo",
        name: "Cosmic Indigo",
        desc: "Azul medianoche cósmico con acento Violeta Eléctrico y tipografía Geist",
        badge: "MODERNO",
        colors: ["#030314", "#7c3aed"],
        config: {
            theme: "dark",
            bgTheme: "indigo",
            accent: "violet",
            font: "geist",
            borderRadius: "rounded",
            highContrast: false,
            glassmorphism: true,
        }
    },
    {
        id: "corporate-light",
        name: "Executive Light",
        desc: "Tema claro de alta elegancia con Carbon Zinc y acento Teal Matrix",
        badge: "EJECUTIVO",
        colors: ["#ffffff", "#0d9488"],
        config: {
            theme: "light",
            bgTheme: "zinc",
            accent: "teal",
            font: "inter",
            borderRadius: "rounded",
            highContrast: false,
            glassmorphism: true,
        }
    },
];

function SectionCard({ 
    title, 
    subtitle, 
    icon, 
    badge,
    children 
}: { 
    title: string; 
    subtitle?: string;
    icon: React.ReactNode; 
    badge?: string;
    children: React.ReactNode 
}) {
    return (
        <div className="bg-[var(--ds-surface)] border border-[var(--ds-border)] rounded-[var(--radius)] overflow-hidden backdrop-blur-md shadow-[var(--ds-shadow-card)] transition-all">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--ds-border)] bg-[var(--ds-surface-2)]/40">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-[var(--ds-surface-2)] border border-[var(--ds-border)] rounded-[var(--radius)] text-[var(--ds-teal)] shadow-sm">
                        {icon}
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-[var(--ds-text-primary)]">{title}</h3>
                        {subtitle && <p className="text-xs text-[var(--ds-text-muted)] mt-0.5">{subtitle}</p>}
                    </div>
                </div>
                {badge && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-[var(--radius)] bg-[var(--ds-teal-dim)] text-[var(--ds-teal)] border border-[var(--ds-border-glow)] font-semibold uppercase tracking-wider">
                        {badge}
                    </span>
                )}
            </div>
            <div className="p-6">{children}</div>
        </div>
    );
}

interface AppearanceFormProps {
    initialData: {
        theme?: "light" | "dark" | "system";
        accent?: string;
        density?: string;
        font?: string;
        bgTheme?: string;
        borderRadius?: "sharp" | "rounded" | "pill";
        glassmorphism?: boolean;
        highContrast?: boolean;
        soundEffects?: boolean;
        sidebarCollapsed?: boolean;
        animationsEnabled?: boolean;
    } | null;
}

export function AppearanceForm({ initialData }: AppearanceFormProps) {
    const { theme, setTheme } = useTheme();
    const { 
        accent, setAccent, 
        density, setDensity, 
        font, setFont, 
        bgTheme, setBgTheme,
        borderRadius, setBorderRadius,
        glassmorphism, setGlassmorphism,
        highContrast, setHighContrast,
        soundEffects, setSoundEffects,
        sidebarCollapsed, setSidebarCollapsed, 
        animationsEnabled, setAnimationsEnabled,
        applyPreset,
        resetToDefaults
    } = useUIStore();
    
    const [isPending, startTransition] = useTransition();
    const [mounted, setMounted] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [previewKpiCount, setPreviewKpiCount] = useState(128450);

    // Sync Zustand with DB on mount
    useEffect(() => {
        setMounted(true);
        if (initialData) {
            if (initialData.accent) setAccent(initialData.accent as AccentColor);
            if (initialData.density) setDensity(initialData.density as Density);
            if (initialData.font) setFont(initialData.font as FontType);
            if (initialData.bgTheme) setBgTheme(initialData.bgTheme as BgTheme);
            if (initialData.borderRadius) setBorderRadius(initialData.borderRadius as BorderRadius);
            if (initialData.glassmorphism !== undefined) setGlassmorphism(initialData.glassmorphism);
            if (initialData.highContrast !== undefined) setHighContrast(initialData.highContrast);
            if (initialData.soundEffects !== undefined) setSoundEffects(initialData.soundEffects);
            if (initialData.sidebarCollapsed !== undefined) setSidebarCollapsed(initialData.sidebarCollapsed);
            if (initialData.animationsEnabled !== undefined) setAnimationsEnabled(initialData.animationsEnabled);
            if (initialData.theme) setTheme(initialData.theme);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (!mounted) return null;

    const handleSave = async () => {
        setIsSaving(true);
        playUiSound('success');
        const toastId = toast.loading("Sincronizando preferencias en la nube...");
        
        try {
            const result = await updateUserAppearance({
                theme: theme as any,
                accent,
                density,
                font,
                bgTheme,
                borderRadius,
                glassmorphism,
                highContrast,
                soundEffects,
                sidebarCollapsed,
                animationsEnabled
            });

            if (result.success) {
                toast.success("Preferencias visuales y de UI guardadas con éxito en tu cuenta", { id: toastId });
            } else {
                toast.error(result.error || "Error al guardar preferencias", { id: toastId });
            }
        } catch (e) {
            toast.error("Error inesperado de red al guardar preferencias", { id: toastId });
        } finally {
            setIsSaving(false);
        }
    };

    const handleReset = () => {
        resetToDefaults();
        setTheme("system");
        toast.info("Configuración visual restablecida a los valores de fábrica");
    };

    const handleApplyPreset = (preset: typeof PRESETS[0]) => {
        applyPreset(preset.config);
        if (preset.config.theme) {
            setTheme(preset.config.theme);
        }
        toast.success(`Estilo preconfigurado "${preset.name}" activado`);
    };

    return (
        <div className="space-y-8 pb-16">

            {/* ══════════════════════════════════════════════════════════
                1. INTERACTIVE LIVE HUD SIMULATOR
            ══════════════════════════════════════════════════════════ */}
            <div className="relative p-6 rounded-[var(--radius)] border border-[var(--ds-border-glow)] bg-[var(--ds-surface)] backdrop-blur-md shadow-[var(--ds-shadow-card)] overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--ds-teal-dim)] rounded-full blur-3xl pointer-events-none -z-10" />
                
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-[var(--ds-border)]">
                    <div>
                        <div className="inline-flex items-center gap-2 text-xs font-mono text-[var(--ds-teal)] font-semibold mb-1">
                            <Activity className="w-3.5 h-3.5 animate-pulse" /> SIMULADOR EN TIEMPO REAL
                        </div>
                        <h3 className="text-lg font-bold text-[var(--ds-text-primary)]">Vista Previa de Componentes del HUD</h3>
                        <p className="text-xs text-[var(--ds-text-secondary)] mt-0.5">
                            Comprueba instantáneamente el color de acento, tipografía, bordes y contraste aplicados.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="text-xs font-mono text-[var(--ds-text-muted)]">Acento Activo:</span>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[var(--radius)] bg-[var(--ds-teal-dim)] border border-[var(--ds-border-glow)] text-[var(--ds-teal)] text-xs font-mono font-bold capitalize">
                            <span className="w-2.5 h-2.5 rounded-full bg-[var(--ds-teal)]" />
                            {accent}
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[var(--radius)] bg-[var(--ds-surface-2)] border border-[var(--ds-border)] text-[var(--ds-text-secondary)] text-xs font-mono font-bold uppercase">
                            {font}
                        </span>
                    </div>
                </div>

                {/* Live Preview Elements Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-6">
                    {/* Card 1: Sample KPI Metric */}
                    <div className="p-4 rounded-[var(--radius)] border border-[var(--ds-border)] bg-[var(--ds-surface-2)]/60 flex flex-col justify-between">
                        <div className="flex items-center justify-between text-xs text-[var(--ds-text-muted)]">
                            <span>Ingresos Mensuales</span>
                            <span className="text-emerald-400 flex items-center font-mono font-bold">
                                +14.8% <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
                            </span>
                        </div>
                        <div className="my-2">
                            <div className="text-2xl font-bold font-mono text-[var(--ds-text-primary)]">
                                ${previewKpiCount.toLocaleString()} USD
                            </div>
                            <div className="w-full h-1.5 bg-[var(--ds-surface)] rounded-full overflow-hidden mt-2 border border-[var(--ds-border)]">
                                <div className="h-full bg-[var(--ds-teal)] rounded-full transition-all duration-500" style={{ width: "72%" }} />
                            </div>
                        </div>
                        <div className="text-[11px] text-[var(--ds-text-dim)] flex items-center justify-between">
                            <span>Meta alcanzada: 72%</span>
                            <button 
                                onClick={() => {
                                    playUiSound('click');
                                    setPreviewKpiCount(prev => prev + 1500);
                                }}
                                className="text-[var(--ds-teal)] hover:underline font-semibold cursor-pointer"
                            >
                                + Incrementar test
                            </button>
                        </div>
                    </div>

                    {/* Card 2: Sample Actions & State */}
                    <div className="p-4 rounded-[var(--radius)] border border-[var(--ds-border)] bg-[var(--ds-surface-2)]/60 flex flex-col justify-between space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-[var(--ds-text-muted)] font-medium">Controles de Botones</span>
                            <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                                <ShieldCheck className="w-3 h-3" /> Sistema OK
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => playUiSound('click')}
                                className="flex-1 py-2 px-3 rounded-[var(--radius)] bg-[var(--ds-teal)] hover:opacity-90 text-white text-xs font-semibold shadow-[var(--ds-shadow-teal)] transition-all cursor-pointer flex items-center justify-center gap-1.5"
                            >
                                <Zap className="w-3.5 h-3.5" /> Acción Principal
                            </button>
                            <button 
                                onClick={() => playUiSound('toggle')}
                                className="py-2 px-3 rounded-[var(--radius)] border border-[var(--ds-border)] bg-[var(--ds-surface)] hover:bg-[var(--ds-surface-2)] text-[var(--ds-text-primary)] text-xs font-medium transition-all cursor-pointer"
                            >
                                Secundario
                            </button>
                        </div>
                        <div className="flex items-center justify-between text-xs text-[var(--ds-text-muted)] pt-1 border-t border-[var(--ds-border)]/50">
                            <span>Efecto sonoro háptico:</span>
                            <span className="font-mono text-[var(--ds-teal)] font-semibold">
                                {soundEffects ? "Activado" : "Silenciado"}
                            </span>
                        </div>
                    </div>

                    {/* Card 3: Sample Typography & Geometry */}
                    <div className="p-4 rounded-[var(--radius)] border border-[var(--ds-border)] bg-[var(--ds-surface-2)]/60 flex flex-col justify-between">
                        <div className="text-xs text-[var(--ds-text-muted)] flex items-center justify-between">
                            <span>Muestra Tipográfica</span>
                            <span className="font-mono uppercase text-[10px] text-[var(--ds-text-dim)]">{borderRadius}</span>
                        </div>
                        <div className="my-1">
                            <div className="text-sm font-semibold text-[var(--ds-text-primary)] truncate">
                                LegacyMark Autonomous Systems
                            </div>
                            <p className="text-xs text-[var(--ds-text-secondary)] mt-1 line-clamp-2 leading-relaxed">
                                El veloz murciélago hindú comía feliz cardillo y kiwi. 0123456789.
                            </p>
                        </div>
                        <div className="flex items-center gap-2 pt-2 border-t border-[var(--ds-border)]/50">
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-[var(--radius)] bg-[var(--ds-surface)] border border-[var(--ds-border)] text-[var(--ds-text-secondary)]">
                                Densidad: {density}
                            </span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-[var(--radius)] bg-[var(--ds-surface)] border border-[var(--ds-border)] text-[var(--ds-text-secondary)]">
                                Fondo: {bgTheme}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ══════════════════════════════════════════════════════════
                2. CURATED STYLE PRESETS (1-CLICK ACTIVATE)
            ══════════════════════════════════════════════════════════ */}
            <SectionCard 
                title="Estilos de Diseño Preconfigurados" 
                subtitle="Elige una combinación armónica desarrollada por diseñadores UI con un solo clic"
                icon={<Sparkles className="w-4 h-4" />}
                badge="1-CLIC"
            >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    {PRESETS.map((p) => {
                        const isCurrentActive = 
                            bgTheme === p.config.bgTheme && 
                            accent === p.config.accent && 
                            font === p.config.font;

                        return (
                            <button
                                key={p.id}
                                onClick={() => handleApplyPreset(p)}
                                className={`relative p-4 rounded-[var(--radius)] border text-left transition-all cursor-pointer flex flex-col justify-between group ${
                                    isCurrentActive 
                                        ? "border-[var(--ds-teal-bright)] bg-[var(--ds-teal-dim)] ring-1 ring-[var(--ds-teal-bright)] shadow-[var(--ds-shadow-teal)]" 
                                        : "border-[var(--ds-border)] hover:border-[var(--ds-border-glow)] bg-[var(--ds-surface-2)]/25 hover:bg-[var(--ds-surface-2)]/50"
                                }`}
                            >
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-1.5">
                                            <span className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-sm" style={{ backgroundColor: p.colors[0] }} />
                                            <span className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-sm" style={{ backgroundColor: p.colors[1] }} />
                                        </div>
                                        <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[var(--ds-text-dim)]">
                                            {p.badge}
                                        </span>
                                    </div>
                                    <p className="text-xs font-bold text-[var(--ds-text-primary)] group-hover:text-[var(--ds-teal)] transition-colors">
                                        {p.name}
                                    </p>
                                    <p className="text-[10px] text-[var(--ds-text-muted)] mt-1 line-clamp-2 leading-snug">
                                        {p.desc}
                                    </p>
                                </div>

                                <div className="mt-4 pt-2 border-t border-[var(--ds-border)]/50 flex items-center justify-between">
                                    <span className="text-[10px] font-mono text-[var(--ds-teal)] font-semibold">
                                        {isCurrentActive ? "Activo" : "Aplicar"}
                                    </span>
                                    {isCurrentActive && <CheckCircle2 className="w-3.5 h-3.5 text-[var(--ds-teal-bright)]" />}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </SectionCard>

            {/* ══════════════════════════════════════════════════════════
                3. THEME MODE & BACKGROUND PALETTE
            ══════════════════════════════════════════════════════════ */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Theme Mode */}
                <SectionCard title="Modo de Luminancia" subtitle="Selecciona el tema de luz para el entorno general" icon={<Moon className="w-4 h-4" />}>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {THEMES.map(t => (
                            <button 
                                key={t.key} 
                                onClick={() => {
                                    playUiSound('click');
                                    startTransition(() => setTheme(t.key));
                                }}
                                className={`relative p-3.5 rounded-[var(--radius)] border text-left transition-all cursor-pointer ${
                                    theme === t.key 
                                        ? "border-[var(--ds-teal-bright)] bg-[var(--ds-teal-dim)] ring-1 ring-[var(--ds-teal-bright)]" 
                                        : "border-[var(--ds-border)] hover:border-[var(--ds-border-glow)] bg-[var(--ds-surface-2)]/20"
                                }`}
                            >
                                <div className={`h-12 rounded-[var(--radius)] ${t.preview} border mb-2.5 flex items-center justify-center shadow-inner`}>
                                    <div className={`text-xl ${t.key === "light" ? "text-slate-700" : "text-slate-100"}`}>
                                        {t.icon}
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-bold text-[var(--ds-text-primary)]">{t.label}</p>
                                        <p className="text-[10px] text-[var(--ds-text-muted)] mt-0.5 leading-snug">{t.desc}</p>
                                    </div>
                                    {theme === t.key && <Check className="w-4 h-4 text-[var(--ds-teal-bright)] shrink-0 ml-1" />}
                                </div>
                            </button>
                        ))}
                    </div>
                </SectionCard>

                {/* Background Theme */}
                <SectionCard title="Paleta de Fondo" subtitle="Matiz y profundidad para el lienzo de trabajo" icon={<Palette className="w-4 h-4" />}>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {BG_THEMES.map(b => (
                            <button 
                                key={b.key} 
                                onClick={() => {
                                    playUiSound('click');
                                    startTransition(() => setBgTheme(b.key as BgTheme));
                                }}
                                className={`relative p-3 rounded-[var(--radius)] border text-left transition-all cursor-pointer ${
                                    bgTheme === b.key 
                                        ? "border-[var(--ds-teal-bright)] bg-[var(--ds-teal-dim)] ring-1 ring-[var(--ds-teal-bright)]" 
                                        : "border-[var(--ds-border)] hover:border-[var(--ds-border-glow)] bg-[var(--ds-surface-2)]/20"
                                }`}
                            >
                                <div className={`h-9 rounded-[var(--radius)] ${b.preview} border mb-2 flex items-center justify-center shadow-inner`} />
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-bold text-[var(--ds-text-primary)]">{b.label}</p>
                                        <p className="text-[10px] text-[var(--ds-text-muted)] mt-0.5 leading-tight line-clamp-1">{b.desc}</p>
                                    </div>
                                    {bgTheme === b.key && <Check className="w-3.5 h-3.5 text-[var(--ds-teal-bright)] shrink-0 ml-1" />}
                                </div>
                            </button>
                        ))}
                    </div>
                </SectionCard>
            </div>

            {/* ══════════════════════════════════════════════════════════
                4. ACCENT COLORS & BORDER RADIUS
            ══════════════════════════════════════════════════════════ */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Accent Colors */}
                <SectionCard title="Color de Acento de Alta Visibilidad" subtitle="Color maestro para KPIs, botones de acción y estados activos" icon={<Palette className="w-4 h-4" />}>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {ACCENT_COLORS.map(c => {
                            const isSelected = accent === c.key;
                            return (
                                <button 
                                    key={c.key} 
                                    onClick={() => {
                                        playUiSound('click');
                                        startTransition(() => setAccent(c.key as AccentColor));
                                    }}
                                    className={`p-3 rounded-[var(--radius)] border text-left transition-all cursor-pointer flex items-center gap-3 ${
                                        isSelected 
                                            ? "border-[var(--ds-teal-bright)] bg-[var(--ds-teal-dim)] ring-1 ring-[var(--ds-teal-bright)]" 
                                            : "border-[var(--ds-border)] hover:border-[var(--ds-border-glow)] bg-[var(--ds-surface-2)]/20"
                                    }`}
                                >
                                    <div className={`w-8 h-8 rounded-[var(--radius)] ${c.bg} shrink-0 shadow-md flex items-center justify-center`}>
                                        {isSelected && <Check className="w-4 h-4 text-white" />}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold text-[var(--ds-text-primary)] truncate">{c.label}</p>
                                        <p className="text-[10px] font-mono text-[var(--ds-text-muted)] mt-0.5">{c.colorHex}</p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </SectionCard>

                {/* Border Radius */}
                <SectionCard title="Geometría & Radio de Bordes" subtitle="Control de curvatura para paneles, tarjetas y botones" icon={<Square className="w-4 h-4" />}>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {BORDER_RADII.map(r => {
                            const isSelected = borderRadius === r.key;
                            return (
                                <button
                                    key={r.key}
                                    onClick={() => {
                                        playUiSound('click');
                                        startTransition(() => setBorderRadius(r.key as BorderRadius));
                                    }}
                                    className={`p-3.5 rounded-[var(--radius)] border text-left transition-all cursor-pointer ${
                                        isSelected
                                            ? "border-[var(--ds-teal-bright)] bg-[var(--ds-teal-dim)] ring-1 ring-[var(--ds-teal-bright)]"
                                            : "border-[var(--ds-border)] hover:border-[var(--ds-border-glow)] bg-[var(--ds-surface-2)]/20"
                                    }`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="text-[var(--ds-teal)]">{r.icon}</div>
                                        {isSelected && <Check className="w-3.5 h-3.5 text-[var(--ds-teal-bright)]" />}
                                    </div>
                                    <p className="text-xs font-bold text-[var(--ds-text-primary)]">{r.label}</p>
                                    <p className="text-[10px] text-[var(--ds-text-muted)] mt-1 leading-snug">{r.desc}</p>
                                </button>
                            );
                        })}
                    </div>
                </SectionCard>
            </div>

            {/* ══════════════════════════════════════════════════════════
                5. UI DENSITY & TYPOGRAPHY
            ══════════════════════════════════════════════════════════ */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Density */}
                <SectionCard title="Densidad de Información" subtitle="Ajusta el volumen de datos en tablas y paneles" icon={<AlignJustify className="w-4 h-4" />}>
                    <div className="grid grid-cols-3 gap-3">
                        {DENSITIES.map(d => (
                            <button 
                                key={d.key} 
                                onClick={() => {
                                    playUiSound('click');
                                    startTransition(() => setDensity(d.key as Density));
                                }}
                                className={`p-4 rounded-[var(--radius)] border text-left transition-all cursor-pointer flex flex-col justify-between ${
                                    density === d.key 
                                        ? "border-[var(--ds-teal-bright)] bg-[var(--ds-teal-dim)] ring-1 ring-[var(--ds-teal-bright)]" 
                                        : "border-[var(--ds-border)] hover:border-[var(--ds-border-glow)] bg-[var(--ds-surface-2)]/20"
                                }`}
                            >
                                <div className="flex items-center gap-2 mb-3">
                                    <div className={`flex flex-col ${d.key === "compact" ? "gap-1" : d.key === "comfortable" ? "gap-2.5" : "gap-1.5"}`}>
                                        {[1, 2, 3].map(i => <div key={i} className="h-1 w-7 bg-[var(--ds-teal)]/60 rounded-full" />)}
                                    </div>
                                    {density === d.key && <Check className="w-3.5 h-3.5 text-[var(--ds-teal-bright)] ml-auto" />}
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-[var(--ds-text-primary)]">{d.label}</p>
                                    <p className="text-[10px] text-[var(--ds-text-muted)] mt-0.5 leading-snug">{d.desc}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </SectionCard>

                {/* Typography */}
                <SectionCard title="Motor Tipográfico del Sistema" subtitle="Familia de fuentes para renderizado óptimo de datos" icon={<Type className="w-4 h-4" />}>
                    <div className="grid grid-cols-2 gap-3">
                        {FONTS.map(f => (
                            <button 
                                key={f.key} 
                                onClick={() => {
                                    playUiSound('click');
                                    startTransition(() => setFont(f.key as FontType));
                                }}
                                className={`p-3.5 rounded-[var(--radius)] border text-left transition-all cursor-pointer ${
                                    font === f.key 
                                        ? "border-[var(--ds-teal-bright)] bg-[var(--ds-teal-dim)] ring-1 ring-[var(--ds-teal-bright)]" 
                                        : "border-[var(--ds-border)] hover:border-[var(--ds-border-glow)] bg-[var(--ds-surface-2)]/20"
                                }`}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-lg font-bold font-mono text-[var(--ds-teal)]">{f.preview}</span>
                                    {font === f.key && <Check className="w-3.5 h-3.5 text-[var(--ds-teal-bright)]" />}
                                </div>
                                <p className="text-xs font-bold text-[var(--ds-text-primary)]">{f.label}</p>
                                <p className="text-[10px] text-[var(--ds-text-muted)] mt-0.5 leading-snug line-clamp-1">{f.desc}</p>
                            </button>
                        ))}
                    </div>
                </SectionCard>
            </div>

            {/* ══════════════════════════════════════════════════════════
                6. ACCESSIBILITY, ERGONOMICS & AUDIO FEEDBACK
            ══════════════════════════════════════════════════════════ */}
            <SectionCard 
                title="Accesibilidad, Ergonomía & Retroalimentación Háptica" 
                subtitle="Ajustes avanzados para mejorar el confort visual, rendimiento y experiencia sensorial"
                icon={<SlidersHorizontal className="w-4 h-4" />}
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* High Contrast */}
                    <div className="flex items-center justify-between p-3.5 rounded-[var(--radius)] border border-[var(--ds-border)] bg-[var(--ds-surface-2)]/20">
                        <div className="pr-4">
                            <div className="flex items-center gap-2">
                                <Eye className="w-4 h-4 text-[var(--ds-teal)]" />
                                <p className="text-xs font-bold text-[var(--ds-text-primary)]">Modo Alto Contraste (WCAG AAA)</p>
                            </div>
                            <p className="text-[11px] text-[var(--ds-text-muted)] mt-1 leading-snug">
                                Refuerza la visibilidad de bordes, iconos y tipografía en condiciones de iluminación exigentes.
                            </p>
                        </div>
                        <button 
                            onClick={() => setHighContrast(!highContrast)}
                            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors cursor-pointer ${
                                highContrast ? "bg-[var(--ds-teal)]" : "bg-[var(--ds-surface-2)] border border-[var(--ds-border)]"
                            }`}
                        >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                                highContrast ? "translate-x-6" : "translate-x-1"
                            }`} />
                        </button>
                    </div>

                    {/* Glassmorphism */}
                    <div className="flex items-center justify-between p-3.5 rounded-[var(--radius)] border border-[var(--ds-border)] bg-[var(--ds-surface-2)]/20">
                        <div className="pr-4">
                            <div className="flex items-center gap-2">
                                <Layers className="w-4 h-4 text-[var(--ds-teal)]" />
                                <p className="text-xs font-bold text-[var(--ds-text-primary)]">Efectos Traslúcidos (Glassmorphism)</p>
                            </div>
                            <p className="text-[11px] text-[var(--ds-text-muted)] mt-1 leading-snug">
                                Aplica desenfoque de fondo en tarjetas y barra superior para profundidad visual.
                            </p>
                        </div>
                        <button 
                            onClick={() => setGlassmorphism(!glassmorphism)}
                            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors cursor-pointer ${
                                glassmorphism ? "bg-[var(--ds-teal)]" : "bg-[var(--ds-surface-2)] border border-[var(--ds-border)]"
                            }`}
                        >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                                glassmorphism ? "translate-x-6" : "translate-x-1"
                            }`} />
                        </button>
                    </div>

                    {/* Audio Haptic Feedback */}
                    <div className="flex items-center justify-between p-3.5 rounded-[var(--radius)] border border-[var(--ds-border)] bg-[var(--ds-surface-2)]/20">
                        <div className="pr-4">
                            <div className="flex items-center gap-2">
                                {soundEffects ? <Volume2 className="w-4 h-4 text-[var(--ds-teal)]" /> : <VolumeX className="w-4 h-4 text-[var(--ds-text-dim)]" />}
                                <p className="text-xs font-bold text-[var(--ds-text-primary)]">Audio Háptico & Retroalimentación Sonora</p>
                            </div>
                            <p className="text-[11px] text-[var(--ds-text-muted)] mt-1 leading-snug">
                                Micro-sonidos sintetizados en tiempo real al interactuar con interruptores y botones clave.
                            </p>
                        </div>
                        <button 
                            onClick={() => {
                                const next = !soundEffects;
                                setSoundEffects(next);
                                if (next) playUiSound('toggle');
                            }}
                            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors cursor-pointer ${
                                soundEffects ? "bg-[var(--ds-teal)]" : "bg-[var(--ds-surface-2)] border border-[var(--ds-border)]"
                            }`}
                        >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                                soundEffects ? "translate-x-6" : "translate-x-1"
                            }`} />
                        </button>
                    </div>

                    {/* Animations & Micro-interactions */}
                    <div className="flex items-center justify-between p-3.5 rounded-[var(--radius)] border border-[var(--ds-border)] bg-[var(--ds-surface-2)]/20">
                        <div className="pr-4">
                            <div className="flex items-center gap-2">
                                <Zap className="w-4 h-4 text-[var(--ds-teal)]" />
                                <p className="text-xs font-bold text-[var(--ds-text-primary)]">Animaciones & Micro-interacciones</p>
                            </div>
                            <p className="text-[11px] text-[var(--ds-text-muted)] mt-1 leading-snug">
                                Transiciones suaves de estado. Desactivar para maximizar rendimiento en dispositivos antiguos.
                            </p>
                        </div>
                        <button 
                            onClick={() => setAnimationsEnabled(!animationsEnabled)}
                            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors cursor-pointer ${
                                animationsEnabled ? "bg-[var(--ds-teal)]" : "bg-[var(--ds-surface-2)] border border-[var(--ds-border)]"
                            }`}
                        >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                                animationsEnabled ? "translate-x-6" : "translate-x-1"
                            }`} />
                        </button>
                    </div>
                </div>
            </SectionCard>

            {/* ══════════════════════════════════════════════════════════
                7. ACTION BAR & CLOUD SYNC
            ══════════════════════════════════════════════════════════ */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-[var(--radius)] border border-[var(--ds-border)] bg-[var(--ds-surface)] backdrop-blur-md shadow-lg">
                <div className="flex items-center gap-2 text-xs text-[var(--ds-text-secondary)]">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Los cambios se reflejan en tiempo real en tu navegador.</span>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button 
                        type="button"
                        onClick={handleReset}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-[var(--radius)] border border-[var(--ds-border)] bg-[var(--ds-surface-2)]/40 hover:bg-[var(--ds-surface-2)] text-[var(--ds-text-primary)] text-xs font-semibold transition-all cursor-pointer"
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Restablecer
                    </button>

                    <button 
                        type="button"
                        onClick={handleSave} 
                        disabled={isSaving}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-[var(--radius)] bg-[var(--ds-teal)] hover:opacity-90 text-white text-xs font-bold shadow-[var(--ds-shadow-teal)] transition-all disabled:opacity-50 cursor-pointer"
                    >
                        {isSaving ? <Loader2 className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4" />}
                        {isSaving ? "Guardando..." : "Guardar Preferencias en la Nube"}
                    </button>
                </div>
            </div>
        </div>
    );
}

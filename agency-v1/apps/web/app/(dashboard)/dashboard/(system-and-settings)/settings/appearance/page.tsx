import { getSettings } from "@/actions/settings";
import { auth } from "@/lib/auth";
import { AppearanceForm } from "./AppearanceForm";
import { Palette, Sparkles } from "lucide-react";
import { redirect } from "next/navigation";

export const metadata = {
    title: 'Apariencia y UI | Configuración LegacyMark',
    description: 'Personaliza el tema, acentos, tipografía, densidad y ergonomía visual de la plataforma.',
};

export const dynamic = 'force-dynamic';

export default async function SettingsAppearancePage() {
    const session = await auth();

    if (!session?.user) {
        redirect("/auth/login");
    }

    const settings = await getSettings();

    const initialData = settings || {
        theme: "system" as const,
        accent: "teal",
        density: "normal",
        font: "inter",
        bgTheme: "slate",
        borderRadius: "sharp" as const,
        glassmorphism: true,
        highContrast: false,
        soundEffects: true,
        sidebarCollapsed: false,
        animationsEnabled: true,
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header */}
            <div>
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-[var(--radius)] bg-[var(--ds-teal-dim)] border border-[var(--ds-border-glow)] text-[var(--ds-teal)] text-xs font-mono mb-3">
                    <Sparkles className="w-3.5 h-3.5" /> MOTOR DE PERSONALIZACIÓN VISUAL Y HUD
                </div>
                <h2 className="text-2xl font-bold text-[var(--ds-text-primary)] tracking-tight">Apariencia & Experiencia de Usuario</h2>
                <p className="text-[var(--ds-text-secondary)] text-sm mt-1">
                    Controla temas dinámicos, paletas de fondo, acentos de color, densidad, tipografías y retroalimentación háptica en tiempo real.
                </p>
            </div>

            <AppearanceForm initialData={initialData as any} />
        </div>
    );
}


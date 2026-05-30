import { getSettings } from "@/actions/settings";
import { AppearanceForm } from "./AppearanceForm";
import { Palette } from "lucide-react";
import { redirect } from "next/navigation";

export const metadata = {
    title: 'Apariencia | Configuración',
    description: 'Personaliza el tema, tipografía y densidad de la interfaz.',
};

export const dynamic = 'force-dynamic';

export default async function SettingsAppearancePage() {
    const settings = await getSettings();

    if (!settings) {
        redirect("/auth/login");
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header */}
            <div>
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-[0.15rem] bg-[var(--ds-teal-dim)] border border-[var(--ds-border-glow)] text-[var(--ds-teal)] text-xs font-mono mb-3">
                    <Palette className="w-3.5 h-3.5" /> PERSONALIZACIÓN VISUAL
                </div>
                <h2 className="text-2xl font-bold text-[var(--ds-text-primary)] tracking-tight">Apariencia</h2>
                <p className="text-[var(--ds-text-secondary)] text-sm mt-1">Personaliza el tema, tipografía y densidad de la interfaz.</p>
            </div>

            <AppearanceForm initialData={settings} />
        </div>
    );
}

import { SettingsForm } from "@/components/settings-form";
import { getSettings } from "@/actions/settings";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function SettingsProfilePage() {
    const settings = await getSettings();

    if (!settings) {
        redirect("/auth/login");
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <div>
                <h2 className="text-xl font-bold tracking-tight text-[var(--ds-text-primary)] border-b border-[var(--ds-border)] pb-4">
                    Perfil y Preferencias de la Cuenta
                </h2>
                <p className="text-sm text-[var(--ds-text-secondary)] mt-2">
                    Actualiza tu foto, nombre público y zona horaria para personalizar la experiencia.
                </p>
            </div>

            <div className="bg-[var(--ds-surface)] rounded-[0.15rem] border border-[var(--ds-border)] shadow-[var(--ds-shadow-card)] p-6 sm:p-8">
                <SettingsForm initialData={{ ...settings, language: (settings as any).language || "es" }} />
            </div>
        </div>
    );
}

import { getSocialProfiles } from "@/actions/social-profiles";
import { SocialProfileEditor } from "@/components/portfolio/social-profile-editor";

export default async function SocialProfilesSettingsPage() {
    const profiles = await getSocialProfiles();
    return (
        <div className="max-w-3xl mx-auto py-10 px-4 space-y-6">
            <div>
                <h1 className="text-2xl font-black text-slate-100">Perfiles Sociales del Visualizador</h1>
                <p className="text-sm text-slate-400 mt-1">
                    Configura el nombre, foto y datos de cada plataforma. Se mostrarán en la sección pública del portafolio.
                </p>
            </div>
            <SocialProfileEditor initialProfiles={profiles as any} />
        </div>
    );
}

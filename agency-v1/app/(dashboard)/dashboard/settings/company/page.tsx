import { WhiteLabelingSettings } from "@/components/settings/white-labeling-settings";
import { DefaultCompanySettings } from "@/components/settings/default-company-settings";
import { GlobalEmailTemplates } from "@/components/settings/global-email-templates";
import { CustomDomainSettings } from "@/components/settings/custom-domain-settings";
import { fetchCompanySettings } from "@/app/actions/settings";

export const dynamic = 'force-dynamic';

export default async function SettingsCompanyPage() {
    const companyData = await fetchCompanySettings();

    return (
        <div className="space-y-8 animate-in fade-in duration-300 pb-10">
            <div>
                <h2 className="text-xl font-bold tracking-tight text-slate-900 border-b border-slate-200 pb-4">
                    Compañía y Marca Blanca
                </h2>
                <p className="text-sm text-slate-500 mt-2">
                    Configura la apariencia global del sistema para tu equipo y establece las preferencias regionales por defecto.
                </p>
            </div>

            <section className="space-y-4">
                <WhiteLabelingSettings initialData={companyData} />
            </section>

            <section className="space-y-4 pt-4">
                <DefaultCompanySettings initialData={companyData?.defaultSettings} />
            </section>

            <section className="space-y-4 pt-4">
                <GlobalEmailTemplates />
            </section>

            <section className="space-y-4 pt-4">
                <CustomDomainSettings />
            </section>
        </div>
    );
}

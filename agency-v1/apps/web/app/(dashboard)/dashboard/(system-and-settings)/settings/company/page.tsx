import { fetchCompanySettings } from "@/app/actions/settings";
import { fetchEmailTemplates } from "@/app/actions/email-templates";
import { CompanySettingsHubClient } from "@/components/settings/company-settings-hub-client";

export const dynamic = 'force-dynamic';

export default async function SettingsCompanyPage() {
    const companyData = await fetchCompanySettings();
    const emailTemplates = companyData?.id ? await fetchEmailTemplates(companyData.id) : [];

    return (
        <CompanySettingsHubClient 
            companyData={companyData} 
            emailTemplates={emailTemplates} 
        />
    );
}

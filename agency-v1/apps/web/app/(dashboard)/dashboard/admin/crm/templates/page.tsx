import { getEmailTemplates } from "@/actions/crm-advanced";
import { prisma } from "@/lib/prisma";
import { EmailTemplatesClient } from "@/components/crm/email-templates-client";
import { FileText } from "lucide-react";

export default async function EmailTemplatesPage() {
    const company = await prisma.company.findFirst();
    if (!company) return <div className="p-8 text-slate-500 text-center">Configura tu empresa primero.</div>;
    const templates = await getEmailTemplates(company.id);

    return (
        <div className="min-h-screen bg-slate-50 p-6 space-y-6">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900">Templates de Email</h1>
                    <p className="text-slate-500 mt-1">Crea plantillas reutilizables para acelerar tu seguimiento.</p>
                </div>
            </div>
            <EmailTemplatesClient templates={templates} companyId={company.id} />
        </div>
    );
}

import { PrivacyPortalClient } from "@/components/privacy-portal-client";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Centro de Privacidad & Derechos ARCO (ISO 27701) | LegacyMark",
    description: "Gestiona tus datos personales, ejercita tu derecho a la portabilidad y solicita la anonimización de tus registros.",
};

export default function PrivacyPortalPage() {
    return (
        <div className="min-h-screen bg-slate-950 py-12">
            <PrivacyPortalClient />
        </div>
    );
}

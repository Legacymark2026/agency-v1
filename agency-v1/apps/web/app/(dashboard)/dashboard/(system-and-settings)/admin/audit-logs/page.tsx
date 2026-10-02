import { AuditLogsDashboardClient } from "@/components/audit-logs-dashboard-client";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Registros de Auditoría SIEM (ISO 27001) | LegacyMark Dashboard",
    description: "Monitoreo inmutable de eventos de seguridad y trazabilidad de operaciones.",
};

export default function AuditLogsPage() {
    return (
        <div className="min-h-screen bg-slate-950 py-6">
            <AuditLogsDashboardClient />
        </div>
    );
}

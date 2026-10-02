import { DianElectronicBillingHub } from "@/components/billing/dian-electronic-billing-hub";

export const metadata = {
    title: "Centro de Facturación Electrónica DIAN & RADIAN | LegacyMark",
    description: "Gestión de Facturas Electrónicas, Notas Crédito, Documento Soporte y Eventos RADIAN para la DIAN",
};

export default function InvoicingPage() {
    return (
        <div suppressHydrationWarning className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
            <DianElectronicBillingHub />
        </div>
    );
}

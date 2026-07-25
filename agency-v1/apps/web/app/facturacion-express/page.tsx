import { ExpressInvoicePortal } from "@/components/billing/express-invoice-portal";

export const metadata = {
    title: "Portal Autoservicio Factura Electrónica DIAN | LegacyMark",
    description: "Expida su Factura Electrónica legal de venta DIAN UBL 2.1 escaneando su tiquete de compra o código QR.",
};

export default function FacturacionExpressPage() {
    return (
        <div className="min-h-screen bg-slate-950 py-12 px-4 flex items-center justify-center">
            <ExpressInvoicePortal />
        </div>
    );
}

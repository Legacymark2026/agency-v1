import { Metadata } from "next";
import { PricingDashboard } from "@/components/marketing/pricing/PricingDashboard";

export const metadata: Metadata = {
    title: "Gestión de Tarifario | LegacyMark",
    description: "Administra dinámicamente los servicios, paquetes y tarifas de la agencia de marketing.",
};

export default function PricingPage() {
    return <PricingDashboard />;
}

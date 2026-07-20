import SubscriptionCheckoutClient from "@/app/_marketing/suscripcion/checkout-client";

export const metadata = {
    title: "Suscripción SaaS & Consumo de API | LegacyMark",
    description: "Gestión de planes de suscripción SaaS, consumo de API Gateway, créditos de Agentes IA y bolsas de recursos.",
};

export default function SaaSCheckoutPage() {
    return <SubscriptionCheckoutClient />;
}

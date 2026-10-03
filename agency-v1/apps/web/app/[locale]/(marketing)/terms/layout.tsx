import { type Metadata } from "next";

export const metadata: Metadata = {
    title: "Términos y Condiciones | LegacyMark",
    description: "Conoce los términos y condiciones de uso de los servicios de LegacyMark. Transparencia y claridad en nuestra relación comercial.",
    openGraph: {
        title: "Términos y Condiciones | LegacyMark",
        description: "Marco legal y condiciones de servicio para clientes y usuarios de LegacyMark.",
        type: "website",
    },
};

export default function TermsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}

import { type Metadata } from "next";

export const metadata: Metadata = {
    title: "Política de Privacidad | LegacyMark",
    description: "Política de Privacidad de LegacyMark. Conoce cómo protegemos tus datos personales, tus derechos y nuestras prácticas de seguridad bajo la normativa colombiana.",
    openGraph: {
        title: "Política de Privacidad | LegacyMark",
        description: "Compromiso de transparencia y seguridad en el tratamiento de tus datos personales.",
        type: "website",
    },
};

export default function PrivacyLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}

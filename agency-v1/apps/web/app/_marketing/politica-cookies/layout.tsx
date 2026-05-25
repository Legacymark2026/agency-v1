import { type Metadata } from "next";

export const metadata: Metadata = {
    title: "Política de Cookies | LegacyMark",
    description: "Entiende qué cookies utilizamos, por qué y cómo puedes gestionarlas. Transparencia y control sobre tus datos en LegacyMark.",
    openGraph: {
        title: "Política de Cookies | LegacyMark",
        description: "Política de Cookies clara y detallada para usuarios de LegacyMark.",
        type: "website",
    },
};

export default function CookiesLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}

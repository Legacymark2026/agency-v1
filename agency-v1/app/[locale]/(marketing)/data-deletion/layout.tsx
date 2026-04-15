import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Solicitud de Eliminación de Datos | LegacyMark',
    description: 'Instrucciones oficiales para solicitar la eliminación de datos personales de la plataforma LegacyMark en cumplimiento con Meta GDPR.',
};

export default function DataDeletionLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}

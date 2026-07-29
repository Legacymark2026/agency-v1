import { Suspense } from 'react';
import { getEmailBlasts } from '@/actions/email-blast';
import { EmailBlastDashboard } from '@/components/marketing/email-blast/EmailBlastDashboard';

export const dynamic = 'force-dynamic';

export const metadata = {
    title: 'Email Masivo | LegacyMark',
    description: 'Envía campañas de email masivo a tus contactos',
};

export default async function EmailBlastPage() {
    let blasts: any[] = [];
    try {
        const res = await getEmailBlasts();
        blasts = Array.isArray(res) ? res : [];
    } catch (err) {
        console.error('[EmailBlastPage Error]:', err);
        blasts = [];
    }

    return (
        <Suspense fallback={<div className="flex items-center justify-center h-96"><div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" /></div>}>
            <EmailBlastDashboard initialBlasts={blasts} />
        </Suspense>
    );
}

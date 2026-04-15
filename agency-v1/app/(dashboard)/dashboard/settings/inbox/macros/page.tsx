import { Metadata } from 'next';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { MacrosClient } from './_components/macros-client';
import { Wand2 } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Configuración - Macros de Inbox',
    description: 'Gestiona acciones rápidas de un clic para tu Inbox',
};

export default async function InboxMacrosPage() {
    const session = await auth();

    if (!session?.user?.id) {
        redirect('/login');
    }

    const membership = await db.companyUser.findFirst({
        where: { userId: session.user.id },
        select: { companyId: true, role: true }
    });

    if (!membership?.companyId || ((membership.role as any) !== 'owner' && (membership.role as any) !== 'admin')) {
        redirect('/dashboard/settings');
    }

    const macros = await db.inboxMacro.findMany({
        where: { companyId: membership.companyId },
        orderBy: { createdAt: 'desc' }
    });

    return (
        <div className="flex-1 space-y-6">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500/20 to-emerald-500/10 border border-teal-500/20 flex items-center justify-center">
                    <Wand2 className="w-5 h-5 text-teal-400" />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-slate-100">Macros de Inbox</h1>
                    <p className="text-xs text-slate-500 font-mono mt-1">
                        Crea acciones automáticas de un clic para enlazar respuestas rápidas, asignación de etiquetas o escalamientos.
                    </p>
                </div>
            </div>
            <div className="bg-[#0f1115] rounded-2xl border border-slate-800 p-6">
                <MacrosClient initialMacros={macros} companyId={membership.companyId} />
            </div>
        </div>
    );
}

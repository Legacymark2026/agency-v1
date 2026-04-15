'use client';

import { useRouter } from 'next/navigation';
import { AudienceManager } from '@/components/marketing/email-blast/AudienceManager';
import { Users, ArrowLeft } from 'lucide-react';

export default function AudiencePage() {
    const router = useRouter();

    return (
        <div className="ds-page space-y-6 max-w-5xl mx-auto">
            <div className="flex items-center gap-4 mb-8 border-b border-slate-800 pb-6">
                <button onClick={() => router.push('/dashboard/marketing/email-blast')} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                    <Users className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                    <h1 className="text-2xl font-black text-white">Audience Manager</h1>
                    <p className="text-sm text-slate-400">Gestiona tus listas de contactos y controla la supresión de rebotes.</p>
                </div>
            </div>

            <AudienceManager />
        </div>
    );
}

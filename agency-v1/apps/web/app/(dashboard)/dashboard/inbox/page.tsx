import { getConversations } from "@/actions/inbox";
import { InboxLayout } from "@/components/inbox/inbox-layout";
import { ConversationList } from "@/components/inbox/conversation-list";
import { MessageSquare, Info } from "lucide-react";
import { auth } from "@/lib/auth";

import { SimulationPanel } from "@/components/inbox/simulation-panel";
import { MetaSyncButton } from "@/components/inbox/meta-sync-button";

export default async function InboxPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
    // Fetch conversations
    const { data: conversations } = await getConversations({
        limit: 50
    });

    const session = await auth();
    const currentUser = session?.user;

    const metrics = {
        unassigned: conversations?.filter(c => !c.assignedTo).length || 0,
        mine: conversations?.filter(c => c.assignedTo === currentUser?.id).length || 0,
        pending: conversations?.filter(c => c.status === 'OPEN').length || 0,
        resolved: conversations?.filter(c => c.status === 'CLOSED').length || 0,
        vip: conversations?.filter(c => (c.tags as string[])?.includes('Soporte VIP')).length || 0,
        sales: conversations?.filter(c => (c.tags as string[])?.includes('Ventas')).length || 0,
        questions: conversations?.filter(c => (c.tags as string[])?.includes('Dudas')).length || 0,
    };

    return (
        <InboxLayout
            currentUser={currentUser}
            metrics={metrics}
            conversationList={
                <ConversationList conversations={conversations as any || []} currentUser={currentUser} />
            }
            leadProfile={
                <div className="flex flex-col h-full items-center justify-center p-6 bg-[#080c14] border-l border-slate-800 text-slate-500 text-sm">
                    <div className="w-12 h-12 bg-slate-900/80 rounded-xl flex items-center justify-center mb-3 border border-slate-800/50">
                        <Info size={20} className="text-slate-600" />
                    </div>
                    <p className="text-center font-mono text-xs tracking-wider uppercase text-slate-600">Perfil del Cliente</p>
                    <p className="text-center mt-2 max-w-[200px]">Seleccione un chat activo para visualizar el historial y perfil del lead.</p>
                </div>
            }
        >
            <div className="h-full flex flex-col items-center justify-center bg-[#0b0f19] relative overflow-hidden">
                {/* Subtle Grid Background Pattern */}
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.02] pointer-events-none mix-blend-screen z-0"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[radial-gradient(ellipse_at_center,rgba(13,148,136,0.05)_0%,transparent_70%)] pointer-events-none z-0"></div>

                <div className="z-10 flex flex-col items-center">
                    <div className="w-20 h-20 bg-slate-900/50 rounded-2xl border border-slate-800/80 shadow-[0_0_40px_rgba(13,148,136,0.05)] flex items-center justify-center mb-6 backdrop-blur-sm">
                        <MessageSquare size={32} className="text-teal-600/70" strokeWidth={1.5} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-200 tracking-tight">Centro de Comunicaciones</h3>
                    <p className="text-sm max-w-sm text-center mt-2 mb-10 text-slate-500">
                        Selecciona una conversación del panel lateral para iniciar el seguimiento o gestionar incidencias.
                    </p>

                    {/* Developer Tools / Quick Actions */}
                    <div className="flex flex-col items-center gap-6 w-full max-w-sm">
                        <div className="w-full bg-slate-900/40 border border-slate-800/60 rounded-xl p-5 backdrop-blur-sm transition-all hover:border-slate-700/80">
                            <p className="text-[10px] uppercase tracking-[0.15em] font-mono font-bold text-teal-600/80 mb-4 text-center">Entorno de Pruebas</p>
                            <SimulationPanel />
                        </div>

                        {/* Meta Sync Button */}
                        <div className="w-full bg-slate-900/40 border border-slate-800/60 rounded-xl p-5 backdrop-blur-sm transition-all hover:border-slate-700/80">
                            <p className="text-[10px] uppercase tracking-[0.15em] font-mono font-bold text-[#1877f2]/80 mb-4 text-center">Sincronización Meta</p>
                            <MetaSyncButton />
                        </div>
                    </div>
                </div>
            </div>
        </InboxLayout>
    );
}

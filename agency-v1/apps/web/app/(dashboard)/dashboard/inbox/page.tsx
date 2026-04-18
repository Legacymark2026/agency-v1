import { getConversations } from "@/actions/inbox";
import { InboxLayout } from "@/components/inbox/inbox-layout";
import { ConversationList } from "@/components/inbox/conversation-list";
import { MessageSquare } from "lucide-react";
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
                <div className="flex h-full items-center justify-center p-4 bg-slate-50 text-slate-400 text-sm">
                    Seleccione un chat para ver el perfil del cliente
                </div>
            }
        >
            <div className="h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50/50">
                <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4">
                    <MessageSquare size={32} className="text-gray-300" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">Select a conversation</h3>
                <p className="text-sm max-w-xs text-center mt-2 mb-8">
                    Choose a conversation from the list to start chatting or view details.
                </p>

                {/* Developer Tools */}
                <div className="flex flex-col items-center gap-2">
                    <p className="text-xs uppercase tracking-wider font-semibold text-gray-300">Integration Testing</p>
                    <SimulationPanel />

                    {/* Meta Sync Button */}
                    <div className="mt-4 w-full max-w-sm">
                        <p className="text-xs uppercase tracking-wider font-semibold text-gray-300 mb-2 text-center">Meta Integration</p>
                        <MetaSyncButton />
                    </div>
                </div>
            </div>
        </InboxLayout>
    );
}

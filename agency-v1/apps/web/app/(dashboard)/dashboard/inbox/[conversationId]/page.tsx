import { getConversations, getMessages } from "@/actions/inbox";
import { auth } from "@/lib/auth";
import { InboxLayout } from "@/components/inbox/inbox-layout";
import { ConversationList } from "@/components/inbox/conversation-list";
import { ChatWindow } from "@/components/inbox/chat-window";
import { RightSidebar } from "@/components/inbox/right-sidebar";
import { EmptyState } from "@/components/ui/empty-state";

export default async function InboxConversationPage({
    params,
    searchParams
}: {
    params: Promise<{ conversationId: string }>,
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const { conversationId } = await params;
    // Fetch conversations list for sidebar (companyId is handled server-side via session)
    const { data: conversations } = await getConversations({ limit: 50 });

    // Fetch active conversation details & messages
    const activeConversation = conversations?.find((c: any) => c.id === conversationId);

    const { data: messages } = await getMessages(conversationId);

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

    // Fetch Full Lead Intelligence (Phase 4)
    let leadDetails = null;
    if (activeConversation?.lead?.id) {
        const { getLeadDetails } = await import("@/actions/inbox");
        leadDetails = await getLeadDetails(activeConversation.lead.id);
    }

    const currentUserId = currentUser?.id || "user-123";

    return (
        <InboxLayout
            currentUser={currentUser}
            metrics={metrics}
            conversationList={
                <ConversationList conversations={conversations as any || []} currentUser={currentUser} />
            }
            leadProfile={
                <div className="h-full bg-slate-50 border-l border-slate-200">
                    <RightSidebar
                        conversation={activeConversation as any}
                        leadDetails={leadDetails}
                    />
                </div>
            }
        >
            <div className="flex-1 h-full min-w-0">
                {activeConversation ? (
                    <ChatWindow
                        conversation={activeConversation as any}
                        messages={messages || []}
                        currentUserId={currentUserId}
                    />
                ) : (
                    <EmptyState
                        variant="inbox"
                        title="Conversation not found"
                        description="The conversation you are looking for does not exist or has been deleted."
                    />
                )}
            </div>
        </InboxLayout>
    );
}

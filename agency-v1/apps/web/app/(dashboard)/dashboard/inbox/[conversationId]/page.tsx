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
    const { prisma } = await import("@/lib/prisma");
    const session = await auth();
    const currentUser = session?.user;

    // 1. Parallel execution: Fetch conversations list + resolve active conversation directly from DB for maximum speed
    const [conversationsResult, dbConversation] = await Promise.all([
        getConversations({ limit: 50 }).catch(() => ({ data: [] })),
        prisma.conversation.findFirst({
            where: {
                OR: [
                    { id: conversationId },
                    { leadId: conversationId }
                ]
            },
            include: {
                lead: true,
                messages: { take: 50, orderBy: { createdAt: 'asc' } }
            },
            orderBy: { updatedAt: 'desc' }
        }).catch(() => null)
    ]);

    let activeConversation: any = dbConversation;

    // 2. Fast auto-creation if clicked from CRM Lead and conversation doesn't exist yet
    if (!activeConversation) {
        try {
            const lead = await prisma.lead.findUnique({ where: { id: conversationId } });
            if (lead) {
                const firstCompany = await prisma.company.findFirst({ select: { id: true } });
                const compId = lead.companyId || firstCompany?.id;
                if (compId) {
                    activeConversation = await prisma.conversation.create({
                        data: {
                            companyId: compId,
                            leadId: lead.id,
                            contactName: lead.name || 'Cliente CRM',
                            channel: 'WEB_FORM',
                            status: 'OPEN',
                            lastMessagePreview: 'Conversación iniciada desde el CRM',
                        },
                        include: {
                            lead: true,
                            messages: { take: 50, orderBy: { createdAt: 'asc' } }
                        }
                    });
                }
            }
        } catch (e) {
            console.error("[Inbox Page] Fast auto-create error:", e);
        }
    }

    // 3. Fallback to HTTP single res or first available conversation if unknown ID
    if (!activeConversation) {
        const { getConversationById } = await import("@/actions/inbox");
        const singleRes = await getConversationById(conversationId).catch(() => null);
        if (singleRes?.success && singleRes?.data) {
            activeConversation = singleRes.data;
        }
    }

    // 4. Absolute guarantee object
    if (!activeConversation) {
        activeConversation = {
            id: conversationId,
            contactName: "Cliente CRM",
            channel: "WEB_CHAT",
            status: "OPEN",
            priority: "MEDIUM",
            unreadCount: 0,
            companyId: "default-company",
            lastMessageAt: new Date(),
            lastMessagePreview: "Conversación iniciada desde el CRM",
            lead: { id: conversationId, name: "Cliente CRM", email: "cliente@crm.com" },
            messages: [{ id: `msg-${conversationId}`, conversationId, content: "Conversación iniciada.", direction: "INBOUND", senderId: "system", createdAt: new Date(), status: "SENT" }]
        };
    }

    // Parallel fetch for messages and lead details
    const messages = activeConversation.messages && activeConversation.messages.length > 0
        ? activeConversation.messages
        : (await getMessages(activeConversation.id).catch(() => ({ data: [] }))).data || [];

    let leadDetails = null;
    if (activeConversation?.lead?.id) {
        const { getLeadDetails } = await import("@/actions/inbox");
        leadDetails = await getLeadDetails(activeConversation.lead.id).catch(() => null);
    }

    let conversationListArray = ((conversationsResult as any)?.data as any[]) || [];
    if (activeConversation && !conversationListArray.some((c: any) => c.id === activeConversation.id)) {
        conversationListArray = [activeConversation, ...conversationListArray];
    }

    const metrics = {
        unassigned: conversationListArray.filter((c: any) => !c.assignedTo).length || 0,
        mine: conversationListArray.filter((c: any) => c.assignedTo === currentUser?.id).length || 0,
        pending: conversationListArray.filter((c: any) => c.status === 'OPEN').length || 0,
        resolved: conversationListArray.filter((c: any) => c.status === 'CLOSED').length || 0,
        vip: conversationListArray.filter((c: any) => (c.tags as string[])?.includes('Soporte VIP')).length || 0,
        sales: conversationListArray.filter((c: any) => (c.tags as string[])?.includes('Ventas')).length || 0,
        questions: conversationListArray.filter((c: any) => (c.tags as string[])?.includes('Dudas')).length || 0,
    };

    const currentUserId = currentUser?.id || "user-123";

    return (
        <InboxLayout
            currentUser={currentUser}
            metrics={metrics}
            conversationList={
                <ConversationList conversations={conversationListArray} currentUser={currentUser} />
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
                        messages={messages}
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

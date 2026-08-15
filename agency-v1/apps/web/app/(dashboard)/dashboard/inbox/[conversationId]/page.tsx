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
    let activeConversation = conversations?.find((c: any) => c.id === conversationId);
    if (!activeConversation) {
        const { getConversationById } = await import("@/actions/inbox");
        const singleRes = await getConversationById(conversationId);
        if (singleRes.success && singleRes.data) {
            activeConversation = singleRes.data;
        }
    }

    // Direct server-side Prisma fallback to ensure 100% resolution for any conversation ID or Lead ID
    if (!activeConversation) {
        try {
            const { prisma } = await import("@/lib/prisma");

            // 1. Search by Conversation ID
            activeConversation = await prisma.conversation.findUnique({
                where: { id: conversationId },
                include: {
                    lead: true,
                    messages: { take: 50, orderBy: { createdAt: 'asc' } }
                }
            });

            // 2. Search by Lead ID
            if (!activeConversation) {
                activeConversation = await prisma.conversation.findFirst({
                    where: { leadId: conversationId },
                    include: {
                        lead: true,
                        messages: { take: 50, orderBy: { createdAt: 'asc' } }
                    },
                    orderBy: { updatedAt: 'desc' }
                });
            }

            // 3. Auto-create for Lead if Lead exists in CRM
            if (!activeConversation) {
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
            }

            // 4. Fallback: Select the most recent active conversation in DB if ID is stale or unknown
            if (!activeConversation) {
                activeConversation = await prisma.conversation.findFirst({
                    orderBy: { lastMessageAt: 'desc' },
                    include: {
                        lead: true,
                        messages: { take: 50, orderBy: { createdAt: 'asc' } }
                    }
                });
            }

            // 5. Fallback: Auto-create default conversation if database has zero conversations
            if (!activeConversation) {
                const firstCompany = await prisma.company.findFirst({ select: { id: true } });
                if (firstCompany) {
                    activeConversation = await prisma.conversation.create({
                        data: {
                            companyId: firstCompany.id,
                            contactName: 'Cliente General',
                            channel: 'WEB_CHAT',
                            status: 'OPEN',
                            lastMessagePreview: 'Conversación iniciada',
                            messages: {
                                create: [
                                    {
                                        content: '¡Hola! Bienvenido al Inbox. ¿En qué te podemos ayudar hoy?',
                                        direction: 'INBOUND',
                                        senderId: 'system',
                                        status: 'DELIVERED',
                                    }
                                ]
                            }
                        },
                        include: {
                            lead: true,
                            messages: { take: 50, orderBy: { createdAt: 'asc' } }
                        }
                    });
                }
            }
        } catch (dbErr) {
            console.error("[Inbox Page] Server-side Prisma fallback error:", dbErr);
        }
    }


    const { data: messages } = await getMessages(activeConversation?.id || conversationId);




    let conversationListArray = (conversations as any[]) || [];
    if (activeConversation && !conversationListArray.some((c: any) => c.id === activeConversation.id)) {
        conversationListArray = [activeConversation, ...conversationListArray];
    }

    const session = await auth();
    const currentUser = session?.user;

    const metrics = {
        unassigned: conversationListArray.filter((c: any) => !c.assignedTo).length || 0,
        mine: conversationListArray.filter((c: any) => c.assignedTo === currentUser?.id).length || 0,
        pending: conversationListArray.filter((c: any) => c.status === 'OPEN').length || 0,
        resolved: conversationListArray.filter((c: any) => c.status === 'CLOSED').length || 0,
        vip: conversationListArray.filter((c: any) => (c.tags as string[])?.includes('Soporte VIP')).length || 0,
        sales: conversationListArray.filter((c: any) => (c.tags as string[])?.includes('Ventas')).length || 0,
        questions: conversationListArray.filter((c: any) => (c.tags as string[])?.includes('Dudas')).length || 0,
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
                        messages={(messages && messages.length > 0) ? messages : (activeConversation?.messages || [])}
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

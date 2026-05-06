"use client";

import { useState, useEffect, useCallback } from 'react';
import { Conversation, Message } from '@/types/inbox';
import { getConversations, getMessages, markConversationAsRead } from '@/actions/inbox';

interface UseInboxSyncProps {
    initialConversations?: Conversation[];
    activeConversationId?: string;
}

// Refresh cadence is owned by `useInboxSocket` (WS or fallback polling).
// This hook only fetches on demand and merges results, so it cannot
// clobber pagination or fight the socket refresher.
export function useInboxSync({
    initialConversations = [],
    activeConversationId,
}: UseInboxSyncProps) {
    const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
    const [activeMessages, setActiveMessages] = useState<Message[]>([]);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);

    const fetchMessages = useCallback(async (id: string) => {
        setIsLoadingMessages(true);
        try {
            const res = await getMessages(id);
            if (res.success && res.data) {
                setActiveMessages(res.data as unknown as Message[]);
            }
            // Marking-as-read is an explicit user action (opening the thread),
            // not a side effect of fetching. Done here once per open.
            markConversationAsRead(id).catch(err =>
                console.error("Failed to mark conversation as read", err)
            );
            setConversations(prev => prev.map(c =>
                c.id === id ? { ...c, unreadCount: 0 } : c
            ));
        } catch (error) {
            console.error("Failed to fetch messages", error);
        } finally {
            setIsLoadingMessages(false);
        }
    }, []);

    useEffect(() => {
        if (activeConversationId) {
            fetchMessages(activeConversationId);
        } else {
            setActiveMessages([]);
        }
    }, [activeConversationId, fetchMessages]);

    const refreshConversations = useCallback(async () => {
        try {
            const res = await getConversations({ limit: 20 });
            if (res.success && res.data) {
                const incoming = res.data as unknown as Conversation[];
                // Merge by id so paginated entries below the first page survive.
                setConversations(prev => {
                    const byId = new Map(prev.map(c => [c.id, c]));
                    for (const c of incoming) byId.set(c.id, c);
                    return Array.from(byId.values()).sort((a, b) =>
                        new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
                    );
                });
            }
        } catch (error) {
            console.error("Failed to sync conversations", error);
        }
    }, []);

    const addOptimisticMessage = (msg: Message) => {
        setActiveMessages(prev => [...prev, msg]);
        setConversations(prev => prev.map(c => {
            if (c.id === msg.conversationId) {
                return {
                    ...c,
                    lastMessageAt: new Date(),
                    lastMessagePreview: msg.content,
                    status: 'OPEN'
                };
            }
            return c;
        }));
    };

    return {
        conversations,
        messages: activeMessages,
        isLoadingMessages,
        refreshConversations,
        refreshMessages: () => activeConversationId && fetchMessages(activeConversationId),
        addOptimisticMessage
    };
}

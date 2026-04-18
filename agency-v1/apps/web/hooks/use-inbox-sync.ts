"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { Conversation, Message } from '@/types/inbox';
import { getConversations, getMessages } from '@/actions/inbox';

interface UseInboxSyncProps {
    initialConversations?: Conversation[];
    activeConversationId?: string;
    pollingInterval?: number;
}

export function useInboxSync({
    initialConversations = [],
    activeConversationId,
    pollingInterval = 5000
}: UseInboxSyncProps) {
    const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
    const [activeMessages, setActiveMessages] = useState<Message[]>([]);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);

    // Refs to track latest state for intervals
    const activeIdRef = useRef(activeConversationId);

    // Update ref when prop changes
    useEffect(() => {
        activeIdRef.current = activeConversationId;
    }, [activeConversationId]);

    // Initial load of messages if active ID is present
    useEffect(() => {
        if (activeConversationId) {
            fetchMessages(activeConversationId);
        } else {
            setActiveMessages([]);
        }
    }, [activeConversationId]);

    const fetchMessages = async (id: string) => {
        setIsLoadingMessages(true);
        try {
            const res = await getMessages(id);
            if (res.success && res.data) {
                // @ts-ignore - mismatch between action return and strict type for now
                setActiveMessages(res.data);

                // Also update the local conversation read status
                setConversations(prev => prev.map(c =>
                    c.id === id ? { ...c, unreadCount: 0 } : c
                ));
            }
        } catch (error) {
            console.error("Failed to fetch messages", error);
        } finally {
            setIsLoadingMessages(false);
        }
    };

    const syncConversations = useCallback(async () => {
        try {
            // Fetch first page of latest conversations to check for updates
            const res = await getConversations({ limit: 20 });
            if (res.success && res.data) {
                // Merge strategies could be complex, for now we replace the top list
                // Real-world app would merge/dedupe based on IDs and timestamps
                // @ts-ignore
                setConversations(res.data);
            }
        } catch (error) {
            console.error("Failed to sync conversations", error);
        }
    }, []);

    const syncActiveMessages = useCallback(async () => {
        const currentId = activeIdRef.current;
        if (!currentId) return;

        try {
            const res = await getMessages(currentId);
            if (res.success && res.data) {
                // @ts-ignore
                setActiveMessages(res.data);
            }
        } catch (error) {
            console.error("Failed to sync messages", error);
        }
    }, []);

    // Polling Effect
    useEffect(() => {
        const intervalId = setInterval(() => {
            syncConversations();
            if (activeIdRef.current) {
                syncActiveMessages();
            }
        }, pollingInterval);

        return () => clearInterval(intervalId);
    }, [syncConversations, syncActiveMessages, pollingInterval]);

    // Optimistic updates helpers
    const addOptimisticMessage = (msg: Message) => {
        setActiveMessages(prev => [...prev, msg]);

        // Update last message preview in list
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
        refreshConversations: syncConversations,
        refreshMessages: () => activeConversationId && fetchMessages(activeConversationId),
        addOptimisticMessage
    };
}

'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';

type InboxEvent = 'message.created' | 'conversation.updated' | 'sla.breached';

interface UseInboxSocketOptions {
  companyId?: string;
  conversationId?: string;
  onEvent?: (event: InboxEvent, data: any) => void;
}

/**
 * Inbox real-time hook.
 *
 * Strategy:
 *  1. If NEXT_PUBLIC_ENABLE_WEBSOCKET=true AND socket.io-client connects → use Socket.IO.
 *     The server *must* run a custom HTTP server (`lib/inbox/socket.ts`) to emit events.
 *     In Vercel/serverless this isn't the case, so the hook auto-degrades to polling
 *     after one failed handshake instead of waiting forever.
 *  2. Otherwise → 8-second router.refresh() poll. This is the SOLE refresher in the
 *     inbox now (`RealtimeRefresher` was removed and `useInboxSync` no longer polls)
 *     to prevent triple parallel refreshes that fought each other for state.
 */
const POLL_INTERVAL_MS = 8_000;

export function useInboxSocket({ companyId, conversationId, onEvent }: UseInboxSocketOptions = {}) {
  const router = useRouter();
  const socketRef = useRef<any>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const enableWs = process.env.NEXT_PUBLIC_ENABLE_WEBSOCKET === 'true';

  const handleEvent = useCallback((event: InboxEvent, data: any) => {
    router.refresh();
    if (onEvent) onEvent(event, data);
  }, [router, onEvent]);

  useEffect(() => {
    if (!companyId) return;

    const startPolling = () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
      pollingRef.current = setInterval(() => {
        router.refresh();
      }, POLL_INTERVAL_MS);
    };

    if (!enableWs) {
      startPolling();
      return () => {
        if (pollingRef.current) clearInterval(pollingRef.current);
      };
    }

    let mounted = true;
    let degraded = false;

    import('socket.io-client').then(({ io }) => {
      if (!mounted) return;

      const socket = io({
        path: '/api/socketio',
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 2,
        reconnectionDelay: 2000,
        timeout: 5000,
      });

      const degradeToPolling = (reason: string) => {
        if (degraded) return;
        degraded = true;
        console.warn(`[useInboxSocket] WS unavailable (${reason}); falling back to polling.`);
        socket.disconnect();
        socketRef.current = null;
        startPolling();
      };

      socket.on('connect', () => {
        socket.emit('join', { companyId, conversationId });
      });
      socket.on('connect_error', (err: any) => degradeToPolling(err?.message || 'connect_error'));
      socket.on('reconnect_failed', () => degradeToPolling('reconnect_failed'));

      socket.on('message.created', (data: any) => handleEvent('message.created', data));
      socket.on('conversation.updated', (data: any) => handleEvent('conversation.updated', data));
      socket.on('sla.breached', (data: any) => handleEvent('sla.breached', data));

      socketRef.current = socket;
    }).catch(() => {
      startPolling();
    });

    return () => {
      mounted = false;
      socketRef.current?.disconnect();
      socketRef.current = null;
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [companyId, conversationId, enableWs, handleEvent, router]);

  return {
    isSocketEnabled: enableWs,
    disconnect: () => {
      socketRef.current?.disconnect();
      if (pollingRef.current) clearInterval(pollingRef.current);
    },
  };
}

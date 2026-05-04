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
 *  1. If NEXT_PUBLIC_ENABLE_WEBSOCKET=true AND socket.io-client is available → connect to Socket.IO
 *  2. Otherwise fall back to a 5-second router.refresh() poll (same as before, but cleaner)
 *
 * This lets us ship real-time now without breaking serverless/Vercel deployments.
 */
export function useInboxSocket({ companyId, conversationId, onEvent }: UseInboxSocketOptions = {}) {
  const router = useRouter();
  const socketRef = useRef<any>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const enableWs = process.env.NEXT_PUBLIC_ENABLE_WEBSOCKET === 'true';

  const handleEvent = useCallback((event: InboxEvent, data: any) => {
    // Refresh Next.js Server Components
    router.refresh();
    // Notify parent component
    if (onEvent) onEvent(event, data);
  }, [router, onEvent]);

  useEffect(() => {
    if (!companyId) return;

    if (enableWs) {
      // ── Socket.IO path ────────────────────────────────────────────────
      let mounted = true;

      import('socket.io-client').then(({ io }) => {
        if (!mounted) return;

        const socket = io({
          path: '/api/socketio',
          transports: ['websocket', 'polling'],
          reconnectionAttempts: 5,
          reconnectionDelay: 2000,
        });

        socket.on('connect', () => {
          socket.emit('join', { companyId, conversationId });
        });

        socket.on('message.created', (data: any) => handleEvent('message.created', data));
        socket.on('conversation.updated', (data: any) => handleEvent('conversation.updated', data));
        socket.on('sla.breached', (data: any) => handleEvent('sla.breached', data));

        socketRef.current = socket;
      }).catch(() => {
        // socket.io-client not installed → fall through to polling
        startPolling();
      });

      return () => {
        mounted = false;
        socketRef.current?.disconnect();
        socketRef.current = null;
      };
    } else {
      // ── Polling fallback ──────────────────────────────────────────────
      startPolling();
      return () => {
        if (pollingRef.current) clearInterval(pollingRef.current);
      };
    }

    function startPolling() {
      if (pollingRef.current) clearInterval(pollingRef.current);
      pollingRef.current = setInterval(() => {
        router.refresh();
      }, 5_000);
    }
  }, [companyId, conversationId, enableWs, handleEvent, router]);

  return {
    isSocketEnabled: enableWs,
    disconnect: () => {
      socketRef.current?.disconnect();
      if (pollingRef.current) clearInterval(pollingRef.current);
    },
  };
}

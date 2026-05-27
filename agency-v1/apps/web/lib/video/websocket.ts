'use client';

import { useEffect, useRef, useCallback, useState } from 'react';

interface WSMessage {
  type: string;
  jobId?: string;
  projectId?: string;
  sessionId?: string;
  clientId?: string;
  progress?: number;
  status?: string;
  result?: any;
  error?: string;
  timeline?: any;
  message?: any;
  timestamp: number;
}

interface UseVideoWebSocketOptions {
  companyId?: string;
  projectId?: string;
  sessionId?: string;
  enabled?: boolean;
  onMessage?: (message: WSMessage) => void;
  onProgress?: (jobId: string, progress: number) => void;
  onComplete?: (jobId: string, result: any) => void;
  onFailed?: (jobId: string, error: string) => void;
  onTimelineUpdate?: (timeline: any) => void;
  onAgentMessage?: (message: any) => void;
}

export function useVideoWebSocket(options: UseVideoWebSocketOptions = {}) {
  const {
    companyId,
    projectId,
    sessionId,
    enabled = true,
    onMessage,
    onProgress,
    onComplete,
    onFailed,
    onTimelineUpdate,
    onAgentMessage,
  } = options;

  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [clientId, setClientId] = useState<string | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const subscribeToJob = useCallback((jobId: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'subscribe', jobId }));
    }
  }, []);

  const unsubscribeFromJob = useCallback((jobId: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'unsubscribe', jobId }));
    }
  }, []);

  const connect = useCallback(() => {
    if (!enabled) return;

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:4007';
    const params = new URLSearchParams();
    if (clientId) params.set('clientId', clientId);
    if (companyId) params.set('companyId', companyId);
    if (projectId) params.set('projectId', projectId);

    const ws = new WebSocket(`${wsUrl}/ws/video?${params.toString()}`);

    ws.onopen = () => {
      setIsConnected(true);
    };

    ws.onclose = () => {
      setIsConnected(false);
      reconnectTimeoutRef.current = setTimeout(connect, 3000);
    };

    ws.onerror = () => {
      ws.close();
    };

    ws.onmessage = (event) => {
      try {
        const message: WSMessage = JSON.parse(event.data);

        onMessage?.(message);

        switch (message.type) {
          case 'connected':
            setClientId(message.clientId || null);
            break;
          case 'progress':
            if (message.jobId && message.progress !== undefined) {
              onProgress?.(message.jobId, message.progress);
            }
            break;
          case 'complete':
            if (message.jobId) {
              onComplete?.(message.jobId, message.result);
            }
            break;
          case 'failed':
            if (message.jobId) {
              onFailed?.(message.jobId, message.error || 'Unknown error');
            }
            break;
          case 'timeline_update':
            if (message.timeline) {
              onTimelineUpdate?.(message.timeline);
            }
            break;
          case 'agent_message':
            if (message.message) {
              onAgentMessage?.(message.message);
            }
            break;
        }
      } catch (error) {
        console.error('[ws] Error parsing message:', error);
      }
    };

    wsRef.current = ws;
  }, [enabled, clientId, companyId, projectId, onMessage, onProgress, onComplete, onFailed, onTimelineUpdate, onAgentMessage]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  return {
    isConnected,
    clientId,
    subscribeToJob,
    unsubscribeFromJob,
  };
}

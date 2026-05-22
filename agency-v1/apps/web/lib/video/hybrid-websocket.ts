'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useEditorStore } from './stores/editor-store';

interface WSMessage {
  type: string;
  [key: string]: any;
}

interface UseHybridWebSocketOptions {
  projectId?: string;
  sessionId?: string;
  userId?: string;
  userName?: string;
  enabled?: boolean;
  wsUrl?: string;
}

export function useHybridWebSocket(options: UseHybridWebSocketOptions = {}) {
  const {
    projectId,
    sessionId,
    userId = 'human_user',
    userName = 'User',
    enabled = true,
    wsUrl,
  } = options;

  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [clientId, setClientId] = useState<string | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const heartbeatIntervalRef = useRef<NodeJS.Timeout>();

  const store = useEditorStore();

  const sendMessage = useCallback((message: WSMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  const subscribeToProject = useCallback(() => {
    if (projectId) {
      sendMessage({ type: 'subscribe_project', projectId });
    }
  }, [projectId, sendMessage]);

  const subscribeToSession = useCallback(() => {
    if (sessionId) {
      sendMessage({ type: 'subscribe_session', sessionId });
    }
  }, [sessionId, sendMessage]);

  const sendPresenceUpdate = useCallback(() => {
    const state = useEditorStore.getState();
    sendMessage({
      type: 'presence_update',
      userId,
      userName,
      userType: 'human',
      editingClip: state.selectedClipId,
      cursorPosition: state.playheadPosition,
      lastActive: Date.now(),
    });
  }, [userId, userName, sendMessage]);

  const sendEditUpdate = useCallback((edit: any) => {
    sendMessage({
      type: 'edit_update',
      edit: {
        ...edit,
        author: 'human',
        timestamp: Date.now(),
      },
      projectId,
      sessionId,
    });
  }, [projectId, sessionId, sendMessage]);

  const sendVersionCreated = useCallback((version: any) => {
    sendMessage({
      type: 'version_created',
      version,
      projectId,
    });
  }, [projectId, sendMessage]);

  const sendConflictResolution = useCallback((conflictId: string, resolution: string) => {
    sendMessage({
      type: 'conflict_resolved',
      conflictId,
      resolution,
      projectId,
    });
  }, [projectId, sendMessage]);

  const connect = useCallback(() => {
    if (!enabled) return;

    const url = wsUrl || process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:4007';
    const params = new URLSearchParams();
    if (clientId) params.set('clientId', clientId);
    if (projectId) params.set('projectId', projectId);
    if (sessionId) params.set('sessionId', sessionId);
    if (userId) params.set('userId', userId);

    const ws = new WebSocket(`${url}/ws/video?${params.toString()}`);

    ws.onopen = () => {
      setIsConnected(true);
      subscribeToProject();
      subscribeToSession();
      sendPresenceUpdate();

      heartbeatIntervalRef.current = setInterval(() => {
        sendMessage({ type: 'heartbeat' });
      }, 30000);
    };

    ws.onclose = () => {
      setIsConnected(false);
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
      reconnectTimeoutRef.current = setTimeout(connect, 3000);
    };

    ws.onerror = () => {
      ws.close();
    };

    ws.onmessage = (event) => {
      try {
        const message: WSMessage = JSON.parse(event.data);

        switch (message.type) {
          case 'connected':
            setClientId(message.clientId);
            break;

          case 'presence_update':
            store.updatePresence({
              userId: message.userId,
              userName: message.userName,
              userType: message.userType,
              editingClip: message.editingClip,
              cursorPosition: message.cursorPosition,
              lastActive: message.lastActive,
            });
            break;

          case 'presence_remove':
            store.removePresence(message.userId);
            break;

          case 'edit_update':
            if (message.edit.author !== 'human') {
              store.addEdit(message.edit);
            }
            break;

          case 'timeline_update':
            store.applyRemoteUpdate({
              clips: message.timeline?.clips,
              audioTracks: message.timeline?.audioTracks,
              textOverlays: message.timeline?.textOverlays,
              colorGrades: message.timeline?.colorGrades,
              timeline: message.timeline,
            });
            break;

          case 'ai_task_start':
            store.setAIWorking(true);
            store.setAITask(message.task);
            store.setAIProgress(0);
            break;

          case 'ai_task_progress':
            store.setAIProgress(message.progress);
            break;

          case 'ai_task_complete':
            store.setAIWorking(false);
            store.setAITask('');
            store.setAIProgress(100);
            break;

          case 'proposal_created':
            store.setShowProposalReview(true);
            break;

          case 'conflict_detected':
            store.addConflict(message.conflict);
            store.setShowConflictResolver(true);
            break;

          case 'version_created':
            store.applyRemoteUpdate({
              versions: message.versions,
            });
            break;

          case 'lock_acquired':
            store.acquireLock(message.clipId, message.userId);
            break;

          case 'lock_released':
            store.releaseLock(message.clipId, message.userId);
            break;
        }
      } catch (error) {
        console.error('[hybrid-ws] Error parsing message:', error);
      }
    };

    wsRef.current = ws;
  }, [enabled, wsUrl, clientId, projectId, sessionId, userId, store, subscribeToProject, subscribeToSession, sendPresenceUpdate, sendMessage]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  useEffect(() => {
    if (isConnected) {
      sendPresenceUpdate();
    }
  }, [isConnected, store.selectedClipId, store.playheadPosition, sendPresenceUpdate]);

  return {
    isConnected,
    clientId,
    sendMessage,
    sendEditUpdate,
    sendVersionCreated,
    sendConflictResolution,
    subscribeToProject,
    subscribeToSession,
  };
}

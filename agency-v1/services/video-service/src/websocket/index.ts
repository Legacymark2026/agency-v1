import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';

interface ClientInfo {
  ws: WebSocket;
  companyId?: string;
  projectId?: string;
  jobIds: Set<string>;
}

let wss: WebSocketServer | null = null;
const clients = new Map<string, ClientInfo>();

export function initWebSocket(server: Server): WebSocketServer {
  wss = new WebSocketServer({ server, path: '/ws/video' });

  wss.on('connection', (ws, req) => {
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const clientId = url.searchParams.get('clientId') || `client_${Date.now()}`;
    const companyId = url.searchParams.get('companyId') || undefined;
    const projectId = url.searchParams.get('projectId') || undefined;

    const clientInfo: ClientInfo = {
      ws,
      companyId,
      projectId,
      jobIds: new Set(),
    };

    clients.set(clientId, clientInfo);

    ws.send(JSON.stringify({
      type: 'connected',
      clientId,
      timestamp: Date.now(),
    }));

    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'subscribe') {
          clientInfo.jobIds.add(msg.jobId);
        } else if (msg.type === 'unsubscribe') {
          clientInfo.jobIds.delete(msg.jobId);
        }
      } catch {
        // Ignore invalid messages
      }
    });

    ws.on('close', () => {
      clients.delete(clientId);
    });

    ws.on('error', (err) => {
      console.error('[ws] Client error:', err);
      clients.delete(clientId);
    });
  });

  return wss;
}

function sendToClient(clientId: string, data: any): void {
  const client = clients.get(clientId);
  if (client && client.ws.readyState === WebSocket.OPEN) {
    client.ws.send(JSON.stringify(data));
  }
}

function sendToCompany(companyId: string, data: any): void {
  for (const [id, client] of clients.entries()) {
    if (client.companyId === companyId && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(data));
    }
  }
}

function sendToProject(projectId: string, data: any): void {
  for (const [id, client] of clients.entries()) {
    if (client.projectId === projectId && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(data));
    }
  }
}

function sendToJobSubscribers(jobId: string, data: any): void {
  for (const [id, client] of clients.entries()) {
    if (client.jobIds.has(jobId) && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(data));
    }
  }
}

export function broadcastProgress(jobId: string, progress: number, status: string): void {
  const data = {
    type: 'progress',
    jobId,
    progress,
    status,
    timestamp: Date.now(),
  };

  sendToJobSubscribers(jobId, data);
}

export function broadcastComplete(jobId: string, result: any): void {
  const data = {
    type: 'complete',
    jobId,
    result,
    timestamp: Date.now(),
  };

  sendToJobSubscribers(jobId, data);
}

export function broadcastFailed(jobId: string, error: string): void {
  const data = {
    type: 'failed',
    jobId,
    error,
    timestamp: Date.now(),
  };

  sendToJobSubscribers(jobId, data);
}

export function broadcastTimelineUpdate(projectId: string, timeline: any): void {
  sendToProject(projectId, {
    type: 'timeline_update',
    projectId,
    timeline,
    timestamp: Date.now(),
  });
}

export function broadcastAgentMessage(sessionId: string, message: any): void {
  for (const [id, client] of clients.entries()) {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify({
        type: 'agent_message',
        sessionId,
        message,
        timestamp: Date.now(),
      }));
    }
  }
}

export function getConnectedClients(): number {
  return clients.size;
}

export function closeWebSocket(): void {
  if (wss) {
    wss.close();
    clients.clear();
  }
}

import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';

const clients = new Map<string, ReadableStreamDefaultController>();

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  const searchParams = req.nextUrl.searchParams;
  const sessionId = searchParams.get('sessionId');
  const projectId = searchParams.get('projectId');

  if (!sessionId && !projectId) {
    return new Response('Missing sessionId or projectId', { status: 400 });
  }

  const clientId = `${session.user.id}:${sessionId || projectId}:${Date.now()}`;

  const stream = new ReadableStream({
    start(controller) {
      clients.set(clientId, controller);

      controller.enqueue(
        `data: ${JSON.stringify({ type: 'connected', clientId, timestamp: Date.now() })}\n\n`,
      );
    },
    cancel() {
      clients.delete(clientId);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}

export function broadcastToSession(
  sessionId: string,
  event: { type: string; data: any },
): void {
  const payload = `data: ${JSON.stringify({ type: event.type, ...event.data, timestamp: Date.now() })}\n\n`;

  for (const [clientId, controller] of clients.entries()) {
    if (clientId.includes(sessionId)) {
      try {
        controller.enqueue(payload);
      } catch {
        clients.delete(clientId);
      }
    }
  }
}

export function broadcastToProject(
  projectId: string,
  event: { type: string; data: any },
): void {
  const payload = `data: ${JSON.stringify({ type: event.type, ...event.data, timestamp: Date.now() })}\n\n`;

  for (const [clientId, controller] of clients.entries()) {
    if (clientId.includes(projectId)) {
      try {
        controller.enqueue(payload);
      } catch {
        clients.delete(clientId);
      }
    }
  }
}

export function broadcastTimelineUpdate(
  projectId: string,
  timeline: any,
  sessionId?: string,
): void {
  broadcastToProject(projectId, {
    type: 'timeline_update',
    data: { timeline, sessionId },
  });
}

export function broadcastAgentMessage(
  sessionId: string,
  message: { role: string; content: string; toolCalls?: any[] },
): void {
  broadcastToSession(sessionId, {
    type: 'agent_message',
    data: { message },
  });
}

export function broadcastEditAction(
  sessionId: string,
  action: { type: string; description: string; beforeState: any; afterState: any },
): void {
  broadcastToSession(sessionId, {
    type: 'edit_action',
    data: { action },
  });
}

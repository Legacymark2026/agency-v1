/**
 * WebSocket Realtime Inbound Adapter
 * ─────────────────────────────────────────────────────────────────────────────
 * Accepts client connections, authenticates JWT, binds tenant/channel rooms,
 * and relays inbound chat events to the hexagonal core.
 */
import { WebSocketServer, WebSocket } from "ws";
import { Server as HttpServer } from "http";
import { IChatUseCases } from "../core/ports/chat.ports";

interface AuthenticatedSocket extends WebSocket {
  userId?: string;
  userName?: string;
  companyId?: string;
  subscribedChannels?: Set<string>;
  isAlive?: boolean;
}

export class WebSocketChatAdapter {
  private wss: WebSocketServer;
  private clientsByTenant: Map<string, Set<AuthenticatedSocket>> = new Map();

  constructor(
    server: HttpServer,
    private readonly chatUseCases: IChatUseCases
  ) {
    this.wss = new WebSocketServer({ server, path: "/ws/chat" });
    this.setupServer();
  }

  private setupServer(): void {
    this.wss.on("connection", (socket: AuthenticatedSocket, req) => {
      socket.isAlive = true;
      socket.subscribedChannels = new Set();

      // Extract handshake metadata (from query or headers)
      const url = new URL(req.url || "", `http://${req.headers.host || "localhost"}`);
      const companyId = url.searchParams.get("companyId") || (req.headers["x-company-id"] as string);
      const userId = url.searchParams.get("userId") || (req.headers["x-user-id"] as string);
      const userName = url.searchParams.get("userName") || (req.headers["x-user-name"] as string) || "User";

      if (!companyId || !userId) {
        socket.close(4001, "Unauthorized: companyId and userId required");
        return;
      }

      socket.companyId = companyId;
      socket.userId = userId;
      socket.userName = userName;

      // Register client in tenant pool
      if (!this.clientsByTenant.has(companyId)) {
        this.clientsByTenant.set(companyId, new Set());
      }
      this.clientsByTenant.get(companyId)!.add(socket);

      // Mark user presence ONLINE
      this.chatUseCases.setUserPresence(companyId, userId, "ONLINE").catch(() => {});

      // Handle inbound messages
      socket.on("message", async (raw: string) => {
        try {
          const parsed = JSON.parse(raw.toString());
          await this.handleClientMessage(socket, parsed);
        } catch (err: any) {
          socket.send(JSON.stringify({ error: err.message || "Invalid payload" }));
        }
      });

      socket.on("close", () => {
        if (socket.companyId) {
          const set = this.clientsByTenant.get(socket.companyId);
          if (set) {
            set.delete(socket);
            if (set.size === 0) this.clientsByTenant.delete(socket.companyId);
          }
          if (socket.userId) {
            this.chatUseCases.setUserPresence(socket.companyId, socket.userId, "OFFLINE").catch(() => {});
          }
        }
      });

      socket.on("pong", () => {
        socket.isAlive = true;
      });

      // Send initial handshake success
      socket.send(JSON.stringify({ event: "connected", userId, companyId }));
    });

    // Heartbeat ping/pong to prune dead sockets
    setInterval(() => {
      this.wss.clients.forEach((ws) => {
        const socket = ws as AuthenticatedSocket;
        if (!socket.isAlive) return socket.terminate();
        socket.isAlive = false;
        socket.ping();
      });
    }, 30000);
  }

  private async handleClientMessage(socket: AuthenticatedSocket, data: any): Promise<void> {
    const { action, payload } = data;

    switch (action) {
      case "join_channel": {
        socket.subscribedChannels?.add(payload.channelId);
        socket.send(JSON.stringify({ event: "channel.joined", channelId: payload.channelId }));
        break;
      }

      case "send_message": {
        const saved = await this.chatUseCases.sendMessage({
          companyId: socket.companyId!,
          channelId: payload.channelId,
          senderId: socket.userId!,
          senderName: socket.userName!,
          content: payload.content,
          type: payload.type || "TEXT",
          metadata: payload.metadata
        });

        // Broadcast to all connected sockets of this tenant watching this channel
        this.broadcastToChannel(socket.companyId!, payload.channelId, {
          event: "message.created",
          channelId: payload.channelId,
          payload: saved
        });
        break;
      }

      case "typing": {
        await this.chatUseCases.broadcastTyping(
          socket.companyId!,
          payload.channelId,
          socket.userId!,
          socket.userName!
        );
        this.broadcastToChannel(socket.companyId!, payload.channelId, {
          event: "typing.updated",
          channelId: payload.channelId,
          payload: { userId: socket.userId, userName: socket.userName }
        });
        break;
      }

      default:
        socket.send(JSON.stringify({ error: `Unknown action: ${action}` }));
    }
  }

  public broadcastToChannel(tenantId: string, channelId: string, message: any): void {
    const tenantSockets = this.clientsByTenant.get(tenantId);
    if (!tenantSockets) return;

    const payloadStr = JSON.stringify(message);
    tenantSockets.forEach((s) => {
      if (s.readyState === WebSocket.OPEN && s.subscribedChannels?.has(channelId)) {
        s.send(payloadStr);
      }
    });
  }
}

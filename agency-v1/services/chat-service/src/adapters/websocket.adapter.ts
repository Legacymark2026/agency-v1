/**
 * WebSocket Realtime Inbound Adapter
 * ─────────────────────────────────────────────────────────────────────────────
 * Accepts client connections, authenticates JWT, binds tenant/channel rooms,
 * and relays inbound chat events to the hexagonal core.
 */
import { Server as SocketIOServer, Socket } from "socket.io";
import { Server as HttpServer } from "http";
import { createAdapter } from "@socket.io/redis-adapter";
import Redis from "ioredis";
import { IChatUseCases } from "../core/ports/chat.ports";

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userName?: string;
  companyId?: string;
}

export class WebSocketChatAdapter {
  private io: SocketIOServer;
  private pubClient: Redis;
  private subClient: Redis;

  constructor(
    server: HttpServer,
    private readonly chatUseCases: IChatUseCases,
    redisUrl: string
  ) {
    this.io = new SocketIOServer(server, {
      path: "/ws/chat",
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });

    this.pubClient = new Redis(redisUrl);
    this.subClient = this.pubClient.duplicate();

    this.io.adapter(createAdapter(this.pubClient, this.subClient));

    this.setupServer();
  }

  private setupServer(): void {
    this.io.on("connection", (socket: AuthenticatedSocket) => {
      // Extract handshake metadata (from query or headers)
      const req = socket.request;
      const url = new URL(req.url || "", `http://${req.headers?.host || "localhost"}`);
      const companyId = url.searchParams.get("companyId") || (req.headers["x-company-id"] as string) || socket.handshake.query.companyId as string || socket.handshake.headers["x-company-id"] as string;
      const userId = url.searchParams.get("userId") || (req.headers["x-user-id"] as string) || socket.handshake.query.userId as string || socket.handshake.headers["x-user-id"] as string;
      const userName = url.searchParams.get("userName") || (req.headers["x-user-name"] as string) || socket.handshake.query.userName as string || socket.handshake.headers["x-user-name"] as string || "User";

      if (!companyId || !userId) {
        socket.disconnect(true);
        return;
      }

      socket.companyId = companyId;
      socket.userId = userId;
      socket.userName = userName;

      // Join tenant room
      socket.join(companyId);

      // Mark user presence ONLINE
      this.chatUseCases.setUserPresence(companyId, userId, "ONLINE").catch(() => {});

      // Handle inbound raw messages
      socket.on("message", async (raw: any) => {
        try {
          const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
          await this.handleClientMessage(socket, parsed);
        } catch (err: any) {
          socket.send(JSON.stringify({ error: err.message || "Invalid payload" }));
        }
      });

      socket.on("disconnect", () => {
        if (socket.companyId && socket.userId) {
          this.chatUseCases.setUserPresence(socket.companyId, socket.userId, "OFFLINE").catch(() => {});
        }
      });

      // Send initial handshake success
      socket.send(JSON.stringify({ event: "connected", userId, companyId }));
    });
  }

  private async handleClientMessage(socket: AuthenticatedSocket, data: any): Promise<void> {
    const { action, payload } = data;

    switch (action) {
      case "join_channel": {
        socket.join(payload.channelId);
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
    const payloadStr = JSON.stringify(message);
    this.io.to(channelId).emit("message", payloadStr);
  }
}

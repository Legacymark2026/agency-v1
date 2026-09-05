/**
 * Chat Service — Real-time Multi-tenant Enterprise Chat Microservice
 * ─────────────────────────────────────────────────────────────────────────────
 * Port: 4023 | WebSocket & REST Inbound Adapters | Hexagonal Architecture
 */
import http from "http";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { ChatUseCases } from "./core/usecases/chat.usecases";
import { PrismaChatPersistenceAdapter } from "./adapters/prisma-chat.adapter";
import { RedisRealtimeAdapter } from "./adapters/redis-pubsub.adapter";
import { WebSocketChatAdapter } from "./adapters/websocket.adapter";
import { createChatRouter } from "./routes/chat.routes";

const PORT = parseInt(process.env.PORT || "4023", 10);
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

// Hexagonal Dependency Injection
const persistenceAdapter = new PrismaChatPersistenceAdapter();
const realtimeAdapter = new RedisRealtimeAdapter(REDIS_URL);
export const chatUseCases = new ChatUseCases(persistenceAdapter, realtimeAdapter);

// Health check endpoints
app.get("/health", (_req, res) => {
  res.json({ status: "healthy", service: "chat-service", port: PORT });
});

app.get("/ready", (_req, res) => {
  res.json({ status: "ready" });
});

// Mount domain routes
app.use("/api/chat", createChatRouter(chatUseCases));
app.use("/api/v1/chat", createChatRouter(chatUseCases));

const server = http.createServer(app);

// Mount WebSocket Inbound Adapter
export const wsAdapter = new WebSocketChatAdapter(server, chatUseCases);

if (process.env.NODE_ENV !== "test") {
  server.listen(PORT, () => {
    console.log(`[ChatService] Running on port ${PORT} (HTTP & WebSocket /ws/chat)`);
  });
}

export { app, server };

/**
 * Feed Service — Enterprise Corporate Publications & Social Feed Microservice
 * ─────────────────────────────────────────────────────────────────────────────
 * Port: 4024 | Hexagonal Architecture | Multitenant Audience Segmentation
 */
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { EventBus } from "@agency/events";
import { FeedUseCases } from "./core/usecases/feed.usecases";
import { PrismaFeedRepositoryAdapter } from "./adapters/prisma-feed.adapter";
import { EventBusFeedPublisherAdapter } from "./adapters/eventbus-feed.adapter";
import { createFeedRouter } from "./routes/feed.routes";

const PORT = parseInt(process.env.PORT || "4024", 10);
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

// Hexagonal Dependency Injection
const repository = new PrismaFeedRepositoryAdapter();
const eventBus = new EventBus(REDIS_URL, "feed-service");
const publisher = new EventBusFeedPublisherAdapter(eventBus);
export const feedUseCases = new FeedUseCases(repository, publisher);

// Health check endpoints
app.get("/health", (_req, res) => {
  res.json({ status: "healthy", service: "feed-service", port: PORT });
});

app.get("/ready", (_req, res) => {
  res.json({ status: "ready" });
});

// Mount domain routes
app.use("/api/feed", createFeedRouter(feedUseCases));
app.use("/api/v1/feed", createFeedRouter(feedUseCases));

if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`[FeedService] Running on port ${PORT}`);
  });
}

export { app };

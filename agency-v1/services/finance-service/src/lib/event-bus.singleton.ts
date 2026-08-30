/**
 * EventBus Singleton — Finance Service
 * Fixes M-3: eliminates two independent Redis connections from the same process.
 * Import this module everywhere instead of instantiating new EventBus().
 */
import { EventBus } from "@agency/events";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

export const eventBus = new EventBus(REDIS_URL, "finance-service");

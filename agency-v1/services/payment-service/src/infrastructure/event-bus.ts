/**
 * Shared EventBus instance for the payment-service
 */
import { EventBus } from "@agency/events";

const REDIS_URL = process.env.REDIS_URL || "redis://redis:6379";
export const paymentEventBus = new EventBus(REDIS_URL, "payment-service");

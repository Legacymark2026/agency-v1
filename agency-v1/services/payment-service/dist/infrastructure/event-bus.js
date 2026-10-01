"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentEventBus = void 0;
/**
 * Shared EventBus instance for the payment-service
 */
const events_1 = require("@agency/events");
const REDIS_URL = process.env.REDIS_URL || "redis://redis:6379";
exports.paymentEventBus = new events_1.EventBus(REDIS_URL, "payment-service");

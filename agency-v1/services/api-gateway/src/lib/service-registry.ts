/**
 * Service Registry & Dynamic Discovery — API Gateway
 * ─────────────────────────────────────────────────────────────────────────────
 * Maps internal Docker network hostnames and environment overrides for all microservices.
 * Supports dynamic Redis registry resolution if active.
 */
import { redisClient } from "./redis.singleton";

export const SERVICES = {
  auth:        process.env.AUTH_SERVICE_URL        || "http://auth-service:4001",
  crm:         process.env.CRM_SERVICE_URL         || "http://crm-service:4002",
  automation:  process.env.AUTOMATION_SERVICE_URL  || "http://automation-service:4003",
  ai:          process.env.AI_SERVICE_URL          || "http://ai-engine:4004",
  inbox:       process.env.INBOX_SERVICE_URL       || "http://inbox-service:4005",
  finance:     process.env.FINANCE_SERVICE_URL     || "http://finance-service:4006",
  video:       process.env.VIDEO_SERVICE_URL       || "http://video-service:4007",
  calendar:    process.env.CALENDAR_SERVICE_URL    || "http://calendar-service:4008",
  marketing:   process.env.MARKETING_SERVICE_URL   || "http://marketing-service:4009",
  integration: process.env.INTEGRATION_SERVICE_URL || "http://integration-service:4010",
  document:    process.env.DOCUMENT_SERVICE_URL    || "http://document-service:4011",
  agentTeam:   process.env.AGENT_TEAM_ENGINE_URL   || "http://agent-team-engine:4012",
  analytics:   process.env.ANALYTICS_SERVICE_URL   || "http://analytics-service:4013",
  admin:       process.env.ADMIN_SERVICE_URL       || "http://admin-service:4014",
  publicApi:   process.env.PUBLIC_API_SERVICE_URL  || "http://public-api-service:4015",
  notification:process.env.NOTIFICATION_SERVICE_URL|| "http://notification-service:4016",
  hr:          process.env.HR_SERVICE_URL          || "http://hr-service:4017",
  project:     process.env.PROJECT_SERVICE_URL     || "http://project-service:4018",
  affiliate:   process.env.AFFILIATE_SERVICE_URL   || "http://affiliate-service:4019",
  pos:         process.env.POS_SERVICE_URL         || "http://pos-service:4020",
  payment:     process.env.PAYMENT_SERVICE_URL     || "http://payment-service:4022",
  chat:        process.env.CHAT_SERVICE_URL        || "http://chat-service:4023",
  feed:        process.env.FEED_SERVICE_URL        || "http://feed-service:4024",
} as const;

export type ServiceName = keyof typeof SERVICES;

export async function resolveServiceUrl(serviceName: ServiceName): Promise<string> {
  try {
    const dynamicUrl = await redisClient.get(`service_registry:${serviceName}`);
    if (dynamicUrl) {
      return dynamicUrl;
    }
  } catch (err: any) {
    console.error(`[ServiceDiscovery] Error reading registry for ${serviceName}:`, err.message);
  }
  return SERVICES[serviceName];
}

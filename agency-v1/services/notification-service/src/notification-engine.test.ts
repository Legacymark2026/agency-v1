/**
 * Notification Service — Unit Tests
 * ─────────────────────────────────────────────────────────────────────────────
 * Unit tests for notification engine rules:
 * - Channel resolution (IN_APP, EMAIL, PUSH)
 * - Category validation & priority mapping
 * - Rate limit key generator
 * - Pagination skip/take parameter calculator
 *
 * Pure unit tests with no live database/Redis required (70/20/10 rule).
 */

import { describe, it, expect } from "vitest";

type NotificationChannel = "IN_APP" | "EMAIL" | "PUSH" | "SMS";
type NotificationPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";

const VALID_CATEGORIES = [
  "CRM", "INBOX", "AUTOMATION", "AI_ENGINE", "FINANCE",
  "MARKETING", "CALENDAR", "CONTENT", "IAM", "SYSTEM",
  "HR", "PROJECTS",
] as const;

function resolveChannels(
  requestedChannels?: NotificationChannel[],
  userPreferences?: Record<string, boolean>
): NotificationChannel[] {
  const defaults: NotificationChannel[] = ["IN_APP"];
  const channels = requestedChannels?.length ? requestedChannels : defaults;

  if (!userPreferences) return channels;

  return channels.filter((channel) => {
    const prefKey = `enable_${channel.toLowerCase()}`;
    return userPreferences[prefKey] !== false;
  });
}

function resolvePriority(category: string, isUrgent?: boolean): NotificationPriority {
  if (isUrgent) return "URGENT";
  if (category === "FINANCE" || category === "IAM" || category === "SYSTEM") return "HIGH";
  if (category === "CRM" || category === "INBOX") return "NORMAL";
  return "LOW";
}

function buildRateLimitKey(userId: string, channel: NotificationChannel, timeWindowMinutes = 1): string {
  const windowBucket = Math.floor(Date.now() / (timeWindowMinutes * 60 * 1000));
  return `rate_limit:notif:${userId}:${channel}:${windowBucket}`;
}

function calculatePagination(pageStr?: string, limitStr?: string) {
  const page = Math.max(1, parseInt(pageStr || "1", 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(limitStr || "20", 10) || 20));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

describe("Notification Service — Channel Resolution", () => {
  it("defaults to IN_APP channel when none requested", () => {
    const channels = resolveChannels();
    expect(channels).toEqual(["IN_APP"]);
  });

  it("filters out channels disabled in user preferences", () => {
    const requested: NotificationChannel[] = ["IN_APP", "EMAIL", "PUSH"];
    const prefs = { enable_in_app: true, enable_email: false, enable_push: true };

    const resolved = resolveChannels(requested, prefs);
    expect(resolved).toEqual(["IN_APP", "PUSH"]);
    expect(resolved).not.toContain("EMAIL");
  });
});

describe("Notification Service — Priority Mapping", () => {
  it("assigns URGENT priority when isUrgent flag is set", () => {
    expect(resolvePriority("CRM", true)).toBe("URGENT");
  });

  it("maps critical categories (FINANCE, IAM, SYSTEM) to HIGH priority", () => {
    expect(resolvePriority("FINANCE")).toBe("HIGH");
    expect(resolvePriority("IAM")).toBe("HIGH");
    expect(resolvePriority("SYSTEM")).toBe("HIGH");
  });

  it("maps standard operational categories (CRM, INBOX) to NORMAL priority", () => {
    expect(resolvePriority("CRM")).toBe("NORMAL");
    expect(resolvePriority("INBOX")).toBe("NORMAL");
  });

  it("defaults low-priority categories to LOW priority", () => {
    expect(resolvePriority("CONTENT")).toBe("LOW");
    expect(resolvePriority("MARKETING")).toBe("LOW");
  });
});

describe("Notification Service — Rate Limit Key Builder", () => {
  it("generates deterministic key with bucket time window", () => {
    const key = buildRateLimitKey("user-101", "EMAIL", 5);
    expect(key).toMatch(/^rate_limit:notif:user-101:EMAIL:\d+$/);
  });
});

describe("Notification Service — Pagination Parameter Calculator", () => {
  it("calculates skip and take correctly for page 1", () => {
    const { page, limit, skip } = calculatePagination("1", "20");
    expect(page).toBe(1);
    expect(limit).toBe(20);
    expect(skip).toBe(0);
  });

  it("calculates skip correctly for page 3 with 50 limit", () => {
    const { page, limit, skip } = calculatePagination("3", "50");
    expect(page).toBe(3);
    expect(limit).toBe(50);
    expect(skip).toBe(100);
  });

  it("caps limit at 100 max and defaults invalid page inputs to 1", () => {
    const { page, limit, skip } = calculatePagination("-5", "999");
    expect(page).toBe(1);
    expect(limit).toBe(100);
    expect(skip).toBe(0);
  });
});

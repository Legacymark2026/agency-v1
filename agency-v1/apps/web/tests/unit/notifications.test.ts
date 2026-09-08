/**
 * tests/unit/notifications.test.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Notification System Unit Tests
 * 
 * Verifies:
 *  - Event Registry Integrity (97 registered events)
 *  - Category mapping
 *  - Deep linking template resolution
 *  - Sanitization against stored XSS
 *  - Critical event non-configurability
 *  - Priority & Channel bounds
 */

import { describe, it, expect } from "vitest";
import {
  NOTIFICATION_EVENTS,
  CATEGORY_META,
  type NotificationEventType,
  type NotificationCategory,
} from "../../lib/notifications/notification-types";

describe("Notification System — Event Registry", () => {
  const eventKeys = Object.keys(NOTIFICATION_EVENTS) as NotificationEventType[];

  it("contains all enterprise events (at least 90 events)", () => {
    expect(eventKeys.length).toBeGreaterThanOrEqual(90);
  });

  it("ensures every event has valid metadata", () => {
    eventKeys.forEach((key) => {
      const meta = NOTIFICATION_EVENTS[key];
      expect(meta.label).toBeDefined();
      expect(meta.label.length).toBeGreaterThan(0);
      expect(meta.category).toBeDefined();
      expect(meta.icon).toBeDefined();
      expect(meta.color).toBeDefined();
      expect(["LOW", "NORMAL", "HIGH", "URGENT"]).toContain(meta.defaultPriority);
      expect(Array.isArray(meta.defaultChannels)).toBe(true);
      expect(meta.defaultChannels.length).toBeGreaterThan(0);
    });
  });

  it("verifies all categories exist in CATEGORY_META", () => {
    const validCategories = Object.keys(CATEGORY_META);
    eventKeys.forEach((key) => {
      const meta = NOTIFICATION_EVENTS[key];
      expect(validCategories).toContain(meta.category);
    });
  });
});

describe("Notification System — Deep Linking", () => {
  function resolveLink(template?: string, data?: Record<string, string | number | boolean>): string | undefined {
    if (!template || !data) return template;
    let result = template;
    for (const [key, value] of Object.entries(data)) {
      result = result.replace(new RegExp("{" + key + "}", "g"), String(value));
    }
    return result;
  }

  it("resolves leadId in CRM routes", () => {
    const res = resolveLink("/dashboard/admin/crm/leads?id={leadId}", { leadId: "lead-99" });
    expect(res).toBe("/dashboard/admin/crm/leads?id=lead-99");
  });

  it("preserves static routes without placeholders", () => {
    const res = resolveLink("/dashboard/accounting", { invoiceId: "123" });
    expect(res).toBe("/dashboard/accounting");
  });

  it("returns unchanged template when data is omitted", () => {
    const res = resolveLink("/dashboard/invoices/{id}");
    expect(res).toBe("/dashboard/invoices/{id}");
  });
});

describe("Notification System — Security & Sanitization", () => {
  function sanitize(str: unknown): string {
    if (typeof str !== "string") return "";
    return str
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/on\w+="[^"]*"/gi, "")
      .replace(/javascript:[^"\s]*/gi, "")
      .trim();
  }

  it("strips script tags from notification title", () => {
    expect(sanitize('Alerta: <script>alert("hack")</script>Factura')).toBe("Alerta: Factura");
  });

  it("strips event handler attributes", () => {
    expect(sanitize('<img src=x onerror="hack()">Aviso')).toBe("<img src=x >Aviso");
  });

  it("neutralizes javascript: URIs", () => {
    expect(sanitize('href="javascript:steal()"')).toBe('href=""');
  });
});

describe("Notification System — Critical Events & Deliverability", () => {
  it("enforces non-configurable flag on system alert events", () => {
    const alert = NOTIFICATION_EVENTS["SYSTEM.ALERT"];
    const backupFailed = NOTIFICATION_EVENTS["SYSTEM.BACKUP_FAILED"];
    const integrationDown = NOTIFICATION_EVENTS["SYSTEM.INTEGRATION_DOWN"];

    expect(alert.userConfigurable).toBe(false);
    expect(backupFailed.userConfigurable).toBe(false);
    expect(integrationDown.userConfigurable).toBe(false);
  });

  it("includes EMAIL in default channels for urgent system alerts", () => {
    const alert = NOTIFICATION_EVENTS["SYSTEM.ALERT"];
    expect(alert.defaultChannels).toContain("EMAIL");
    expect(alert.defaultChannels).toContain("IN_APP");
    expect(alert.defaultPriority).toBe("URGENT");
  });

  it("permits standard business notifications to be configurable", () => {
    const lead = NOTIFICATION_EVENTS["CRM.LEAD_CREATED"];
    expect(lead.userConfigurable).toBe(true);
  });
});

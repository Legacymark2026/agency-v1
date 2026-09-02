/**
 * Notification Service Domain Unit Tests
 * ─────────────────────────────────────────────────────────────────────────────
 * Tests:
 *  - XSS sanitization helper
 *  - Platform event mapping title generators
 *  - Read rate percentage calculations
 *  - Pagination bounds enforcement
 */
import { describe, it, expect } from "vitest";
import { EVENT_MAPPINGS } from "./events/notification.events";

describe("Notification Service Domain Tests", () => {
  describe("Stored XSS Sanitization", () => {
    function sanitizeText(str: unknown): string {
      if (typeof str !== "string") return "";
      return str
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
        .replace(/on\w+="[^"]*"/gi, "")
        .trim();
    }

    it("strips malicious script tags from notification title", () => {
      const dirty = 'Alerta: <script>alert("hacked")</script>Nuevo lead';
      expect(sanitizeText(dirty)).toBe("Alerta: Nuevo lead");
    });

    it("strips inline DOM event handler injections", () => {
      const dirty = '<img src=x onerror="stealCookies()">Factura vencida';
      expect(sanitizeText(dirty)).toBe("<img src=x >Factura vencida");
    });

    it("preserves safe informative text", () => {
      const clean = "Factura #1004 pagada por $1,250 USD";
      expect(sanitizeText(clean)).toBe(clean);
    });
  });

  describe("Platform Event Mappings", () => {
    it("generates correct title for lead.created event", () => {
      const mapping = EVENT_MAPPINGS["lead.created"];
      expect(mapping).toBeDefined();
      expect(mapping.type).toBe("CRM");
      const title = mapping.titleFn({ name: "Carlos López", source: "Landing Page" });
      expect(title).toContain("Carlos López");
      expect(title).toContain("Landing Page");
    });

    it("generates correct title for deal.won event with currency formatting", () => {
      const mapping = EVENT_MAPPINGS["deal.won"];
      expect(mapping).toBeDefined();
      expect(mapping.type).toBe("CRM");
      const title = mapping.titleFn({ value: 15000 });
      expect(title).toContain("Deal Ganado");
      expect(title).toMatch(/15[.,]000/);
    });

    it("generates correct title for invoice.paid event", () => {
      const mapping = EVENT_MAPPINGS["invoice.paid"];
      expect(mapping).toBeDefined();
      expect(mapping.type).toBe("FINANCE");
      const title = mapping.titleFn({ amount: 3500 });
      expect(title).toContain("Factura Pagada");
      expect(title).toMatch(/3[.,]500/);
    });
  });

  describe("Read Rate Calculation", () => {
    function calculateReadRate(total: number, unread: number): string {
      if (total <= 0) return "0%";
      return (((total - unread) / total) * 100).toFixed(1) + "%";
    }

    it("calculates 100% when zero notifications are unread", () => {
      expect(calculateReadRate(50, 0)).toBe("100.0%");
    });

    it("calculates accurate percentage on partially read notifications", () => {
      expect(calculateReadRate(100, 25)).toBe("75.0%");
      expect(calculateReadRate(200, 50)).toBe("75.0%");
    });

    it("returns 0% when there are no notifications", () => {
      expect(calculateReadRate(0, 0)).toBe("0%");
    });
  });

  describe("Pagination Bounds", () => {
    function computePageSize(limit: unknown): number {
      return Math.min(100, Math.max(1, parseInt(String(limit), 10) || 20));
    }

    it("clamps limit between 1 and 100", () => {
      expect(computePageSize(500)).toBe(100);
      expect(computePageSize(-10)).toBe(1);
      expect(computePageSize(15)).toBe(15);
      expect(computePageSize(undefined)).toBe(20);
    });
  });
});

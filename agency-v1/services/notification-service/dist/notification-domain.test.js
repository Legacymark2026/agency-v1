"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Notification Service Domain Unit Tests
 * ─────────────────────────────────────────────────────────────────────────────
 * Tests:
 *  - XSS sanitization helper
 *  - Platform event mapping title generators
 *  - Read rate percentage calculations
 *  - Pagination bounds enforcement
 */
const vitest_1 = require("vitest");
const notification_events_1 = require("./events/notification.events");
(0, vitest_1.describe)("Notification Service Domain Tests", () => {
    (0, vitest_1.describe)("Stored XSS Sanitization", () => {
        function sanitizeText(str) {
            if (typeof str !== "string")
                return "";
            return str
                .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
                .replace(/on\w+="[^"]*"/gi, "")
                .trim();
        }
        (0, vitest_1.it)("strips malicious script tags from notification title", () => {
            const dirty = 'Alerta: <script>alert("hacked")</script>Nuevo lead';
            (0, vitest_1.expect)(sanitizeText(dirty)).toBe("Alerta: Nuevo lead");
        });
        (0, vitest_1.it)("strips inline DOM event handler injections", () => {
            const dirty = '<img src=x onerror="stealCookies()">Factura vencida';
            (0, vitest_1.expect)(sanitizeText(dirty)).toBe("<img src=x >Factura vencida");
        });
        (0, vitest_1.it)("preserves safe informative text", () => {
            const clean = "Factura #1004 pagada por $1,250 USD";
            (0, vitest_1.expect)(sanitizeText(clean)).toBe(clean);
        });
    });
    (0, vitest_1.describe)("Platform Event Mappings", () => {
        (0, vitest_1.it)("generates correct title for lead.created event", () => {
            const mapping = notification_events_1.EVENT_MAPPINGS["lead.created"];
            (0, vitest_1.expect)(mapping).toBeDefined();
            (0, vitest_1.expect)(mapping.type).toBe("CRM");
            const title = mapping.titleFn({ name: "Carlos López", source: "Landing Page" });
            (0, vitest_1.expect)(title).toContain("Carlos López");
            (0, vitest_1.expect)(title).toContain("Landing Page");
        });
        (0, vitest_1.it)("generates correct title for deal.won event with currency formatting", () => {
            const mapping = notification_events_1.EVENT_MAPPINGS["deal.won"];
            (0, vitest_1.expect)(mapping).toBeDefined();
            (0, vitest_1.expect)(mapping.type).toBe("CRM");
            const title = mapping.titleFn({ value: 15000 });
            (0, vitest_1.expect)(title).toContain("Deal Ganado");
            (0, vitest_1.expect)(title).toMatch(/15[.,]000/);
        });
        (0, vitest_1.it)("generates correct title for invoice.paid event", () => {
            const mapping = notification_events_1.EVENT_MAPPINGS["invoice.paid"];
            (0, vitest_1.expect)(mapping).toBeDefined();
            (0, vitest_1.expect)(mapping.type).toBe("FINANCE");
            const title = mapping.titleFn({ amount: 3500 });
            (0, vitest_1.expect)(title).toContain("Factura Pagada");
            (0, vitest_1.expect)(title).toMatch(/3[.,]500/);
        });
    });
    (0, vitest_1.describe)("Read Rate Calculation", () => {
        function calculateReadRate(total, unread) {
            if (total <= 0)
                return "0%";
            return (((total - unread) / total) * 100).toFixed(1) + "%";
        }
        (0, vitest_1.it)("calculates 100% when zero notifications are unread", () => {
            (0, vitest_1.expect)(calculateReadRate(50, 0)).toBe("100.0%");
        });
        (0, vitest_1.it)("calculates accurate percentage on partially read notifications", () => {
            (0, vitest_1.expect)(calculateReadRate(100, 25)).toBe("75.0%");
            (0, vitest_1.expect)(calculateReadRate(200, 50)).toBe("75.0%");
        });
        (0, vitest_1.it)("returns 0% when there are no notifications", () => {
            (0, vitest_1.expect)(calculateReadRate(0, 0)).toBe("0%");
        });
    });
    (0, vitest_1.describe)("Pagination Bounds", () => {
        function computePageSize(limit) {
            return Math.min(100, Math.max(1, parseInt(String(limit), 10) || 20));
        }
        (0, vitest_1.it)("clamps limit between 1 and 100", () => {
            (0, vitest_1.expect)(computePageSize(500)).toBe(100);
            (0, vitest_1.expect)(computePageSize(-10)).toBe(1);
            (0, vitest_1.expect)(computePageSize(15)).toBe(15);
            (0, vitest_1.expect)(computePageSize(undefined)).toBe(20);
        });
    });
});
//# sourceMappingURL=notification-domain.test.js.map
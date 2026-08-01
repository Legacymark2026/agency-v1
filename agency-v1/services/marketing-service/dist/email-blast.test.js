"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const email_provider_1 = require("../src/services/email-provider");
const suppression_service_1 = require("../src/services/suppression.service");
const tracking_service_1 = require("../src/services/tracking.service");
const dns_validator_1 = require("../src/services/dns-validator");
const ai_optimizer_service_1 = require("../src/services/ai-optimizer.service");
const webhook_service_1 = require("../src/services/webhook.service");
const database_1 = require("@agency/database");
vitest_1.vi.mock("@agency/database", () => {
    const mockPrisma = {
        suppressionList: {
            findMany: vitest_1.vi.fn().mockResolvedValue([]),
            upsert: vitest_1.vi.fn().mockImplementation(({ create }) => Promise.resolve(create)),
            deleteMany: vitest_1.vi.fn().mockResolvedValue({ count: 1 })
        },
        emailBlastRecipient: {
            findFirst: vitest_1.vi.fn().mockResolvedValue({
                id: "rec-123",
                email: "test@example.com",
                blastId: "blast-123",
                sentAt: new Date(),
                openedAt: null,
                clickedAt: null,
                blast: { companyId: "comp-1" }
            }),
            update: vitest_1.vi.fn().mockResolvedValue({ id: "rec-123" }),
            updateMany: vitest_1.vi.fn().mockResolvedValue({ count: 1 })
        },
        emailBlast: {
            update: vitest_1.vi.fn().mockResolvedValue({ id: "blast-123" })
        },
        $transaction: vitest_1.vi.fn().mockImplementation((promises) => Promise.all(promises))
    };
    return { prisma: mockPrisma };
});
(0, vitest_1.describe)("Mass Email Platform (v2.0) - Integrated Suite", () => {
    (0, vitest_1.describe)("Phase 1: Engine Provider & Batching", () => {
        (0, vitest_1.it)("should process batch payload using SmtpProvider", async () => {
            const provider = new email_provider_1.SmtpProvider();
            const result = await provider.sendBatch({
                from: "sender@example.com",
                emails: [
                    { to: "recipient1@example.com", subject: "Test 1", html: "<p>Body 1</p>" },
                    { to: "recipient2@example.com", subject: "Test 2", html: "<p>Body 2</p>" }
                ]
            });
            (0, vitest_1.expect)(result.provider).toBe("smtp");
            (0, vitest_1.expect)(result.sentCount).toBeGreaterThanOrEqual(0);
        });
        (0, vitest_1.it)("should failover gracefully if Resend API key is missing", async () => {
            const manager = new email_provider_1.EmailProviderManager();
            const result = await manager.sendBatchWithFailover({
                from: "sender@example.com",
                emails: [{ to: "recipient@example.com", subject: "Failover Test", html: "<p>Test</p>" }]
            });
            (0, vitest_1.expect)(result.provider).toBe("smtp");
        });
    });
    (0, vitest_1.describe)("Phase 1: Suppression List Guard", () => {
        (0, vitest_1.it)("should filter out suppressed emails before enqueuing campaigns", async () => {
            vitest_1.vi.spyOn(database_1.prisma.suppressionList, "findMany").mockResolvedValueOnce([
                { email: "banned@example.com" }
            ]);
            const recipients = [
                { email: "good@example.com", name: "Good User" },
                { email: "banned@example.com", name: "Banned User" }
            ];
            const { valid, suppressedCount } = await suppression_service_1.SuppressionService.filterSuppressedRecipients("comp-1", recipients);
            (0, vitest_1.expect)(suppressedCount).toBe(1);
            (0, vitest_1.expect)(valid.length).toBe(1);
            (0, vitest_1.expect)(valid[0].email).toBe("good@example.com");
        });
    });
    (0, vitest_1.describe)("Phase 2: Deliverability, Tracking & RFC 8058", () => {
        (0, vitest_1.it)("should inject 1x1 tracking pixel and rewrite links for CTR tracking", () => {
            const html = `<html><body><a href="https://example.com/promo">Promo Link</a></body></html>`;
            const payload = { recipientId: "r-1", blastId: "b-1", email: "user@test.com", companyId: "c-1" };
            const baseUrl = "https://legacymark.app";
            const trackedHtml = tracking_service_1.TrackingService.injectTracking(html, payload, baseUrl);
            (0, vitest_1.expect)(trackedHtml).toContain("track/open?token=");
            (0, vitest_1.expect)(trackedHtml).toContain("track/click?token=");
            (0, vitest_1.expect)(trackedHtml).toContain("<img src=");
        });
        (0, vitest_1.it)("should generate valid RFC 8058 List-Unsubscribe headers", () => {
            const payload = { recipientId: "r-1", blastId: "b-1", email: "user@test.com", companyId: "c-1" };
            const headers = tracking_service_1.TrackingService.getUnsubscribeHeaders(payload, "https://legacymark.app");
            (0, vitest_1.expect)(headers["List-Unsubscribe"]).toContain("unsubscribe?token=");
            (0, vitest_1.expect)(headers["List-Unsubscribe-Post"]).toBe("List-Unsubscribe=One-Click");
        });
        (0, vitest_1.it)("should check DNS SPF, DKIM and DMARC status for a domain", async () => {
            const dnsResult = await dns_validator_1.DnsValidatorService.checkDomain("google.com");
            (0, vitest_1.expect)(dnsResult.domain).toBe("google.com");
            (0, vitest_1.expect)(dnsResult.score).toBeGreaterThan(0);
            (0, vitest_1.expect)(dnsResult.spf.present).toBe(true);
        });
    });
    (0, vitest_1.describe)("Phase 3: AI Optimizer & Webhooks", () => {
        (0, vitest_1.it)("should analyze Spam Score and flag high-risk trigger words and all-caps subjects", () => {
            const spamAnalysis = ai_optimizer_service_1.AiOptimizerService.analyzeSpamScore("GANADOR 100% GRATIS COMPRA YA!!!", "<p>haz clic aquí</p>");
            (0, vitest_1.expect)(spamAnalysis.score).toBeGreaterThan(50);
            (0, vitest_1.expect)(spamAnalysis.riskLevel).toBe("HIGH");
            (0, vitest_1.expect)(spamAnalysis.findings.length).toBeGreaterThan(0);
        });
        (0, vitest_1.it)("should handle webhook open event and update database records", async () => {
            const event = {
                type: "email.opened",
                data: {
                    recipient: "test@example.com",
                    blast_id: "blast-123",
                    company_id: "comp-1"
                }
            };
            const result = await webhook_service_1.WebhookService.handleWebhookEvent(event);
            (0, vitest_1.expect)(result.success).toBe(true);
            (0, vitest_1.expect)(database_1.prisma.$transaction).toHaveBeenCalled();
        });
        (0, vitest_1.it)("should handle bounce event and auto-add recipient to SuppressionList", async () => {
            const event = {
                type: "email.bounced",
                data: {
                    recipient: "bounced@example.com",
                    blast_id: "blast-123",
                    company_id: "comp-1",
                    bounce_type: "550 User Unknown"
                }
            };
            const result = await webhook_service_1.WebhookService.handleWebhookEvent(event);
            (0, vitest_1.expect)(result.success).toBe(true);
            (0, vitest_1.expect)(database_1.prisma.suppressionList.upsert).toHaveBeenCalled();
        });
    });
});
//# sourceMappingURL=email-blast.test.js.map
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ResendBatchProvider, SmtpProvider, EmailProviderManager } from "../src/services/email-provider";
import { SuppressionService } from "../src/services/suppression.service";
import { TrackingService } from "../src/services/tracking.service";
import { DnsValidatorService } from "../src/services/dns-validator";
import { AiOptimizerService } from "../src/services/ai-optimizer.service";
import { WebhookService } from "../src/services/webhook.service";
import { prisma } from "@agency/database";

vi.mock("@agency/database", () => {
  const mockPrisma = {
    suppressionList: {
      findMany: vi.fn().mockResolvedValue([]),
      upsert: vi.fn().mockImplementation(({ create }) => Promise.resolve(create)),
      deleteMany: vi.fn().mockResolvedValue({ count: 1 })
    },
    emailBlastRecipient: {
      findFirst: vi.fn().mockResolvedValue({
        id: "rec-123",
        email: "test@example.com",
        blastId: "blast-123",
        sentAt: new Date(),
        openedAt: null,
        clickedAt: null,
        blast: { companyId: "comp-1" }
      }),
      update: vi.fn().mockResolvedValue({ id: "rec-123" }),
      updateMany: vi.fn().mockResolvedValue({ count: 1 })
    },
    emailBlast: {
      update: vi.fn().mockResolvedValue({ id: "blast-123" })
    },
    $transaction: vi.fn().mockImplementation((promises) => Promise.all(promises))
  };
  return { prisma: mockPrisma };
});

describe("Mass Email Platform (v2.0) - Integrated Suite", () => {
  beforeEach(() => {
    process.env.SMTP_HOST = "localhost";
    process.env.SMTP_USER = "test";
    process.env.SMTP_PASS = "test";
  });

  describe("Phase 1: Engine Provider & Batching", () => {
    it("should process batch payload using SmtpProvider", async () => {
      const provider = new SmtpProvider();
      const result = await provider.sendBatch({
        from: "sender@example.com",
        emails: [
          { to: "recipient1@example.com", subject: "Test 1", html: "<p>Body 1</p>" },
          { to: "recipient2@example.com", subject: "Test 2", html: "<p>Body 2</p>" }
        ]
      });

      expect(result.provider).toBe("smtp");
      expect(result.sentCount).toBeGreaterThanOrEqual(0);
    });

    it("should failover gracefully if Resend API key is missing", async () => {
      const manager = new EmailProviderManager();
      const result = await manager.sendBatchWithFailover({
        from: "sender@example.com",
        emails: [{ to: "recipient@example.com", subject: "Failover Test", html: "<p>Test</p>" }]
      });

      expect(result.provider).toBe("smtp");
    });
  });

  describe("Phase 1: Suppression List Guard", () => {
    it("should filter out suppressed emails before enqueuing campaigns", async () => {
      vi.spyOn(prisma.suppressionList, "findMany").mockResolvedValueOnce([
        { email: "banned@example.com" }
      ]);

      const recipients = [
        { email: "good@example.com", name: "Good User" },
        { email: "banned@example.com", name: "Banned User" }
      ];

      const { valid, suppressedCount } = await SuppressionService.filterSuppressedRecipients("comp-1", recipients);

      expect(suppressedCount).toBe(1);
      expect(valid.length).toBe(1);
      expect(valid[0].email).toBe("good@example.com");
    });
  });

  describe("Phase 2: Deliverability, Tracking & RFC 8058", () => {
    it("should inject 1x1 tracking pixel and rewrite links for CTR tracking", () => {
      const html = `<html><body><a href="https://example.com/promo">Promo Link</a></body></html>`;
      const payload = { recipientId: "r-1", blastId: "b-1", email: "user@test.com", companyId: "c-1" };
      const baseUrl = "https://legacymark.app";

      const trackedHtml = TrackingService.injectTracking(html, payload, baseUrl);

      expect(trackedHtml).toContain("track/open?token=");
      expect(trackedHtml).toContain("track/click?token=");
      expect(trackedHtml).toContain("<img src=");
    });

    it("should generate valid RFC 8058 List-Unsubscribe headers", () => {
      const payload = { recipientId: "r-1", blastId: "b-1", email: "user@test.com", companyId: "c-1" };
      const headers = TrackingService.getUnsubscribeHeaders(payload, "https://legacymark.app");

      expect(headers["List-Unsubscribe"]).toContain("unsubscribe?token=");
      expect(headers["List-Unsubscribe-Post"]).toBe("List-Unsubscribe=One-Click");
    });

    it("should check DNS SPF, DKIM and DMARC status for a domain", async () => {
      const dnsResult = await DnsValidatorService.checkDomain("google.com");

      expect(dnsResult.domain).toBe("google.com");
      expect(dnsResult.score).toBeGreaterThan(0);
      expect(dnsResult.spf.present).toBe(true);
    });
  });

  describe("Phase 3: AI Optimizer & Webhooks", () => {
    it("should analyze Spam Score and flag high-risk trigger words and all-caps subjects", () => {
      const spamAnalysis = AiOptimizerService.analyzeSpamScore(
        "GANADOR 100% GRATIS COMPRA YA!!!",
        "<p>haz clic aquí</p>"
      );

      expect(spamAnalysis.score).toBeGreaterThan(50);
      expect(spamAnalysis.riskLevel).toBe("HIGH");
      expect(spamAnalysis.findings.length).toBeGreaterThan(0);
    });

    it("should handle webhook open event and update database records", async () => {
      const event = {
        type: "email.opened",
        data: {
          recipient: "test@example.com",
          blast_id: "blast-123",
          company_id: "comp-1"
        }
      };

      const result = await WebhookService.handleWebhookEvent(event);

      expect(result.success).toBe(true);
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it("should handle bounce event and auto-add recipient to SuppressionList", async () => {
      const event = {
        type: "email.bounced",
        data: {
          recipient: "bounced@example.com",
          blast_id: "blast-123",
          company_id: "comp-1",
          bounce_type: "550 User Unknown"
        }
      };

      const result = await WebhookService.handleWebhookEvent(event);

      expect(result.success).toBe(true);
      expect(prisma.suppressionList.upsert).toHaveBeenCalled();
    });
  });
});

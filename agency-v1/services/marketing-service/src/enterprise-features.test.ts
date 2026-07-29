import { describe, it, expect } from "vitest";
import { AbTestingService } from "./services/ab-testing.service";
import { ConditionalContentService } from "./services/conditional-content.service";
import { ClientPreviewService } from "./services/client-preview.service";
import { TimezoneDeliveryService } from "./services/timezone-delivery.service";
import { RssAutomationService } from "./services/rss-automation.service";

describe("Enterprise Email Platform - A/B Testing, Conditions & Client Matrix", () => {
  it("should split recipients into 10% Sample A, 10% Sample B and 80% Remaining for A/B testing", () => {
    const mockRecipients = Array.from({ length: 100 }, (_, i) => ({ email: `user${i}@example.com` }));
    const { sampleA, sampleB, remaining } = AbTestingService.splitRecipientsForAbTest(mockRecipients);

    expect(sampleA.length).toBe(10);
    expect(sampleB.length).toBe(10);
    expect(remaining.length).toBe(80);
  });

  it("should evaluate conditional showIf rules for recipient profiles correctly", () => {
    const vipRule = { field: "role", operator: "equals" as const, value: "VIP" };
    const countryRule = { field: "country", operator: "equals" as const, value: "CO" };

    const isVipUserVisible = ConditionalContentService.shouldShowBlock(vipRule, { role: "VIP" });
    const isStandardUserVisible = ConditionalContentService.shouldShowBlock(vipRule, { role: "STANDARD" });

    expect(isVipUserVisible).toBe(true);
    expect(isStandardUserVisible).toBe(false);

    const blocks = [
      { id: "1", type: "header", title: "Para Todos" },
      { id: "2", type: "coupon_code", code: "VIP50", showIf: vipRule }
    ];

    const filteredForVip = ConditionalContentService.filterBlocksForRecipient(blocks, { role: "VIP" });
    const filteredForStandard = ConditionalContentService.filterBlocksForRecipient(blocks, { role: "STANDARD" });

    expect(filteredForVip.length).toBe(2);
    expect(filteredForStandard.length).toBe(1);
    expect(filteredForStandard[0].id).toBe("1");
  });

  it("should diagnose email client compatibility issues in client matrix report", () => {
    const rawHtml = "<html><body><div style='position: absolute; border-radius: 10px;'>Test</div></body></html>";
    const report = ClientPreviewService.analyzeCompatibility(rawHtml);

    expect(report.length).toBeGreaterThanOrEqual(3);
    const gmailReport = report.find((r) => r.client.includes("Gmail"));
    const outlookReport = report.find((r) => r.client.includes("Outlook"));

    expect(gmailReport).toBeDefined();
    expect(outlookReport).toBeDefined();
    expect(gmailReport?.warnings.length).toBeGreaterThan(0);
    expect(outlookReport?.warnings.length).toBeGreaterThan(0);
  });

  it("should group recipients by timezone for Timezone-Aware Delivery", () => {
    const recipients = [
      { email: "user1@bogota.co", timezone: "America/Bogota" },
      { email: "user2@bogota.co", timezone: "America/Bogota" },
      { email: "user3@madrid.es", timezone: "Europe/Madrid" }
    ];

    const groups = TimezoneDeliveryService.groupRecipientsByTimezone(recipients, 9);

    expect(groups.length).toBe(2);
    const bogotaGroup = groups.find((g) => g.timezone === "America/Bogota");
    expect(bogotaGroup?.recipientsCount).toBe(2);
  });

  it("should generate newsletter automatically from blog articles for RSS automation", () => {
    const articles = [
      {
        title: "Lanzamiento de LegacyMark 2.0",
        excerpt: "Nuevas funciones de IA y automatización.",
        url: "https://legacymarksas.com/blog/2.0"
      }
    ];

    const { designJson, compiledHtml } = RssAutomationService.generateNewsletterFromArticles("LegacyMark", articles);

    expect(designJson.blocks.length).toBeGreaterThan(0);
    expect(compiledHtml).toContain("Lanzamiento de LegacyMark 2.0");
  });
});

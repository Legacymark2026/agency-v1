import { describe, it, expect } from "vitest";
import { AbTestingService } from "./services/ab-testing.service";
import { ConditionalContentService } from "./services/conditional-content.service";
import { ClientPreviewService } from "./services/client-preview.service";

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
});

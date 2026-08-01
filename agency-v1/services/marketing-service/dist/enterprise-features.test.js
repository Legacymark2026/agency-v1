"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const ab_testing_service_1 = require("./services/ab-testing.service");
const conditional_content_service_1 = require("./services/conditional-content.service");
const client_preview_service_1 = require("./services/client-preview.service");
const timezone_delivery_service_1 = require("./services/timezone-delivery.service");
const rss_automation_service_1 = require("./services/rss-automation.service");
(0, vitest_1.describe)("Enterprise Email Platform - A/B Testing, Conditions & Client Matrix", () => {
    (0, vitest_1.it)("should split recipients into 10% Sample A, 10% Sample B and 80% Remaining for A/B testing", () => {
        const mockRecipients = Array.from({ length: 100 }, (_, i) => ({ email: `user${i}@example.com` }));
        const { sampleA, sampleB, remaining } = ab_testing_service_1.AbTestingService.splitRecipientsForAbTest(mockRecipients);
        (0, vitest_1.expect)(sampleA.length).toBe(10);
        (0, vitest_1.expect)(sampleB.length).toBe(10);
        (0, vitest_1.expect)(remaining.length).toBe(80);
    });
    (0, vitest_1.it)("should evaluate conditional showIf rules for recipient profiles correctly", () => {
        const vipRule = { field: "role", operator: "equals", value: "VIP" };
        const countryRule = { field: "country", operator: "equals", value: "CO" };
        const isVipUserVisible = conditional_content_service_1.ConditionalContentService.shouldShowBlock(vipRule, { role: "VIP" });
        const isStandardUserVisible = conditional_content_service_1.ConditionalContentService.shouldShowBlock(vipRule, { role: "STANDARD" });
        (0, vitest_1.expect)(isVipUserVisible).toBe(true);
        (0, vitest_1.expect)(isStandardUserVisible).toBe(false);
        const blocks = [
            { id: "1", type: "header", title: "Para Todos" },
            { id: "2", type: "coupon_code", code: "VIP50", showIf: vipRule }
        ];
        const filteredForVip = conditional_content_service_1.ConditionalContentService.filterBlocksForRecipient(blocks, { role: "VIP" });
        const filteredForStandard = conditional_content_service_1.ConditionalContentService.filterBlocksForRecipient(blocks, { role: "STANDARD" });
        (0, vitest_1.expect)(filteredForVip.length).toBe(2);
        (0, vitest_1.expect)(filteredForStandard.length).toBe(1);
        (0, vitest_1.expect)(filteredForStandard[0].id).toBe("1");
    });
    (0, vitest_1.it)("should diagnose email client compatibility issues in client matrix report", () => {
        const rawHtml = "<html><body><div style='position: absolute; border-radius: 10px;'>Test</div></body></html>";
        const report = client_preview_service_1.ClientPreviewService.analyzeCompatibility(rawHtml);
        (0, vitest_1.expect)(report.length).toBeGreaterThanOrEqual(3);
        const gmailReport = report.find((r) => r.client.includes("Gmail"));
        const outlookReport = report.find((r) => r.client.includes("Outlook"));
        (0, vitest_1.expect)(gmailReport).toBeDefined();
        (0, vitest_1.expect)(outlookReport).toBeDefined();
        (0, vitest_1.expect)(gmailReport?.warnings.length).toBeGreaterThan(0);
        (0, vitest_1.expect)(outlookReport?.warnings.length).toBeGreaterThan(0);
    });
    (0, vitest_1.it)("should group recipients by timezone for Timezone-Aware Delivery", () => {
        const recipients = [
            { email: "user1@bogota.co", timezone: "America/Bogota" },
            { email: "user2@bogota.co", timezone: "America/Bogota" },
            { email: "user3@madrid.es", timezone: "Europe/Madrid" }
        ];
        const groups = timezone_delivery_service_1.TimezoneDeliveryService.groupRecipientsByTimezone(recipients, 9);
        (0, vitest_1.expect)(groups.length).toBe(2);
        const bogotaGroup = groups.find((g) => g.timezone === "America/Bogota");
        (0, vitest_1.expect)(bogotaGroup?.recipientsCount).toBe(2);
    });
    (0, vitest_1.it)("should generate newsletter automatically from blog articles for RSS automation", () => {
        const articles = [
            {
                title: "Lanzamiento de LegacyMark 2.0",
                excerpt: "Nuevas funciones de IA y automatización.",
                url: "https://legacymarksas.com/blog/2.0"
            }
        ];
        const { designJson, compiledHtml } = rss_automation_service_1.RssAutomationService.generateNewsletterFromArticles("LegacyMark", articles);
        (0, vitest_1.expect)(designJson.blocks.length).toBeGreaterThan(0);
        (0, vitest_1.expect)(compiledHtml).toContain("Lanzamiento de LegacyMark 2.0");
    });
});
//# sourceMappingURL=enterprise-features.test.js.map
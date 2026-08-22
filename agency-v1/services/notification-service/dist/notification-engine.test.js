"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const VALID_CATEGORIES = [
    "CRM", "INBOX", "AUTOMATION", "AI_ENGINE", "FINANCE",
    "MARKETING", "CALENDAR", "CONTENT", "IAM", "SYSTEM",
    "HR", "PROJECTS",
];
function resolveChannels(requestedChannels, userPreferences) {
    const defaults = ["IN_APP"];
    const channels = requestedChannels?.length ? requestedChannels : defaults;
    if (!userPreferences)
        return channels;
    return channels.filter((channel) => {
        const prefKey = `enable_${channel.toLowerCase()}`;
        return userPreferences[prefKey] !== false;
    });
}
function resolvePriority(category, isUrgent) {
    if (isUrgent)
        return "URGENT";
    if (category === "FINANCE" || category === "IAM" || category === "SYSTEM")
        return "HIGH";
    if (category === "CRM" || category === "INBOX")
        return "NORMAL";
    return "LOW";
}
function buildRateLimitKey(userId, channel, timeWindowMinutes = 1) {
    const windowBucket = Math.floor(Date.now() / (timeWindowMinutes * 60 * 1000));
    return `rate_limit:notif:${userId}:${channel}:${windowBucket}`;
}
function calculatePagination(pageStr, limitStr) {
    const page = Math.max(1, parseInt(pageStr || "1", 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(limitStr || "20", 10) || 20));
    const skip = (page - 1) * limit;
    return { page, limit, skip };
}
(0, vitest_1.describe)("Notification Service — Channel Resolution", () => {
    (0, vitest_1.it)("defaults to IN_APP channel when none requested", () => {
        const channels = resolveChannels();
        (0, vitest_1.expect)(channels).toEqual(["IN_APP"]);
    });
    (0, vitest_1.it)("filters out channels disabled in user preferences", () => {
        const requested = ["IN_APP", "EMAIL", "PUSH"];
        const prefs = { enable_in_app: true, enable_email: false, enable_push: true };
        const resolved = resolveChannels(requested, prefs);
        (0, vitest_1.expect)(resolved).toEqual(["IN_APP", "PUSH"]);
        (0, vitest_1.expect)(resolved).not.toContain("EMAIL");
    });
});
(0, vitest_1.describe)("Notification Service — Priority Mapping", () => {
    (0, vitest_1.it)("assigns URGENT priority when isUrgent flag is set", () => {
        (0, vitest_1.expect)(resolvePriority("CRM", true)).toBe("URGENT");
    });
    (0, vitest_1.it)("maps critical categories (FINANCE, IAM, SYSTEM) to HIGH priority", () => {
        (0, vitest_1.expect)(resolvePriority("FINANCE")).toBe("HIGH");
        (0, vitest_1.expect)(resolvePriority("IAM")).toBe("HIGH");
        (0, vitest_1.expect)(resolvePriority("SYSTEM")).toBe("HIGH");
    });
    (0, vitest_1.it)("maps standard operational categories (CRM, INBOX) to NORMAL priority", () => {
        (0, vitest_1.expect)(resolvePriority("CRM")).toBe("NORMAL");
        (0, vitest_1.expect)(resolvePriority("INBOX")).toBe("NORMAL");
    });
    (0, vitest_1.it)("defaults low-priority categories to LOW priority", () => {
        (0, vitest_1.expect)(resolvePriority("CONTENT")).toBe("LOW");
        (0, vitest_1.expect)(resolvePriority("MARKETING")).toBe("LOW");
    });
});
(0, vitest_1.describe)("Notification Service — Rate Limit Key Builder", () => {
    (0, vitest_1.it)("generates deterministic key with bucket time window", () => {
        const key = buildRateLimitKey("user-101", "EMAIL", 5);
        (0, vitest_1.expect)(key).toMatch(/^rate_limit:notif:user-101:EMAIL:\d+$/);
    });
});
(0, vitest_1.describe)("Notification Service — Pagination Parameter Calculator", () => {
    (0, vitest_1.it)("calculates skip and take correctly for page 1", () => {
        const { page, limit, skip } = calculatePagination("1", "20");
        (0, vitest_1.expect)(page).toBe(1);
        (0, vitest_1.expect)(limit).toBe(20);
        (0, vitest_1.expect)(skip).toBe(0);
    });
    (0, vitest_1.it)("calculates skip correctly for page 3 with 50 limit", () => {
        const { page, limit, skip } = calculatePagination("3", "50");
        (0, vitest_1.expect)(page).toBe(3);
        (0, vitest_1.expect)(limit).toBe(50);
        (0, vitest_1.expect)(skip).toBe(100);
    });
    (0, vitest_1.it)("caps limit at 100 max and defaults invalid page inputs to 1", () => {
        const { page, limit, skip } = calculatePagination("-5", "999");
        (0, vitest_1.expect)(page).toBe(1);
        (0, vitest_1.expect)(limit).toBe(100);
        (0, vitest_1.expect)(skip).toBe(0);
    });
});
//# sourceMappingURL=notification-engine.test.js.map
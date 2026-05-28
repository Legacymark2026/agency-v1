"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.routeLead = routeLead;
const database_1 = require("@agency/database");
function evaluateCondition(lead, condition) {
    let leadValue = lead[condition.field];
    if (leadValue === undefined && lead.formData) {
        // Check inside custom form data if present
        leadValue = lead.formData[condition.field];
    }
    if (leadValue === undefined || leadValue === null)
        return false;
    const valueStr = String(leadValue).toLowerCase().trim();
    const condValue = String(condition.value).toLowerCase().trim();
    switch (condition.operator) {
        case "EQUALS":
            return valueStr === condValue;
        case "CONTAINS":
            return valueStr.includes(condValue);
        case "STARTS_WITH":
            return valueStr.startsWith(condValue);
        case "ENDS_WITH":
            return valueStr.endsWith(condValue);
        default:
            return false;
    }
}
async function routeLead(lead) {
    const { companyId } = lead;
    if (!companyId)
        return null;
    try {
        // 1. Fetch active assignment rules, ordered by priority
        const rules = await database_1.prisma.leadAssignmentRule.findMany({
            where: {
                companyId,
                isActive: true,
            },
            orderBy: {
                priority: "asc",
            },
        });
        for (const rule of rules) {
            // Parse conditions JSON
            const conditions = typeof rule.conditions === "string"
                ? JSON.parse(rule.conditions)
                : (rule.conditions || []);
            // If there are conditions, evaluate them (AND logic)
            const matches = conditions.length > 0 && conditions.every(cond => evaluateCondition(lead, cond));
            if (matches) {
                console.log(`[Lead Routing] Match found for rule "${rule.name}" (ID: ${rule.id})`);
                // 2. Perform Round-Robin assignment if enabled
                if (rule.roundRobinEnabled) {
                    let agentIds = [];
                    if (rule.teamId) {
                        // Get active team members
                        const teamMembers = await database_1.prisma.companyUser.findMany({
                            where: {
                                companyId,
                                teamId: rule.teamId,
                            },
                            select: {
                                userId: true,
                            },
                        });
                        agentIds = teamMembers.map(m => m.userId);
                    }
                    else {
                        // Get all active company members
                        const companyMembers = await database_1.prisma.companyUser.findMany({
                            where: { companyId },
                            select: { userId: true },
                        });
                        agentIds = companyMembers.map(m => m.userId);
                    }
                    // Fetch user deactivation state to filter out inactive users
                    const activeAgents = await database_1.prisma.user.findMany({
                        where: {
                            id: { in: agentIds },
                            deactivatedAt: null,
                        },
                        select: { id: true },
                    });
                    const activeAgentIds = activeAgents.map(a => a.id).sort();
                    if (activeAgentIds.length > 0) {
                        // Retrieve last assignment round robin state
                        const state = await database_1.prisma.leadAssignmentRoundRobinState.findUnique({
                            where: {
                                companyId_ruleId: {
                                    companyId,
                                    ruleId: rule.id,
                                },
                            },
                        });
                        let nextAgentIndex = 0;
                        if (state) {
                            const lastAgentIndex = activeAgentIds.indexOf(state.lastAssignedUserId);
                            if (lastAgentIndex !== -1) {
                                nextAgentIndex = (lastAgentIndex + 1) % activeAgentIds.length;
                            }
                        }
                        const nextAgentId = activeAgentIds[nextAgentIndex];
                        // Update state
                        await database_1.prisma.leadAssignmentRoundRobinState.upsert({
                            where: {
                                companyId_ruleId: {
                                    companyId,
                                    ruleId: rule.id,
                                },
                            },
                            create: {
                                companyId,
                                ruleId: rule.id,
                                lastAssignedUserId: nextAgentId,
                                updatedAt: new Date(),
                            },
                            update: {
                                lastAssignedUserId: nextAgentId,
                                updatedAt: new Date(),
                            },
                        });
                        return nextAgentId;
                    }
                }
                else if (rule.assignedUserId) {
                    // Direct assignment
                    return rule.assignedUserId;
                }
            }
        }
        // 3. Fallback: Round-robin among all active sales agents in the company if no rule matches
        const allCompanyMembers = await database_1.prisma.companyUser.findMany({
            where: { companyId },
            select: { userId: true },
        });
        const activeFallbackAgents = await database_1.prisma.user.findMany({
            where: {
                id: { in: allCompanyMembers.map(m => m.userId) },
                deactivatedAt: null,
            },
            select: { id: true },
        });
        const fallbackAgentIds = activeFallbackAgents.map(a => a.id).sort();
        if (fallbackAgentIds.length > 0) {
            const state = await database_1.prisma.leadAssignmentRoundRobinState.findUnique({
                where: {
                    companyId_teamId: {
                        companyId,
                        teamId: "FALLBACK_GLOBAL",
                    },
                },
            });
            let nextIndex = 0;
            if (state) {
                const lastIndex = fallbackAgentIds.indexOf(state.lastAssignedUserId);
                if (lastIndex !== -1) {
                    nextIndex = (lastIndex + 1) % fallbackAgentIds.length;
                }
            }
            const nextAgentId = fallbackAgentIds[nextIndex];
            await database_1.prisma.leadAssignmentRoundRobinState.upsert({
                where: {
                    companyId_teamId: {
                        companyId,
                        teamId: "FALLBACK_GLOBAL",
                    },
                },
                create: {
                    companyId,
                    teamId: "FALLBACK_GLOBAL",
                    lastAssignedUserId: nextAgentId,
                    updatedAt: new Date(),
                },
                update: {
                    lastAssignedUserId: nextAgentId,
                    updatedAt: new Date(),
                },
            });
            return nextAgentId;
        }
        return null;
    }
    catch (error) {
        console.error("[Lead Assignment Engine] Error in routing:", error);
        return null;
    }
}
//# sourceMappingURL=assignment-engine.js.map
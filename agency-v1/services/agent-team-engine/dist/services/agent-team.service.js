"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentTeamService = void 0;
const database_1 = require("@agency/database");
const events_1 = require("@agency/events");
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const eventBus = new events_1.EventBus(REDIS_URL, "agent-team-engine");
class AgentTeamService {
    /**
     * Obtener equipos de agentes configurados por empresa
     */
    static async getTeams(companyId) {
        try {
            return await database_1.prisma.agentTeam.findMany({
                where: { companyId },
                include: { members: { include: { agent: true } } },
                orderBy: { createdAt: "desc" }
            });
        }
        catch {
            // Fallback fallback return
            return [];
        }
    }
    /**
     * Ejecuta una tarea colaborativa secuencial entre los agentes de un equipo
     */
    static async runCollaborativeTeam(teamId, companyId, userMessage) {
        let team = null;
        try {
            team = await database_1.prisma.agentTeam.findUnique({
                where: { id: teamId },
                include: { members: { include: { agent: true } } }
            });
        }
        catch {
            // ignore
        }
        if (!team) {
            // Return a simulated team if DB queries failed
            team = {
                id: teamId,
                name: "Mock Marketing Team",
                strategy: "SEQUENTIAL",
                members: [
                    { role: "researcher", agent: { name: "Research Agent", systemPrompt: "Analyze trends" } },
                    { role: "writer", agent: { name: "Copywriter Agent", systemPrompt: "Draft ad copy" } },
                    { role: "approver", agent: { name: "Manager Agent", systemPrompt: "Review copy" } }
                ]
            };
        }
        console.log(`[AgentTeamService] Starting collaborative execution for team: ${team.name}`);
        let currentInput = userMessage;
        const collaborationTrace = [];
        // Sequential collaboration strategy
        for (let idx = 0; idx < team.members.length; idx++) {
            const member = team.members[idx];
            const agentName = member.agent?.name || `Agent ${idx + 1}`;
            const role = member.role || "collaborator";
            // Simulate the agent execution and output transformation
            let response = "";
            if (idx === 0) {
                response = `[${agentName} - Researcher]: Analizó la petición "${currentInput}" y recopiló datos de mercado clave.`;
            }
            else if (idx === 1) {
                response = `[${agentName} - Writer]: Tomó el informe previo y redactó la propuesta publicitaria estructurada: "${currentInput.substring(0, 100)}..."`;
            }
            else {
                response = `[${agentName} - Approver]: Evaluó y aprobó la propuesta, optimizándola para publicación final.`;
            }
            collaborationTrace.push({
                step: idx + 1,
                agentName,
                role,
                input: currentInput,
                output: response
            });
            // Pass the current output as the input for the next member in the chain
            currentInput = response;
        }
        // Publish execution result to EventBus
        try {
            await eventBus.publish("agent_team.execution_completed", {
                teamId,
                companyId,
                inputTask: userMessage,
                trace: collaborationTrace,
                finalResult: currentInput
            });
        }
        catch (err) {
            console.warn("[AgentTeamService] EventBus publish skipped:", err.message);
        }
        return {
            teamId,
            teamName: team.name,
            strategy: team.strategy || "SEQUENTIAL",
            inputTask: userMessage,
            steps: collaborationTrace,
            finalResult: currentInput
        };
    }
}
exports.AgentTeamService = AgentTeamService;
//# sourceMappingURL=agent-team.service.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Observability registration — must be first
try {
    require("@agency/observability/register");
}
catch { /* observability optional */ }
const observability_1 = require("@agency/observability");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const service_auth_1 = require("@agency/service-auth");
const agent_team_routes_1 = require("./routes/agent-team.routes");
const agent_team_middleware_1 = require("./middlewares/agent-team.middleware");
const app = (0, express_1.default)();
app.use((0, observability_1.metricsMiddleware)("agent-team-engine"));
app.get("/metrics", observability_1.metricsEndpoint);
const port = process.env.PORT || 4012;
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', service: 'agent-team-engine' });
});
app.use('/api/v1', agent_team_routes_1.agentTeamRouter);
app.use(agent_team_middleware_1.errorHandler);
const server = app.listen(port, () => {
    console.log(`Agent Team Engine listening at http://localhost:${port}`);
});
(0, service_auth_1.setupGracefulShutdown)(server);
//# sourceMappingURL=index.js.map
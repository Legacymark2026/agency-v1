"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const observability_1 = require("@agency/observability");
const express_1 = __importDefault(require("express"));
try {
    require("@agency/observability/register");
}
catch { /* optional */ }
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const database_1 = require("@agency/database");
const calendar_routes_1 = require("./routes/calendar.routes");
const calendar_middleware_1 = require("./middlewares/calendar.middleware");
const service_auth_1 = require("@agency/service-auth");
const app = (0, express_1.default)();
app.use((0, observability_1.metricsMiddleware)("calendar-service"));
app.get("/metrics", observability_1.metricsEndpoint);
const port = process.env.PORT || 4008;
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok", service: "calendar-service" });
});
app.get("/ready", async (_req, res) => {
    try {
        await database_1.prisma.$queryRaw `SELECT 1`;
        res.json({ status: "ready" });
    }
    catch (err) {
        res.status(503).json({ status: "not_ready", error: String(err) });
    }
});
app.use("/api/v1", calendar_routes_1.calendarRouter);
app.use(calendar_middleware_1.errorHandler);
const server = app.listen(port, () => {
    console.log(`Calendar Service listening at http://localhost:${port}`);
});
(0, service_auth_1.setupGracefulShutdown)(server);
exports.default = app;
//# sourceMappingURL=index.js.map
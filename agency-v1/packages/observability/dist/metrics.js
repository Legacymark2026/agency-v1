"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registry = void 0;
exports.metricsMiddleware = metricsMiddleware;
exports.metricsEndpoint = metricsEndpoint;
const prom_client_1 = __importDefault(require("prom-client"));
const registry = new prom_client_1.default.Registry();
exports.registry = registry;
prom_client_1.default.collectDefaultMetrics({ register: registry });
const httpRequestsTotal = new prom_client_1.default.Counter({
    name: "http_requests_total",
    help: "Total number of HTTP requests processed",
    labelNames: ["method", "route", "status", "service"],
    registers: [registry]
});
const httpRequestDuration = new prom_client_1.default.Histogram({
    name: "http_request_duration_seconds",
    help: "Duration of HTTP requests in seconds",
    labelNames: ["method", "route", "status", "service"],
    buckets: [0.05, 0.1, 0.3, 0.5, 0.9, 1.5, 3, 5, 10],
    registers: [registry]
});
function metricsMiddleware(serviceName) {
    return (req, res, next) => {
        const start = process.hrtime();
        res.on("finish", () => {
            const diff = process.hrtime(start);
            const durationSeconds = diff[0] + diff[1] / 1e9;
            const route = req.route ? req.route.path : req.path;
            const status = res.statusCode.toString();
            const labels = {
                method: req.method,
                route: route || req.path,
                status,
                service: serviceName
            };
            httpRequestsTotal.inc(labels);
            httpRequestDuration.observe(labels, durationSeconds);
        });
        next();
    };
}
function metricsEndpoint(_req, res) {
    res.set("Content-Type", registry.contentType);
    registry.metrics().then((data) => {
        res.send(data);
    }).catch((err) => {
        res.status(500).send(err);
    });
}
//# sourceMappingURL=metrics.js.map
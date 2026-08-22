import client from "prom-client";
import express from "express";

const registry = new client.Registry();

client.collectDefaultMetrics({ register: registry });

const httpRequestsTotal = new client.Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests processed",
  labelNames: ["method", "route", "status", "service"],
  registers: [registry]
});

const httpRequestDuration = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status", "service"],
  buckets: [0.05, 0.1, 0.3, 0.5, 0.9, 1.5, 3, 5, 10],
  registers: [registry]
});

export function metricsMiddleware(serviceName: string) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const start = process.hrtime();
    
    // Inject or reuse Distributed Correlation ID
    const correlationId = (req.headers["x-correlation-id"] as string) || `corr_${Math.random().toString(36).substring(2, 10)}_${Date.now()}`;
    (req as any).correlationId = correlationId;
    res.setHeader("x-correlation-id", correlationId);

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

export function metricsEndpoint(_req: express.Request, res: express.Response) {
  res.set("Content-Type", registry.contentType);
  registry.metrics().then((data) => {
    res.send(data);
  }).catch((err) => {
    res.status(500).send(err);
  });
}
export { registry };

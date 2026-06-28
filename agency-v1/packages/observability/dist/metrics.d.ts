import client from "prom-client";
import express from "express";
declare const registry: client.Registry<"text/plain; version=0.0.4; charset=utf-8">;
export declare function metricsMiddleware(serviceName: string): (req: express.Request, res: express.Response, next: express.NextFunction) => void;
export declare function metricsEndpoint(_req: express.Request, res: express.Response): void;
export { registry };
//# sourceMappingURL=metrics.d.ts.map
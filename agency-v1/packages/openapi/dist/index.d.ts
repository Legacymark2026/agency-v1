/**
 * @agency/openapi
 * ─────────────────────────────────────────────────────────────────────────────
 * OpenAPI 3.1 spec generation from Zod schemas.
 * Each microservice uses this to auto-generate and serve its API contract.
 *
 * Usage in a service:
 *   import { AgencyOpenAPIRegistry, generateSpec, serveSwaggerUI } from '@agency/openapi';
 *
 *   const registry = new AgencyOpenAPIRegistry('CRM Service', '1.0.0');
 *   registry.registerPath({ method: 'get', path: '/api/v1/leads', ... });
 *   app.use('/api/docs', serveSwaggerUI(registry.generateSpec()));
 */
import { OpenAPIRegistry, extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { RequestHandler } from "express";
export { z, extendZodWithOpenApi };
export { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
export interface ServiceMetadata {
    title: string;
    version: string;
    description?: string;
    contact?: {
        name: string;
        url?: string;
        email?: string;
    };
}
/**
 * AgencyOpenAPIRegistry wraps OpenAPIRegistry with service metadata and
 * standard security scheme definitions used across all LegacyMark services.
 */
export declare class AgencyOpenAPIRegistry {
    readonly registry: OpenAPIRegistry;
    private readonly metadata;
    constructor(metadata: ServiceMetadata);
    /**
     * Generates the OpenAPI 3.1 spec document.
     */
    generateSpec(): import("openapi3-ts/oas31").OpenAPIObject;
}
/**
 * Returns Express middleware that serves Swagger UI for the given spec.
 *
 * Mount at: app.use('/api/docs', serveSwaggerUI(registry.generateSpec()));
 */
export declare const serveSwaggerUI: (spec: ReturnType<AgencyOpenAPIRegistry["generateSpec"]>) => RequestHandler[];
export declare const StandardErrorSchema: z.ZodObject<{
    success: z.ZodLiteral<false>;
    error: z.ZodString;
    code: z.ZodOptional<z.ZodString>;
    correlationId: z.ZodOptional<z.ZodString>;
    timestamp: z.ZodString;
}, "strip", z.ZodTypeAny, {
    success: false;
    error: string;
    timestamp: string;
    code?: string | undefined;
    correlationId?: string | undefined;
}, {
    success: false;
    error: string;
    timestamp: string;
    code?: string | undefined;
    correlationId?: string | undefined;
}>;
export declare const PaginationSchema: z.ZodObject<{
    page: z.ZodNumber;
    limit: z.ZodNumber;
    total: z.ZodNumber;
    totalPages: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}, {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}>;
//# sourceMappingURL=index.d.ts.map
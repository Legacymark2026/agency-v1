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

import {
  OpenAPIRegistry,
  OpenApiGeneratorV31,
  extendZodWithOpenApi,
} from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import swaggerUi from "swagger-ui-express";
import { RequestHandler } from "express";

// Extend Zod with OpenAPI support (call once at app startup)
extendZodWithOpenApi(z);

export { z, extendZodWithOpenApi };
export { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";

// ── Registry ──────────────────────────────────────────────────────────────────

export interface ServiceMetadata {
  title: string;
  version: string;
  description?: string;
  contact?: { name: string; url?: string; email?: string };
}

/**
 * AgencyOpenAPIRegistry wraps OpenAPIRegistry with service metadata and
 * standard security scheme definitions used across all LegacyMark services.
 */
export class AgencyOpenAPIRegistry {
  public readonly registry: OpenAPIRegistry;
  private readonly metadata: ServiceMetadata;

  constructor(metadata: ServiceMetadata) {
    this.registry = new OpenAPIRegistry();
    this.metadata = metadata;

    // Register standard security schemes
    this.registry.registerComponent("securitySchemes", "BearerAuth", {
      type: "http",
      scheme: "bearer",
      bearerFormat: "JWT",
      description: "User JWT token issued by auth-service",
    });

    this.registry.registerComponent("securitySchemes", "ServiceToken", {
      type: "apiKey",
      in: "header",
      name: "x-service-token",
      description: "Inter-service JWT token signed by @agency/service-auth",
    });

    this.registry.registerComponent("securitySchemes", "IdempotencyKey", {
      type: "apiKey",
      in: "header",
      name: "Idempotency-Key",
      description: "UUID for idempotent POST/PATCH requests",
    });
  }

  /**
   * Generates the OpenAPI 3.1 spec document.
   */
  generateSpec() {
    const generator = new OpenApiGeneratorV31(this.registry.definitions);
    return generator.generateDocument({
      openapi: "3.1.0",
      info: {
        title: this.metadata.title,
        version: this.metadata.version,
        description: this.metadata.description ?? `API specification for ${this.metadata.title}`,
        contact: this.metadata.contact,
      },
      servers: [
        {
          url: "/api/v1",
          description: "Current API version",
        },
      ],
      tags: [],
    });
  }
}

// ── Swagger UI Middleware ──────────────────────────────────────────────────────

/**
 * Returns Express middleware that serves Swagger UI for the given spec.
 *
 * Mount at: app.use('/api/docs', serveSwaggerUI(registry.generateSpec()));
 */
export const serveSwaggerUI = (spec: ReturnType<AgencyOpenAPIRegistry["generateSpec"]>): RequestHandler[] => {
  return [
    swaggerUi.serve,
    swaggerUi.setup(spec, {
      customSiteTitle: "LegacyMark API Docs",
      customCss: `
        .topbar { background-color: #1a1a2e; }
        .topbar-wrapper img { content: url('data:image/svg+xml,...'); }
      `,
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true,
        syntaxHighlight: { theme: "monokai" },
      },
    }) as RequestHandler,
  ];
};

// ── Standard Response Schemas ─────────────────────────────────────────────────

export const StandardErrorSchema = z
  .object({
    success: z.literal(false),
    error: z.string(),
    code: z.string().optional(),
    correlationId: z.string().optional(),
    timestamp: z.string().datetime(),
  })
  .openapi("StandardError");

export const PaginationSchema = z
  .object({
    page: z.number().int().min(1),
    limit: z.number().int().min(1).max(100),
    total: z.number().int(),
    totalPages: z.number().int(),
  })
  .openapi("Pagination");

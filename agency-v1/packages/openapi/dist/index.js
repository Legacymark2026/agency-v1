"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaginationSchema = exports.StandardErrorSchema = exports.serveSwaggerUI = exports.AgencyOpenAPIRegistry = exports.OpenAPIRegistry = exports.extendZodWithOpenApi = exports.z = void 0;
const zod_to_openapi_1 = require("@asteasolutions/zod-to-openapi");
Object.defineProperty(exports, "extendZodWithOpenApi", { enumerable: true, get: function () { return zod_to_openapi_1.extendZodWithOpenApi; } });
const zod_1 = require("zod");
Object.defineProperty(exports, "z", { enumerable: true, get: function () { return zod_1.z; } });
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
// Extend Zod with OpenAPI support (call once at app startup)
(0, zod_to_openapi_1.extendZodWithOpenApi)(zod_1.z);
var zod_to_openapi_2 = require("@asteasolutions/zod-to-openapi");
Object.defineProperty(exports, "OpenAPIRegistry", { enumerable: true, get: function () { return zod_to_openapi_2.OpenAPIRegistry; } });
/**
 * AgencyOpenAPIRegistry wraps OpenAPIRegistry with service metadata and
 * standard security scheme definitions used across all LegacyMark services.
 */
class AgencyOpenAPIRegistry {
    constructor(metadata) {
        this.registry = new zod_to_openapi_1.OpenAPIRegistry();
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
        const generator = new zod_to_openapi_1.OpenApiGeneratorV31(this.registry.definitions);
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
exports.AgencyOpenAPIRegistry = AgencyOpenAPIRegistry;
// ── Swagger UI Middleware ──────────────────────────────────────────────────────
/**
 * Returns Express middleware that serves Swagger UI for the given spec.
 *
 * Mount at: app.use('/api/docs', serveSwaggerUI(registry.generateSpec()));
 */
const serveSwaggerUI = (spec) => {
    return [
        ...swagger_ui_express_1.default.serve,
        swagger_ui_express_1.default.setup(spec, {
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
        }),
    ];
};
exports.serveSwaggerUI = serveSwaggerUI;
// ── Standard Response Schemas ─────────────────────────────────────────────────
exports.StandardErrorSchema = zod_1.z
    .object({
    success: zod_1.z.literal(false),
    error: zod_1.z.string(),
    code: zod_1.z.string().optional(),
    correlationId: zod_1.z.string().optional(),
    timestamp: zod_1.z.string().datetime(),
})
    .openapi("StandardError");
exports.PaginationSchema = zod_1.z
    .object({
    page: zod_1.z.number().int().min(1),
    limit: zod_1.z.number().int().min(1).max(100),
    total: zod_1.z.number().int(),
    totalPages: zod_1.z.number().int(),
})
    .openapi("Pagination");
//# sourceMappingURL=index.js.map
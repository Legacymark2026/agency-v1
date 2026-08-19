import { CodeParser, ServiceSpecMetadata } from "./parser";
import { serveSwaggerUI } from "@agency/openapi";
import { RequestHandler } from "express";

export { CodeParser } from "./parser";

/**
 * Convert parsed metadata into a valid OpenAPI 3.1.0 spec object.
 */
export function buildOpenApiDocument(meta: ServiceSpecMetadata) {
  const paths: Record<string, any> = {};
  const components: Record<string, any> = {
    schemas: {},
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "User JWT token issued by auth-service",
      },
    },
  };

  // Convert ParsedSchemas into OpenAPI components schemas
  for (const [schemaName, schemaInfo] of Object.entries(meta.schemas)) {
    const properties: Record<string, any> = {};
    const required: string[] = [];

    for (const [fieldName, fieldInfo] of Object.entries(schemaInfo.fields)) {
      properties[fieldName] = {
        type: fieldInfo.type,
        ...(fieldInfo.format ? { format: fieldInfo.format } : {}),
      };
      if (fieldInfo.required) {
        required.push(fieldName);
      }
    }

    components.schemas[schemaName] = {
      type: "object",
      properties,
      ...(required.length > 0 ? { required } : {}),
    };
  }

  // Convert ParsedRoutes into OpenAPI paths
  for (const route of meta.routes) {
    // Convert Express route format (e.g. /leads/:id) to OpenAPI format (e.g. /leads/{id})
    const openApiPath = route.path.replace(/:([a-zA-Z0-9_]+)/g, "{$1}");
    const pathParams: string[] = [];
    const pathParamMatches = route.path.match(/:([a-zA-Z0-9_]+)/g);
    if (pathParamMatches) {
      for (const match of pathParamMatches) {
        pathParams.push(match.slice(1));
      }
    }

    if (!paths[openApiPath]) {
      paths[openApiPath] = {};
    }

    const parameters = pathParams.map((p) => ({
      name: p,
      in: "path",
      required: true,
      schema: { type: "string" },
    }));

    const hasRequestBody = ["post", "put", "patch"].includes(route.method);
    const requestBody =
      hasRequestBody && route.schemaVarName
        ? {
            content: {
              "application/json": {
                schema: {
                  $ref: `#/components/schemas/${route.schemaVarName}`,
                },
              },
            },
          }
        : undefined;

    paths[openApiPath][route.method] = {
      summary: route.description || `Execute ${route.method.toUpperCase()} on ${openApiPath}`,
      description: route.description,
      parameters: parameters.length > 0 ? parameters : undefined,
      ...(requestBody ? { requestBody } : {}),
      responses: {
        200: {
          description: "Successful operation",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                },
              },
            },
          },
        },
        400: {
          description: "Invalid input or missing required fields",
        },
        401: {
          description: "Unauthorized - Authentication token required or invalid",
        },
      },
      security: [
        {
          BearerAuth: [],
        },
      ],
    };
  }

  return {
    openapi: "3.1.0",
    info: {
      title: meta.title,
      version: meta.version,
      description: `Auto-generated interactive API documentation for ${meta.title} using Scant.`,
    },
    servers: [
      {
        url: "/api/v1",
        description: "Current API version",
      },
    ],
    paths,
    components,
  };
}

/**
 * Scans a service directory, builds its OpenAPI spec, and returns the Swagger UI middleware.
 */
export function serveServiceDocs(serviceDir: string): RequestHandler[] {
  const parser = new CodeParser(serviceDir);
  const meta = parser.parseService();
  const spec = buildOpenApiDocument(meta);
  return serveSwaggerUI(spec);
}

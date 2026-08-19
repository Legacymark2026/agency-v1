import { ServiceSpecMetadata } from "./parser";
import { RequestHandler } from "express";
export { CodeParser } from "./parser";
/**
 * Convert parsed metadata into a valid OpenAPI 3.1.0 spec object.
 */
export declare function buildOpenApiDocument(meta: ServiceSpecMetadata): {
    openapi: string;
    info: {
        title: string;
        version: string;
        description: string;
    };
    servers: {
        url: string;
        description: string;
    }[];
    paths: Record<string, any>;
    components: Record<string, any>;
};
/**
 * Scans a service directory, builds its OpenAPI spec, and returns the Swagger UI middleware.
 */
export declare function serveServiceDocs(serviceDir: string): RequestHandler[];

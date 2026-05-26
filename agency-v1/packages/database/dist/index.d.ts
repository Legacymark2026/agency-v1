/**
 * @agency/database — Shared Database Package
 * ─────────────────────────────────────────────────────────────────────────────
 * Central Prisma client and type exports for all microservices.
 *
 * Usage in any service:
 *   import { prisma, Prisma } from "@agency/database";
 */
import { PrismaClient } from "@prisma/client";
export { PrismaClient } from "@prisma/client";
export { Prisma } from "@prisma/client";
export type * from "@prisma/client";
export declare const getPrismaAuth: () => PrismaClient;
export declare const getPrismaCore: () => PrismaClient;
export declare const getPrismaMedia: () => PrismaClient;
export declare const getPrismaAnalytics: () => PrismaClient;
export declare const prisma: any;
export default prisma;
//# sourceMappingURL=index.d.ts.map
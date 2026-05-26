/**
 * @agency/database — Shared Database Package
 * ─────────────────────────────────────────────────────────────────────────────
 * Central Prisma client and type exports for all microservices.
 *
 * Usage in any service:
 *   import { prisma, Prisma } from "@agency/database";
 */
export { PrismaClient } from "@prisma/client";
export { Prisma } from "@prisma/client";
export type * from "@prisma/client";
export declare const getPrismaAuth: () => any;
export declare const getPrismaCore: () => any;
export declare const getPrismaMedia: () => any;
export declare const getPrismaAnalytics: () => any;
export declare const prisma: any;
export default prisma;
//# sourceMappingURL=index.d.ts.map
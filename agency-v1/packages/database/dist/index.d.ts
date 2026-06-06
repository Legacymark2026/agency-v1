import { PrismaClient } from "@prisma/client";
import { AsyncLocalStorage } from "async_hooks";
export declare const primaryDatabaseStorage: AsyncLocalStorage<boolean>;
export declare function runInPrimary<T>(fn: () => Promise<T>): Promise<T>;
export { PrismaClient } from "@prisma/client";
export { Prisma } from "@prisma/client";
export type * from "@prisma/client";
export declare const getPrismaAuth: () => PrismaClient;
export declare const getPrismaCore: () => PrismaClient;
export declare const getPrismaMedia: () => PrismaClient;
export declare const getPrismaAnalytics: () => PrismaClient;
export declare const getPrismaAuthRead: () => PrismaClient;
export declare const getPrismaCoreRead: () => PrismaClient;
export declare const getPrismaMediaRead: () => PrismaClient;
export declare const getPrismaAnalyticsRead: () => PrismaClient;
export declare const prisma: any;
export * from "./cache-helper";
export default prisma;
//# sourceMappingURL=index.d.ts.map
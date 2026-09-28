import { PrismaClient } from "@prisma/client";
import { AsyncLocalStorage } from "async_hooks";
export declare const primaryDatabaseStorage: AsyncLocalStorage<boolean>;
export declare function runInPrimary<T>(fn: () => Promise<T>): Promise<T>;
export { PrismaClient } from "@prisma/client";
export { Prisma } from "@prisma/client";
export type * from "@prisma/client";
export declare const getPrimaryClient: () => PrismaClient;
export declare const getReplicaClient: () => PrismaClient;
export declare const prisma: any;
export * from "./cache-helper";
export default prisma;
export declare const getPrismaAuth: () => any;
export declare const getPrismaCore: () => any;
export declare const getPrismaMedia: () => any;
export declare const getPrismaAnalytics: () => any;
//# sourceMappingURL=index.d.ts.map
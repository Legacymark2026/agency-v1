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
//# sourceMappingURL=index.d.ts.map
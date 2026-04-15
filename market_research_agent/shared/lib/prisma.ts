import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

// A-4 Fix: Logging configurado — queries visibles en dev, solo errors en prod
export const prisma =
    globalForPrisma.prisma ||
    new PrismaClient({
        log:
            process.env.NODE_ENV === "development"
                ? [
                    { emit: "stdout", level: "query" },
                    { emit: "stdout", level: "warn" },
                    { emit: "stdout", level: "error" },
                ]
                : [{ emit: "stdout", level: "error" }],
    });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

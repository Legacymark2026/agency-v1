"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withPIIEncryption = void 0;
/**
 * Ultraprofessional Prisma Client Extension for PII Encryption
 *
 * This extension automatically intercepts Prisma queries for User and Invoice models,
 * encrypting specific fields (like `clientNit` and `clientPhone`) before writing to the database,
 * and decrypting them upon read operations.
 *
 * Usage:
 * ```ts
 * import { withPIIEncryption } from './pii-extension';
 * import { PrismaClient } from '@prisma/client';
 *
 * const baseClient = new PrismaClient();
 * const extendedClient = baseClient.$extends(withPIIEncryption);
 * ```
 *
 * Note: To use this extension, ensure `@agency/vault-client` is added to your package dependencies.
 */
const client_1 = require("@prisma/client");
// Ensure you have added `@agency/vault-client` to packages/database/package.json
const vault_client_1 = require("@agency/vault-client");
exports.withPIIEncryption = client_1.Prisma.defineExtension({
    name: 'pii-encryption',
    query: {
        user: {
            async $allOperations({ operation, args, query }) {
                // Encrypt fields on writes
                if (['create', 'update', 'upsert', 'createMany'].includes(operation)) {
                    const anyArgs = args;
                    if (anyArgs.data) {
                        const data = anyArgs.data;
                        if (data.clientPhone)
                            data.clientPhone = (0, vault_client_1.encryptPII)(data.clientPhone);
                        if (data.clientNit)
                            data.clientNit = (0, vault_client_1.encryptPII)(data.clientNit);
                    }
                }
                // Execute query
                const result = await query(args);
                // Decrypt fields on reads
                if (result) {
                    const decryptUser = (u) => {
                        if (u.clientPhone)
                            u.clientPhone = (0, vault_client_1.decryptPII)(u.clientPhone);
                        if (u.clientNit)
                            u.clientNit = (0, vault_client_1.decryptPII)(u.clientNit);
                        return u;
                    };
                    if (Array.isArray(result)) {
                        return result.map(decryptUser);
                    }
                    return decryptUser(result);
                }
                return result;
            },
        },
        invoice: {
            async $allOperations({ operation, args, query }) {
                // Encrypt fields on writes
                if (['create', 'update', 'upsert', 'createMany'].includes(operation)) {
                    const anyArgs = args;
                    if (anyArgs.data) {
                        const data = anyArgs.data;
                        if (data.clientPhone)
                            data.clientPhone = (0, vault_client_1.encryptPII)(data.clientPhone);
                        if (data.clientNit)
                            data.clientNit = (0, vault_client_1.encryptPII)(data.clientNit);
                    }
                }
                // Execute query
                const result = await query(args);
                // Decrypt fields on reads
                if (result) {
                    const decryptInvoice = (inv) => {
                        if (inv.clientPhone)
                            inv.clientPhone = (0, vault_client_1.decryptPII)(inv.clientPhone);
                        if (inv.clientNit)
                            inv.clientNit = (0, vault_client_1.decryptPII)(inv.clientNit);
                        return inv;
                    };
                    if (Array.isArray(result)) {
                        return result.map(decryptInvoice);
                    }
                    return decryptInvoice(result);
                }
                return result;
            },
        },
    },
});
//# sourceMappingURL=pii-extension.js.map
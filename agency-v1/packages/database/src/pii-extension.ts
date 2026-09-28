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
import { Prisma } from '@prisma/client';
// Ensure you have added `@agency/vault-client` to packages/database/package.json
import { encryptPII, decryptPII } from '@agency/vault-client';

export const withPIIEncryption = Prisma.defineExtension({
  name: 'pii-encryption',
  query: {
    user: {
      async $allOperations({ operation, args, query }) {
        // Encrypt fields on writes
        if (['create', 'update', 'upsert', 'createMany'].includes(operation)) {
          const anyArgs = args as any;
          if (anyArgs.data) {
            const data = anyArgs.data;
            if (data.clientPhone) data.clientPhone = encryptPII(data.clientPhone);
            if (data.clientNit) data.clientNit = encryptPII(data.clientNit);
          }
        }

        // Execute query
        const result = await query(args);

        // Decrypt fields on reads
        if (result) {
          const decryptUser = (u: any) => {
            if (u.clientPhone) u.clientPhone = decryptPII(u.clientPhone);
            if (u.clientNit) u.clientNit = decryptPII(u.clientNit);
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
          const anyArgs = args as any;
          if (anyArgs.data) {
            const data = anyArgs.data;
            if (data.clientPhone) data.clientPhone = encryptPII(data.clientPhone);
            if (data.clientNit) data.clientNit = encryptPII(data.clientNit);
          }
        }

        // Execute query
        const result = await query(args);

        // Decrypt fields on reads
        if (result) {
          const decryptInvoice = (inv: any) => {
            if (inv.clientPhone) inv.clientPhone = decryptPII(inv.clientPhone);
            if (inv.clientNit) inv.clientNit = decryptPII(inv.clientNit);
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

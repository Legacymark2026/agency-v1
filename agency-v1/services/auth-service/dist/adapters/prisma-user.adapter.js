"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaUserAdapter = void 0;
/**
 * Auth Service — Prisma User Repository Adapter
 * ─────────────────────────────────────────────────────────────────────────────
 */
const database_1 = require("@agency/database");
const auth_domain_1 = require("../core/domain/auth.domain");
class PrismaUserAdapter {
    async save(user) {
        try {
            await database_1.prisma.user.upsert({
                where: { id: user.id },
                update: {
                    role: user.role,
                    isActive: user.isActive,
                },
                create: {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    companyId: user.companyId,
                    isActive: user.isActive,
                },
            });
        }
        catch { }
        return user;
    }
    async findByEmail(email) {
        try {
            const row = await database_1.prisma.user.findUnique({ where: { email } });
            if (!row)
                return null;
            return new auth_domain_1.UserDomain(row.id, row.email, row.role, row.companyId, [], row.isActive);
        }
        catch {
            return null;
        }
    }
    async findById(id) {
        try {
            const row = await database_1.prisma.user.findUnique({ where: { id } });
            if (!row)
                return null;
            return new auth_domain_1.UserDomain(row.id, row.email, row.role, row.companyId, [], row.isActive);
        }
        catch {
            return null;
        }
    }
}
exports.PrismaUserAdapter = PrismaUserAdapter;
//# sourceMappingURL=prisma-user.adapter.js.map
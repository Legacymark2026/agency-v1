"use strict";
/**
 * services/auth-service/src/repositories/session.repository.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Session Repository Pattern Abstraction
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.sessionRepository = exports.PrismaSessionRepository = void 0;
const database_1 = require("@agency/database");
class PrismaSessionRepository {
    async create(data) {
        try {
            const session = await database_1.prisma.session.create({
                data,
            });
            return session;
        }
        catch (err) {
            console.error(`[PrismaSessionRepository] create error: ${err.message}`);
            throw err;
        }
    }
    async deleteByToken(token) {
        try {
            await database_1.prisma.session.deleteMany({
                where: { sessionToken: token },
            });
        }
        catch (err) {
            console.error(`[PrismaSessionRepository] deleteByToken error: ${err.message}`);
            throw err;
        }
    }
}
exports.PrismaSessionRepository = PrismaSessionRepository;
// Export singleton instance of the repository
exports.sessionRepository = new PrismaSessionRepository();
//# sourceMappingURL=session.repository.js.map
"use strict";
/**
 * services/auth-service/src/repositories/user.repository.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * User Repository Pattern Abstraction
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRepository = exports.PrismaUserRepository = void 0;
const database_1 = require("@agency/database");
const events_1 = require("@agency/events");
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const eventBus = new events_1.EventBus(REDIS_URL, "auth-repository");
class PrismaUserRepository {
    async findById(id) {
        try {
            const user = await database_1.prisma.user.findUnique({
                where: { id },
            });
            return user;
        }
        catch (err) {
            console.error(`[PrismaUserRepository] findById error: ${err.message}`);
            throw err;
        }
    }
    async findByEmail(email) {
        try {
            const user = await database_1.prisma.user.findUnique({
                where: { email },
            });
            return user;
        }
        catch (err) {
            console.error(`[PrismaUserRepository] findByEmail error: ${err.message}`);
            throw err;
        }
    }
    async update(id, data) {
        try {
            const user = await database_1.prisma.user.update({
                where: { id },
                data: data,
            });
            // CDC / Dual-Write synchronization event emission
            await eventBus.publish("user.updated", {
                userId: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                twoFactorEnabled: user.twoFactorEnabled,
                updatedAt: user.updatedAt.toISOString(),
            }).catch(err => console.warn("[UserRepository] Failed to publish user.updated event:", err.message));
            return user;
        }
        catch (err) {
            console.error(`[PrismaUserRepository] update error: ${err.message}`);
            throw err;
        }
    }
}
exports.PrismaUserRepository = PrismaUserRepository;
// Export singleton instance of the repository
exports.userRepository = new PrismaUserRepository();
//# sourceMappingURL=user.repository.js.map
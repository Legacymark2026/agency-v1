"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaAuthorizationAdapter = void 0;
const database_1 = require("@agency/database");
class PrismaAuthorizationAdapter {
    eventBus;
    constructor(eventBus) {
        this.eventBus = eventBus;
    }
    /**
     * Fast retrieval of tenant subscription state directly from Company table
     */
    async getCompanySubscription(companyId) {
        const company = await database_1.prisma.company.findUnique({
            where: { id: companyId },
            select: {
                id: true,
                subscriptionTier: true,
                subscriptionStatus: true,
                stripeCustomerId: true,
                stripeSubscriptionId: true,
            },
        });
        if (!company)
            return null;
        return {
            companyId: company.id,
            subscriptionTier: company.subscriptionTier || "free",
            subscriptionStatus: company.subscriptionStatus || "active",
            stripeCustomerId: company.stripeCustomerId,
            stripeSubscriptionId: company.stripeSubscriptionId,
        };
    }
    async listRolesByCompany(companyId, activeOnly = true) {
        const roles = await database_1.prisma.role.findMany({
            where: { companyId, ...(activeOnly ? { isActive: true } : {}) },
            include: { permissions: { include: { permission: true } } },
            orderBy: { createdAt: "asc" },
        });
        return roles;
    }
    async findRoleById(id) {
        const role = await database_1.prisma.role.findUnique({
            where: { id },
            include: { permissions: { include: { permission: true } } },
        });
        return role;
    }
    async createRole(dto) {
        const role = await database_1.prisma.role.create({
            data: {
                name: dto.name,
                companyId: dto.companyId,
                description: dto.description,
                priority: dto.priority,
                isDefault: dto.isDefault,
                permissions: {
                    create: (dto.permissionIds || []).map((pId) => ({ permissionId: pId })),
                },
            },
            include: { permissions: { include: { permission: true } } },
        });
        return role;
    }
    async updateRole(id, dto) {
        return database_1.prisma.$transaction(async (tx) => {
            if (dto.permissionIds !== undefined) {
                await tx.rolePermission.deleteMany({ where: { roleId: id } });
                await tx.rolePermission.createMany({
                    data: dto.permissionIds.map((pId) => ({ roleId: id, permissionId: pId })),
                });
            }
            const updated = await tx.role.update({
                where: { id },
                data: {
                    ...(dto.name && { name: dto.name }),
                    ...(dto.description !== undefined && { description: dto.description }),
                    ...(dto.isActive !== undefined && { isActive: dto.isActive }),
                    ...(dto.priority !== undefined && { priority: dto.priority }),
                    ...(dto.isDefault !== undefined && { isDefault: dto.isDefault }),
                },
                include: { permissions: { include: { permission: true } } },
            });
            return updated;
        });
    }
    async deleteRole(id) {
        await database_1.prisma.role.delete({ where: { id } });
        return true;
    }
    async assignUserRole(assignment) {
        const updated = await database_1.prisma.companyUser.upsert({
            where: {
                companyId_userId: { companyId: assignment.companyId, userId: assignment.userId },
            },
            update: { roleName: assignment.roleName },
            create: { companyId: assignment.companyId, userId: assignment.userId, roleName: assignment.roleName },
        });
        return {
            userId: updated.userId,
            companyId: updated.companyId,
            roleName: updated.roleName,
            assignedAt: updated.updatedAt,
        };
    }
    async listUsersWithRoles(companyId) {
        const companyUsers = await database_1.prisma.companyUser.findMany({
            where: { companyId },
        });
        const userIds = companyUsers.map((cu) => cu.userId);
        const users = await database_1.prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, name: true, email: true, image: true, role: true },
        });
        return users.map((u) => {
            const cu = companyUsers.find((c) => c.userId === u.id);
            return {
                id: u.id,
                name: u.name,
                email: u.email,
                companyRole: cu?.roleName || "member",
            };
        });
    }
    async listPermissions() {
        const permissions = await database_1.prisma.permission.findMany({ orderBy: { category: "asc" } });
        return permissions;
    }
    async syncPermissions(permissions) {
        const synced = [];
        for (const p of permissions) {
            const upserted = await database_1.prisma.permission.upsert({
                where: { name: p.name },
                update: { description: p.description, category: p.category },
                create: { name: p.name, description: p.description, category: p.category || "GENERAL" },
            });
            synced.push(upserted);
        }
        return synced;
    }
    async listRoleConfigs() {
        const configs = await database_1.prisma.roleConfig.findMany();
        return configs;
    }
    async upsertRoleConfig(config) {
        const saved = await database_1.prisma.roleConfig.upsert({
            where: { roleName: config.roleName },
            update: { allowedRoutes: config.allowedRoutes, description: config.description },
            create: { roleName: config.roleName, allowedRoutes: config.allowedRoutes, description: config.description },
        });
        return saved;
    }
    async deleteRoleConfig(roleName) {
        await database_1.prisma.roleConfig.delete({ where: { roleName } });
        return true;
    }
    async publishAuthorizationEvent(topic, payload) {
        if (!this.eventBus)
            return;
        try {
            await this.eventBus.publish(topic, {
                ...payload,
                emittedAt: new Date().toISOString(),
            });
        }
        catch (err) {
            console.warn(`[PrismaAuthorizationAdapter] Could not publish event ${topic}:`, err.message);
        }
    }
}
exports.PrismaAuthorizationAdapter = PrismaAuthorizationAdapter;

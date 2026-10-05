import { prisma } from "@agency/database";
import type { EventBus } from "@agency/events";
import {
  RoleDomain,
  PermissionDefinition,
  RoleConfigDomain,
  UserRoleAssignment,
  CompanySubscriptionDomain,
} from "../core/domain/authorization.domain";
import {
  IRoleRepositoryPort,
  IPermissionRepositoryPort,
  IRoleConfigRepositoryPort,
  ISubscriptionRepositoryPort,
  IAuthorizationEventPublisherPort,
  CreateRoleDTO,
  UpdateRoleDTO,
} from "../core/ports/authorization.ports";

import Redis from "ioredis";

export class PrismaAuthorizationAdapter
  implements
    IRoleRepositoryPort,
    IPermissionRepositoryPort,
    IRoleConfigRepositoryPort,
    ISubscriptionRepositoryPort,
    IAuthorizationEventPublisherPort
{
  private redis?: Redis;

  constructor(private readonly eventBus?: EventBus, redisUrl?: string) {
    if (redisUrl || process.env.REDIS_URL) {
      try {
        this.redis = new Redis(redisUrl || process.env.REDIS_URL || "redis://localhost:6379", {
          maxRetriesPerRequest: 1,
          enableReadyCheck: false,
          lazyConnect: true,
        });
        this.redis.connect().catch(() => {});
      } catch {
        // Redis optional fallback
      }
    }
  }

  /**
   * Fast retrieval of tenant subscription state with Redis L1 Cache (<2ms)
   */
  async getCompanySubscription(companyId: string): Promise<CompanySubscriptionDomain | null> {
    const cacheKey = `cache:sub:status:${companyId}`;
    if (this.redis) {
      try {
        const cached = await this.redis.get(cacheKey);
        if (cached) return JSON.parse(cached);
      } catch {
        // Cache miss/error fallback to DB
      }
    }

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: {
        id: true,
        subscriptionTier: true,
        subscriptionStatus: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
      },
    });

    if (!company) return null;

    const domain: CompanySubscriptionDomain = {
      companyId: company.id,
      subscriptionTier: company.subscriptionTier || "free",
      subscriptionStatus: company.subscriptionStatus || "active",
      stripeCustomerId: company.stripeCustomerId,
      stripeSubscriptionId: company.stripeSubscriptionId,
    };

    if (this.redis) {
      this.redis.setex(cacheKey, 120, JSON.stringify(domain)).catch(() => {});
    }

    return domain;
  }

  async listRolesByCompany(companyId: string, activeOnly = true): Promise<RoleDomain[]> {
    const cacheKey = `cache:authz:roles:${companyId}:${activeOnly ? "active" : "all"}`;
    if (this.redis) {
      try {
        const cached = await this.redis.get(cacheKey);
        if (cached) return JSON.parse(cached);
      } catch {
        // Fallback to DB
      }
    }

    const roles = await prisma.role.findMany({
      where: { companyId, ...(activeOnly ? { isActive: true } : {}) },
      include: { permissions: { include: { permission: true } } },
      orderBy: { createdAt: "asc" },
    });

    if (this.redis) {
      this.redis.setex(cacheKey, 120, JSON.stringify(roles)).catch(() => {});
    }

    return roles as any;
  }


  async findRoleById(id: string): Promise<RoleDomain | null> {
    const role = await prisma.role.findUnique({
      where: { id },
      include: { permissions: { include: { permission: true } } },
    });
    return role as any;
  }

  private async invalidateCompanyCache(companyId: string): Promise<void> {
    if (!this.redis || !companyId) return;
    try {
      await this.redis.del(`cache:authz:roles:${companyId}:active`);
      await this.redis.del(`cache:authz:roles:${companyId}:all`);
      await this.redis.del(`cache:sub:status:${companyId}`);
    } catch {
      // Non-critical cache purge failure
    }
  }

  async createRole(dto: CreateRoleDTO): Promise<RoleDomain> {
    const role = await prisma.role.create({
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
    await this.invalidateCompanyCache(dto.companyId);
    return role as any;
  }

  async updateRole(id: string, dto: UpdateRoleDTO): Promise<RoleDomain> {
    return prisma.$transaction(async (tx: any) => {
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
      await this.invalidateCompanyCache(updated.companyId);
      return updated as any;
    });
  }

  async deleteRole(id: string): Promise<boolean> {
    const existing = await prisma.role.findUnique({ where: { id }, select: { companyId: true } });
    await prisma.role.delete({ where: { id } });
    if (existing?.companyId) {
      await this.invalidateCompanyCache(existing.companyId);
    }
    return true;

  }

  async assignUserRole(assignment: UserRoleAssignment): Promise<UserRoleAssignment> {
    const updated = await (prisma as any).companyUser.upsert({
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

  async listUsersWithRoles(companyId: string) {
    const companyUsers = await (prisma as any).companyUser.findMany({
      where: { companyId },
    });
    const userIds = companyUsers.map((cu: any) => cu.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true, image: true, role: true },
    });

    return users.map((u: any) => {
      const cu = companyUsers.find((c: any) => c.userId === u.id);
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        companyRole: cu?.roleName || "member",
      };
    });
  }

  async listPermissions(): Promise<PermissionDefinition[]> {
    const permissions = await prisma.permission.findMany({ orderBy: { module: "asc" } });
    return permissions.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      category: p.module,
    }));
  }

  async syncPermissions(permissions: Array<{ name: string; description?: string; category?: string }>): Promise<PermissionDefinition[]> {
    const synced: any[] = [];
    for (const p of permissions) {
      const moduleName = p.category || (p.name.includes(".") ? p.name.split(".")[0] : "GENERAL");
      const upserted = await prisma.permission.upsert({
        where: { name: p.name },
        update: { description: p.description, module: moduleName },
        create: { name: p.name, description: p.description, module: moduleName },
      });
      synced.push({
        id: upserted.id,
        name: upserted.name,
        description: upserted.description,
        category: upserted.module,
      });
    }
    return synced;
  }

  async listRoleConfigs(): Promise<RoleConfigDomain[]> {
    const configs = await prisma.roleConfig.findMany();
    return configs as any;
  }

  async upsertRoleConfig(config: RoleConfigDomain): Promise<RoleConfigDomain> {
    const saved = await prisma.roleConfig.upsert({
      where: { roleName: config.roleName },
      update: { allowedRoutes: config.allowedRoutes, description: config.description },
      create: { roleName: config.roleName, allowedRoutes: config.allowedRoutes, description: config.description },
    });
    return saved as any;
  }

  async deleteRoleConfig(roleName: string): Promise<boolean> {
    await prisma.roleConfig.delete({ where: { roleName } });
    return true;
  }

  async publishAuthorizationEvent(topic: string, payload: Record<string, any>): Promise<void> {
    if (!this.eventBus) return;
    try {
      await this.eventBus.publish(topic as any, {
        ...payload,
        emittedAt: new Date().toISOString(),
      });
    } catch (err: any) {
      console.warn(`[PrismaAuthorizationAdapter] Could not publish event ${topic}:`, err.message);
    }
  }
}

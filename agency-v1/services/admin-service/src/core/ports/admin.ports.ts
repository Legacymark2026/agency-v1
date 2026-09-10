/**
 * Admin Service — Hexagonal Ports
 */
import { TenantDomain, SubscriptionTier } from "../domain/admin.domain";

export interface IAdminUseCases {
  provisionTenant(dto: { name: string; domain: string; tier?: SubscriptionTier }): Promise<TenantDomain>;
  upgradeTenant(tenantId: string, tier: SubscriptionTier): Promise<TenantDomain>;
  getTenants(): Promise<TenantDomain[]>;
}

export interface ITenantRepositoryPort {
  save(t: TenantDomain): Promise<TenantDomain>;
  findById(id: string): Promise<TenantDomain | null>;
  findAll(): Promise<TenantDomain[]>;
}

export interface IAdminEventPublisherPort {
  publishEvent(topic: string, event: Record<string, any>): Promise<void>;
}

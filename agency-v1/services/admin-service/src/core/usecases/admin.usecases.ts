/**
 * Admin Service — Pure Use Cases
 */
import {
  IAdminUseCases,
  ITenantRepositoryPort,
  IAdminEventPublisherPort,
} from "../ports/admin.ports";
import { TenantDomain, SubscriptionTier } from "../domain/admin.domain";

export class AdminUseCases implements IAdminUseCases {
  constructor(
    private readonly repoPort: ITenantRepositoryPort,
    private readonly eventPublisher: IAdminEventPublisherPort
  ) {}

  public async provisionTenant(dto: { name: string; domain: string; tier?: SubscriptionTier }): Promise<TenantDomain> {
    const tenant = new TenantDomain(
      "ten_" + Math.random().toString(36).substring(2, 9),
      dto.name,
      dto.domain,
      dto.tier || "STARTER"
    );
    const saved = await this.repoPort.save(tenant);
    await this.eventPublisher.publishEvent("admin.tenant.provisioned", { tenantId: saved.id, domain: saved.domain });
    return saved;
  }

  public async upgradeTenant(tenantId: string, tier: SubscriptionTier): Promise<TenantDomain> {
    const t = await this.repoPort.findById(tenantId);
    if (!t) throw new Error(`Tenant ${tenantId} no encontrado`);
    const upgraded = t.upgradeTier(tier);
    const saved = await this.repoPort.save(upgraded);
    await this.eventPublisher.publishEvent("admin.tenant.upgraded", { tenantId: saved.id, tier: saved.tier });
    return saved;
  }

  public async getTenants(): Promise<TenantDomain[]> {
    return this.repoPort.findAll();
  }
}

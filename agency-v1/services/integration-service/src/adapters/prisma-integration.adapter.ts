import { IIntegrationRepositoryPort } from "../core/ports/integration.ports";
import { IntegrationDomain } from "../core/domain/integration.domain";

export class PrismaIntegrationAdapter implements IIntegrationRepositoryPort {
  private mem = new Map<string, IntegrationDomain>();
  public async save(i: IntegrationDomain) { this.mem.set(i.id, i); return i; }
  public async findById(id: string) { return this.mem.get(id) || null; }
  public async findByCompanyAndProvider(cId: string, p: string) {
    return Array.from(this.mem.values()).find(i => i.companyId === cId && i.provider === p) || null;
  }
}

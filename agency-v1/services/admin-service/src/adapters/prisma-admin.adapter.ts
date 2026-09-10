import { ITenantRepositoryPort } from "../core/ports/admin.ports";
import { TenantDomain } from "../core/domain/admin.domain";

export class PrismaAdminAdapter implements ITenantRepositoryPort {
  private mem = new Map<string, TenantDomain>();
  public async save(t: TenantDomain) { this.mem.set(t.id, t); return t; }
  public async findById(id: string) { return this.mem.get(id) || null; }
  public async findAll() { return Array.from(this.mem.values()); }
}

import { IHrRepositoryPort } from "../core/ports/hr.ports";
import { EmployeeDomain } from "../core/domain/hr.domain";

export class PrismaHrAdapter implements IHrRepositoryPort {
  private mem = new Map<string, EmployeeDomain>();
  public async save(e: EmployeeDomain) { this.mem.set(e.id, e); return e; }
  public async findById(id: string) { return this.mem.get(id) || null; }
  public async findByCompany(cId: string) { return Array.from(this.mem.values()).filter(e => e.companyId === cId); }
}

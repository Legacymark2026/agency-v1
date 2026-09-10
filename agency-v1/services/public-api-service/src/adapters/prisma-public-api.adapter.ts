import { IApiKeyRepositoryPort } from "../core/ports/public-api.ports";
import { ApiKeyDomain } from "../core/domain/public-api.domain";

export class PrismaPublicApiAdapter implements IApiKeyRepositoryPort {
  private mem = new Map<string, ApiKeyDomain>();
  public async save(k: ApiKeyDomain) { this.mem.set(k.keyHash, k); return k; }
  public async findByHash(h: string) { return this.mem.get(h) || null; }
}

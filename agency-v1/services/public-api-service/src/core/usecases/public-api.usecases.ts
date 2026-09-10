/**
 * Public API Service — Pure Use Cases
 */
import { createHash } from "crypto";
import {
  IPublicApiUseCases,
  IApiKeyRepositoryPort,
  IPublicApiEventPublisherPort,
} from "../ports/public-api.ports";
import { ApiKeyDomain } from "../domain/public-api.domain";

export class PublicApiUseCases implements IPublicApiUseCases {
  constructor(
    private readonly repoPort: IApiKeyRepositoryPort,
    private readonly eventPublisher: IPublicApiEventPublisherPort
  ) {}

  public async createApiKey(dto: { companyId: string; name: string; scopes?: string[] }): Promise<{ apiKey: string; entity: ApiKeyDomain }> {
    const rawKey = "agk_" + Math.random().toString(36).substring(2, 24);
    const keyHash = createHash("sha256").update(rawKey).digest("hex");

    const entity = new ApiKeyDomain(
      "key_" + Math.random().toString(36).substring(2, 9),
      dto.companyId,
      dto.name,
      keyHash,
      dto.scopes || ["*"]
    );

    const saved = await this.repoPort.save(entity);
    await this.eventPublisher.publishEvent("public_api.key.created", { keyId: saved.id, companyId: saved.companyId });

    return { apiKey: rawKey, entity: saved };
  }

  public async validateApiKey(rawKey: string, requiredScope?: string): Promise<ApiKeyDomain | null> {
    const keyHash = createHash("sha256").update(rawKey).digest("hex");
    const key = await this.repoPort.findByHash(keyHash);
    if (!key || !key.isActive) return null;
    if (requiredScope && !key.hasScope(requiredScope)) return null;
    return key;
  }
}

/**
 * Public API Service — Hexagonal Ports
 */
import { ApiKeyDomain } from "../domain/public-api.domain";

export interface IPublicApiUseCases {
  createApiKey(dto: { companyId: string; name: string; scopes?: string[] }): Promise<{ apiKey: string; entity: ApiKeyDomain }>;
  validateApiKey(rawKey: string, requiredScope?: string): Promise<ApiKeyDomain | null>;
}

export interface IApiKeyRepositoryPort {
  save(key: ApiKeyDomain): Promise<ApiKeyDomain>;
  findByHash(hash: string): Promise<ApiKeyDomain | null>;
}

export interface IPublicApiEventPublisherPort {
  publishEvent(topic: string, event: Record<string, any>): Promise<void>;
}

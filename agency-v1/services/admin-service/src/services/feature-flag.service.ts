/**
 * Dynamic Feature Flag & Tenant Tier Manager
 * ─────────────────────────────────────────────────────────────────────────────
 * Manages runtime feature toggling, canary rollouts, and plan capabilities
 * without requiring microservice restarts.
 */

export interface FeatureFlagConfig {
  flagKey: string;
  isEnabled: boolean;
  minTenantTier: "FREE" | "PRO" | "ENTERPRISE";
  rolloutPercentage: number;
}

export class FeatureFlagService {
  private flags: Map<string, FeatureFlagConfig> = new Map();

  constructor() {
    // Default Enterprise Flag Registries
    this.flags.set("FEATURE_RAG", { flagKey: "FEATURE_RAG", isEnabled: true, minTenantTier: "PRO", rolloutPercentage: 100 });
    this.flags.set("FEATURE_OCR", { flagKey: "FEATURE_OCR", isEnabled: true, minTenantTier: "PRO", rolloutPercentage: 100 });
    this.flags.set("FEATURE_FRAUD_GUARD", { flagKey: "FEATURE_FRAUD_GUARD", isEnabled: true, minTenantTier: "ENTERPRISE", rolloutPercentage: 100 });
    this.flags.set("FEATURE_DIAN_INVOICING", { flagKey: "FEATURE_DIAN_INVOICING", isEnabled: true, minTenantTier: "PRO", rolloutPercentage: 100 });
    this.flags.set("FEATURE_SECURITY_AUDIT", { flagKey: "FEATURE_SECURITY_AUDIT", isEnabled: true, minTenantTier: "ENTERPRISE", rolloutPercentage: 100 });
  }

  public isFeatureEnabledForTenant(flagKey: string, tenantTier: "FREE" | "PRO" | "ENTERPRISE" = "FREE"): boolean {
    const flag = this.flags.get(flagKey);
    if (!flag || !flag.isEnabled) return false;

    const tierRank = { FREE: 1, PRO: 2, ENTERPRISE: 3 };
    return tierRank[tenantTier] >= tierRank[flag.minTenantTier];
  }

  public setFeatureFlag(config: FeatureFlagConfig): void {
    this.flags.set(config.flagKey, config);
  }
}

export const featureFlagService = new FeatureFlagService();

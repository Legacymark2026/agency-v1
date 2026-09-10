/**
 * Public API Service — Pure Domain Entities & Rate Limiting Rules
 */
export class ApiKeyDomain {
  constructor(
    public readonly id: string,
    public readonly companyId: string,
    public readonly name: string,
    public readonly keyHash: string,
    public readonly scopes: string[] = ["*"],
    public readonly rateLimitPerMin: number = 120,
    public readonly isActive: boolean = true,
    public readonly createdAt: Date = new Date()
  ) {}

  public hasScope(scope: string): boolean {
    if (this.scopes.includes("*")) return true;
    return this.scopes.includes(scope);
  }
}

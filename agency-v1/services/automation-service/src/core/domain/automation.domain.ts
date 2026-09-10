/**
 * Automation Service — Pure Domain Entities & Calculations
 * ─────────────────────────────────────────────────────────────────────────────
 * Zero external framework dependencies.
 */

export function calculateSuccessRate(total: number, failed: number): number {
  if (total <= 0) return 0;
  return Math.round(((total - failed) / total) * 100);
}

export function isCronAuthorized(providedSecret: string | undefined, expectedSecret: string | undefined): boolean {
  if (!expectedSecret) return true;
  return providedSecret === expectedSecret;
}

export function evaluateCondition(left: unknown, operator: string, right: unknown): boolean {
  switch (operator) {
    case "EQUALS":
      return String(left) === String(right);
    case "NOT_EQUALS":
      return String(left) !== String(right);
    case "GREATER_THAN":
      return Number(left) > Number(right);
    case "LESS_THAN":
      return Number(left) < Number(right);
    case "CONTAINS":
      return typeof left === "string" && left.includes(String(right));
    default:
      return false;
  }
}

export class WorkflowDomain {
  constructor(
    public readonly id: string,
    public readonly companyId: string,
    public readonly name: string,
    public readonly triggerType: string,
    public readonly isActive: boolean = true,
    public readonly actions: Array<{ type: string; config: Record<string, any> }> = [],
    public readonly totalExecutions: number = 0,
    public readonly failedExecutions: number = 0,
    public readonly createdAt: Date = new Date()
  ) {}

  public get successRate(): number {
    return calculateSuccessRate(this.totalExecutions, this.failedExecutions);
  }

  public recordExecution(success: boolean): WorkflowDomain {
    return new WorkflowDomain(
      this.id,
      this.companyId,
      this.name,
      this.triggerType,
      this.isActive,
      this.actions,
      this.totalExecutions + 1,
      success ? this.failedExecutions : this.failedExecutions + 1,
      this.createdAt
    );
  }
}

/**
 * CRM Service — Pure Domain Entities & Calculations
 * ─────────────────────────────────────────────────────────────────────────────
 * Zero external framework dependencies.
 */

export interface LeadCondition {
  field: string;
  operator: "EQUALS" | "CONTAINS" | "STARTS_WITH" | "ENDS_WITH" | string;
  value: string;
}

export function evaluateCondition(lead: Record<string, any>, condition: LeadCondition): boolean {
  let leadValue = lead[condition.field];
  if (leadValue === undefined && lead.formData) {
    leadValue = lead.formData[condition.field];
  }

  if (leadValue === undefined || leadValue === null) return false;

  const valueStr = String(leadValue).toLowerCase().trim();
  const condValue = String(condition.value).toLowerCase().trim();

  switch (condition.operator) {
    case "EQUALS":
      return valueStr === condValue;
    case "CONTAINS":
      return valueStr.includes(condValue);
    case "STARTS_WITH":
      return valueStr.startsWith(condValue);
    case "ENDS_WITH":
      return valueStr.endsWith(condValue);
    default:
      return false;
  }
}

export function evaluateScoringRule(value: unknown, operator: string, ruleValue: string | null): boolean {
  switch (operator) {
    case "exists":
      return value !== null && value !== undefined && value !== "";
    case "equals":
      return String(value) === ruleValue;
    case "contains":
      return typeof value === "string" && value.toLowerCase().includes((ruleValue ?? "").toLowerCase());
    case "greaterThan":
      return typeof value === "number" && value > Number(ruleValue);
    case "lessThan":
      return typeof value === "number" && value < Number(ruleValue);
    case "in":
      return (ruleValue ?? "").split(",").map((s) => s.trim()).includes(String(value));
    default:
      return false;
  }
}

export function calculateCommission(
  dealValue: number,
  baseRate: number,
  isAcceleratorActive: boolean,
  capAmount?: number
): number {
  const effectiveRate = isAcceleratorActive ? baseRate * 1.5 : baseRate;
  let amount = dealValue * effectiveRate;
  if (capAmount && amount > capAmount) {
    amount = capAmount;
  }
  return Math.round(amount * 100) / 100;
}

export class LeadDomain {
  constructor(
    public readonly id: string,
    public readonly companyId: string,
    public readonly email: string,
    public readonly fullName?: string,
    public readonly score: number = 0,
    public readonly assignedTo?: string,
    public readonly status: string = "NEW",
    public readonly formData: Record<string, any> = {},
    public readonly createdAt: Date = new Date()
  ) {}

  public assignToAgent(agentId: string): LeadDomain {
    return new LeadDomain(
      this.id,
      this.companyId,
      this.email,
      this.fullName,
      this.score,
      agentId,
      "ASSIGNED",
      this.formData,
      this.createdAt
    );
  }

  public updateScore(newScore: number): LeadDomain {
    return new LeadDomain(
      this.id,
      this.companyId,
      this.email,
      this.fullName,
      newScore,
      this.assignedTo,
      this.status,
      this.formData,
      this.createdAt
    );
  }
}

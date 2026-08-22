/**
 * Automated Payroll & Tax Withholding Calculation Service
 * ─────────────────────────────────────────────────────────────────────────────
 * Calculates employee net salary, legal health/pension deductions, overtime,
 * transport allowance, and tax withholding.
 */

export interface PayrollCalculationInput {
  employeeId: string;
  baseSalary: number;
  overtimeHours?: number;
  overtimeRatePerHour?: number;
  hasTransportAllowance?: boolean;
}

export interface PayrollCalculationResult {
  employeeId: string;
  baseSalary: number;
  overtimePay: number;
  transportAllowance: number;
  grossEarnings: number;
  healthDeduction: number;
  pensionDeduction: number;
  taxWithholding: number;
  totalDeductions: number;
  netPay: number;
  calculatedAt: string;
}

export function calculateEmployeePayroll(input: PayrollCalculationInput): PayrollCalculationResult {
  const baseSalary = input.baseSalary || 0;
  const overtimeHours = input.overtimeHours || 0;
  const overtimeRate = input.overtimeRatePerHour || Math.round(baseSalary / 240 * 1.25);
  const overtimePay = overtimeHours * overtimeRate;

  // Colombian legal transport allowance (under 2 minimum wages)
  const transportAllowance = input.hasTransportAllowance || baseSalary <= 2800000 ? 162000 : 0;

  const grossEarnings = baseSalary + overtimePay + transportAllowance;

  // Deductions (4% Health + 4% Pension on base salary)
  const healthDeduction = Math.round(baseSalary * 0.04);
  const pensionDeduction = Math.round(baseSalary * 0.04);

  // Retención en la fuente heuristic
  let taxWithholding = 0;
  if (baseSalary > 6000000) {
    taxWithholding = Math.round((baseSalary - 6000000) * 0.19);
  }

  const totalDeductions = healthDeduction + pensionDeduction + taxWithholding;
  const netPay = grossEarnings - totalDeductions;

  return {
    employeeId: input.employeeId,
    baseSalary,
    overtimePay,
    transportAllowance,
    grossEarnings,
    healthDeduction,
    pensionDeduction,
    taxWithholding,
    totalDeductions,
    netPay,
    calculatedAt: new Date().toISOString(),
  };
}

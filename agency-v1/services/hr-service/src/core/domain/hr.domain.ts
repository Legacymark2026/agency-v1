/**
 * HR Service — Pure Domain Entities & Calculations
 */
export { calculateEmployeePayroll, PayrollCalculationInput, PayrollCalculationResult } from "../../services/payroll-calculator.service";

export class EmployeeDomain {
  constructor(
    public readonly id: string,
    public readonly companyId: string,
    public readonly fullName: string,
    public readonly email: string,
    public readonly baseSalary: number,
    public readonly department: string = "GENERAL",
    public readonly status: "ACTIVE" | "ON_LEAVE" | "TERMINATED" = "ACTIVE",
    public readonly createdAt: Date = new Date()
  ) {}
}

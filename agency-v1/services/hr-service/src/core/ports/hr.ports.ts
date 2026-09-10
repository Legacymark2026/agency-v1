/**
 * HR Service — Hexagonal Ports
 */
import { EmployeeDomain, PayrollCalculationResult } from "../domain/hr.domain";

export interface IHrUseCases {
  registerEmployee(dto: { companyId: string; fullName: string; email: string; baseSalary: number; department?: string }): Promise<EmployeeDomain>;
  generatePayroll(employeeId: string, overtimeHours?: number): Promise<PayrollCalculationResult>;
}

export interface IHrRepositoryPort {
  save(emp: EmployeeDomain): Promise<EmployeeDomain>;
  findById(id: string): Promise<EmployeeDomain | null>;
  findByCompany(companyId: string): Promise<EmployeeDomain[]>;
}

export interface IHrEventPublisherPort {
  publishEvent(topic: string, event: Record<string, any>): Promise<void>;
}

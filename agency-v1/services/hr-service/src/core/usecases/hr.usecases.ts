/**
 * HR Service — Pure Use Cases
 */
import {
  IHrUseCases,
  IHrRepositoryPort,
  IHrEventPublisherPort,
} from "../ports/hr.ports";
import { EmployeeDomain, calculateEmployeePayroll, PayrollCalculationResult } from "../domain/hr.domain";

export class HrUseCases implements IHrUseCases {
  constructor(
    private readonly repoPort: IHrRepositoryPort,
    private readonly eventPublisher: IHrEventPublisherPort
  ) {}

  public async registerEmployee(dto: { companyId: string; fullName: string; email: string; baseSalary: number; department?: string }): Promise<EmployeeDomain> {
    const emp = new EmployeeDomain(
      "emp_" + Math.random().toString(36).substring(2, 9),
      dto.companyId,
      dto.fullName,
      dto.email,
      dto.baseSalary,
      dto.department || "GENERAL"
    );
    const saved = await this.repoPort.save(emp);
    await this.eventPublisher.publishEvent("hr.employee.registered", { employeeId: saved.id, companyId: saved.companyId });
    return saved;
  }

  public async generatePayroll(employeeId: string, overtimeHours = 0): Promise<PayrollCalculationResult> {
    const emp = await this.repoPort.findById(employeeId);
    if (!emp) throw new Error(`Empleado ${employeeId} no encontrado`);
    const payroll = calculateEmployeePayroll({
      employeeId: emp.id,
      baseSalary: emp.baseSalary,
      overtimeHours,
    });
    await this.eventPublisher.publishEvent("hr.payroll.calculated", { employeeId: emp.id, netPay: payroll.netPay });
    return payroll;
  }
}

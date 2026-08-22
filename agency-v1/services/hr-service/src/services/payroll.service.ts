import { prisma } from "@agency/database";

export interface PayrollCalculationInput {
  employeeId: string;
  hoursWorked: number;
  ratePerHour: number;
  bonus?: number;
}

export class PayrollService {
  /**
   * Calcula la nómina de un empleado aplicando deducciones (salud, pensión, retención en la fuente)
   */
  static async calculatePayroll(input: PayrollCalculationInput) {
    console.log(`[PayrollService] Calculating payroll for employee: ${input.employeeId}`);

    const baseSalary = input.hoursWorked * input.ratePerHour;
    const bonus = input.bonus || 0;
    const grossSalary = baseSalary + bonus;

    const healthDeduction = grossSalary * 0.04;
    const pensionDeduction = grossSalary * 0.04;
    
    let taxWithholding = 0;
    if (grossSalary > 4000) {
      taxWithholding = grossSalary * 0.20;
    } else if (grossSalary > 2000) {
      taxWithholding = grossSalary * 0.10;
    } else if (grossSalary > 1000) {
      taxWithholding = grossSalary * 0.05;
    }

    const totalDeductions = healthDeduction + pensionDeduction + taxWithholding;
    const netSalary = grossSalary - totalDeductions;

    let employeeName = "Empleado LegacyMark";
    try {
      const emp = await (prisma as any).employee.findUnique({
        where: { id: input.employeeId }
      });
      if (emp) {
        employeeName = emp.name || employeeName;
      }
    } catch {
      // Ignore
    }

    return {
      employeeId: input.employeeId,
      employeeName,
      hoursWorked: input.hoursWorked,
      ratePerHour: input.ratePerHour,
      baseSalary: parseFloat(baseSalary.toFixed(2)),
      bonus: parseFloat(bonus.toFixed(2)),
      grossSalary: parseFloat(grossSalary.toFixed(2)),
      deductions: {
        health: parseFloat(healthDeduction.toFixed(2)),
        pension: parseFloat(pensionDeduction.toFixed(2)),
        tax: parseFloat(taxWithholding.toFixed(2)),
        total: parseFloat(totalDeductions.toFixed(2))
      },
      netSalary: parseFloat(netSalary.toFixed(2)),
      calculatedAt: new Date().toISOString()
    };
  }
}

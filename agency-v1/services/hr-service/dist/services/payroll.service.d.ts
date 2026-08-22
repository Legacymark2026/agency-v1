export interface PayrollCalculationInput {
    employeeId: string;
    hoursWorked: number;
    ratePerHour: number;
    bonus?: number;
}
export declare class PayrollService {
    /**
     * Calcula la nómina de un empleado aplicando deducciones (salud, pensión, retención en la fuente)
     */
    static calculatePayroll(input: PayrollCalculationInput): Promise<{
        employeeId: string;
        employeeName: string;
        hoursWorked: number;
        ratePerHour: number;
        baseSalary: number;
        bonus: number;
        grossSalary: number;
        deductions: {
            health: number;
            pension: number;
            tax: number;
            total: number;
        };
        netSalary: number;
        calculatedAt: string;
    }>;
}

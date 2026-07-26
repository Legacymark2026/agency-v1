/**
 * MOTOR DE GENERACIÓN DE ARCHIVOS PILA & DISPERSIÓN BANCARIA MASIVA (COLOMBIA)
 * Soporta operadores PILA (SOI, MiPlanilla, Aportes en Línea, Simple) y formato Bancolombia PAB / ACH.
 */

export interface EmployeePilaRecord {
    id: string;
    documentType: string;
    documentNumber: string;
    firstName: string;
    lastName: string;
    baseSalary: number;
    workedDays: number;
    epsName: string;
    afpName: string;
    arlName: string;
    riskLevel: number;
    bankName: string;
    bankAccountType: string;
    bankAccount: string;
}

export function calculatePilaContributions(employee: EmployeePilaRecord) {
    const ibc = (employee.baseSalary / 30) * employee.workedDays; // Ingreso Base de Cotización
    
    // Tarifa ARL según nivel de riesgo
    const arlRates: Record<number, number> = {
        1: 0.00522,
        2: 0.01044,
        3: 0.02436,
        4: 0.04350,
        5: 0.06960,
    };
    const arlRate = arlRates[employee.riskLevel] || 0.00522;

    const healthEmployee = ibc * 0.04;
    const healthEmployer = ibc * 0.085;
    
    const pensionEmployee = ibc * 0.04;
    const pensionEmployer = ibc * 0.12;

    const arlEmployer = ibc * arlRate;
    const ccfEmployer = ibc * 0.04; // Caja de Compensación 4%
    const senaEmployer = ibc * 0.02; // SENA 2%
    const icbfEmployer = ibc * 0.03; // ICBF 3%

    const totalEmployeeDeductions = healthEmployee + pensionEmployee;
    const totalEmployerContributions = healthEmployer + pensionEmployer + arlEmployer + ccfEmployer + senaEmployer + icbfEmployer;

    return {
        ibc,
        healthEmployee,
        healthEmployer,
        pensionEmployee,
        pensionEmployer,
        arlEmployer,
        ccfEmployer,
        senaEmployer,
        icbfEmployer,
        totalEmployeeDeductions,
        totalEmployerContributions,
        grandTotalPila: totalEmployeeDeductions + totalEmployerContributions,
    };
}

export function generatePilaCsv(employees: EmployeePilaRecord[]): string {
    let csv = "TipoDoc,Documento,Nombres,Apellidos,IBC,Salud_Empleado,Salud_Patrono,Pension_Empleado,Pension_Patrono,ARL_Patrono,CCF_Patrono,Total_PILA\n";
    
    employees.forEach(emp => {
        const c = calculatePilaContributions(emp);
        csv += `${emp.documentType},${emp.documentNumber},"${emp.firstName}","${emp.lastName}",${c.ibc.toFixed(0)},${c.healthEmployee.toFixed(0)},${c.healthEmployer.toFixed(0)},${c.pensionEmployee.toFixed(0)},${c.pensionEmployer.toFixed(0)},${c.arlEmployer.toFixed(0)},${c.ccfEmployer.toFixed(0)},${c.grandTotalPila.toFixed(0)}\n`;
    });

    return csv;
}

export function generateBankDispersalTxt(employees: EmployeePilaRecord[]): string {
    let txt = "HEADER_DISPERSION_PAB_BANCOLOMBIA_ACH\n";
    employees.forEach(emp => {
        const netPay = emp.baseSalary - (emp.baseSalary * 0.08); // Salario Neto estimado
        txt += `PAY;${emp.documentNumber};${emp.firstName} ${emp.lastName};${emp.bankName};${emp.bankAccountType};${emp.bankAccount || "0000000000"};${netPay.toFixed(0)}\n`;
    });
    return txt;
}

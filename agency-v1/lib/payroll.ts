/**
 * FASE 6: NÓMINA Y EGRESOS DE PERSONAL (DIAN)
 * Archivo Core EXTENDIDO: Lógica de cálculo, Parafiscales del Empleador y Reporte PILA
 */

// ─── Constantes SMMLV ─────────────────────────────────────────────────────────
export const SMMLV = 1_300_000;
export const AUX_TRANSPORTE = 162_000;

// ─── Tipos Base ───────────────────────────────────────────────────────────────
export interface CreatePayrollRequest {
    employeeId: string;
    periodStart: string;
    periodEnd: string;
    paymentMethod: string;
    isElectronic: boolean;
    notes?: string;
    workedDays?: number; // 0-30, para prorrataeo. Si vacío = 30
    templateId?: string;
    manualItems?: {
        type: 'EARNING' | 'DEDUCTION';
        concept: 'COMMISSION' | 'BONUS' | 'ADVANCE' | 'VACATION' | 'INCAPACITY' | 'FINE' | 'OTHER';
        description: string;
        amount: number;
    }[];
}

export interface ListPayrollResponse {
    id: string;
    employeeName: string;
    documentNumber: string;
    periodStart: string;
    periodEnd: string;
    issueDate: string;
    status: string;
    dianStatus: string | null;
    totalEarnings: number;
    totalDeductions: number;
    netPay: number;
}

export interface PayrollItemResult {
    type: 'EARNING' | 'DEDUCTION';
    concept: string;
    description: string;
    amount: number;
}

export interface CalculationResult {
    totalEarnings: number;
    totalDeductions: number;
    netPay: number;
    employerCost: number; // Costo total para la empresa (empleado + parafiscales empleador)
    items: PayrollItemResult[];
    employerContributions: PayrollItemResult[]; // Parafiscales no deducidos al empleado
}

// ─── Función de prorrataeo ────────────────────────────────────────────────────
export function prorateAmount(amount: number, workedDays: number, totalDays: number = 30): number {
    if (workedDays >= totalDays || workedDays <= 0) return amount;
    return Math.round((amount / totalDays) * workedDays);
}

// ─── Cálculo Principal (Empleado) ─────────────────────────────────────────────
export function calculatePayroll(
    baseSalary: number,
    contractType: string,
    manualItems: CreatePayrollRequest['manualItems'] = [],
    workedDays: number = 30
): CalculationResult {
    const items: PayrollItemResult[] = [];
    const employerContributions: PayrollItemResult[] = [];
    let totalEarnings = 0;
    let totalDeductions = 0;

    const proratedSalary = prorateAmount(baseSalary, workedDays);

    // 1. Salario Base (prorateado si aplica)
    items.push({
        type: 'EARNING',
        concept: 'SALARY',
        description: contractType === 'LABORAL'
            ? `Salario Básico${workedDays < 30 ? ` (${workedDays} días)` : ''}`
            : `Honorarios Base${workedDays < 30 ? ` (${workedDays} días)` : ''}`,
        amount: proratedSalary,
    });
    totalEarnings += proratedSalary;

    // 2. Comisiones / Bonificaciones manuales EARNING
    const manualEarningsAmount = (manualItems || [])
        .filter(item => item.type === 'EARNING')
        .reduce((sum, item) => {
            items.push({ ...item, type: 'EARNING' });
            return sum + item.amount;
        }, 0);
    totalEarnings += manualEarningsAmount;

    // Base para calcular aportes (salario + devengos constituivos de salario)
    const basePensional = baseSalary + manualEarningsAmount;

    if (contractType === 'LABORAL') {
        // 3. Auxilio de Transporte (hasta 2 SMMLV, solo si trabaja)
        if (baseSalary <= (SMMLV * 2) && workedDays > 0) {
            const auxTransporte = prorateAmount(AUX_TRANSPORTE, workedDays);
            items.push({
                type: 'EARNING',
                concept: 'TRANSPORT_SUBSIDY',
                description: `Auxilio de Transporte${workedDays < 30 ? ` (${workedDays} días)` : ''}`,
                amount: auxTransporte,
            });
            totalEarnings += auxTransporte;
        }

        // 4. Deducción Salud (4% empleado — Ley 100)
        const healthDeduction = Math.round(basePensional * 0.04);
        items.push({
            type: 'DEDUCTION',
            concept: 'HEALTH',
            description: 'Aporte a Salud (4%)',
            amount: healthDeduction,
        });
        totalDeductions += healthDeduction;

        // 5. Deducción Pensión (4% empleado)
        const pensionDeduction = Math.round(basePensional * 0.04);
        items.push({
            type: 'DEDUCTION',
            concept: 'PENSION',
            description: 'Aporte a Pensión (4%)',
            amount: pensionDeduction,
        });
        totalDeductions += pensionDeduction;

        // 6. Fondo de Solidaridad Pensional (1% si gana >= 4 SMMLV)
        if (basePensional >= (SMMLV * 4)) {
            const fsp = Math.round(basePensional * 0.01);
            items.push({
                type: 'DEDUCTION',
                concept: 'FSP',
                description: 'Fondo de Solidaridad Pensional (1%)',
                amount: fsp,
            });
            totalDeductions += fsp;
        }

        // 7. Parafiscales del EMPLEADOR (no se descuentan del trabajador)
        const employerHealthContrib = Math.round(basePensional * 0.085); // 8.5%
        const employerPensionContrib = Math.round(basePensional * 0.12); // 12%
        const senaContrib = Math.round(basePensional * 0.02); // 2%
        const icbfContrib = Math.round(basePensional * 0.03); // 3%
        const cajaContrib = Math.round(basePensional * 0.04); // 4%
        const arlRateMap: Record<number, number> = { 1: 0.00522, 2: 0.01044, 3: 0.02436, 4: 0.04350, 5: 0.06960 };
        const arlRate = arlRateMap[1] || 0.00522; // Default nivel 1
        const arlContrib = Math.round(basePensional * arlRate);

        employerContributions.push(
            { type: 'DEDUCTION', concept: 'EMP_HEALTH', description: 'Aportes Salud Empleador (8.5%)', amount: employerHealthContrib },
            { type: 'DEDUCTION', concept: 'EMP_PENSION', description: 'Aportes Pensión Empleador (12%)', amount: employerPensionContrib },
            { type: 'DEDUCTION', concept: 'EMP_SENA', description: 'SENA (2%)', amount: senaContrib },
            { type: 'DEDUCTION', concept: 'EMP_ICBF', description: 'ICBF (3%)', amount: icbfContrib },
            { type: 'DEDUCTION', concept: 'EMP_CAJA', description: 'Caja de Compensación (4%)', amount: cajaContrib },
            { type: 'DEDUCTION', concept: 'EMP_ARL', description: 'ARL (Nivel 1)', amount: arlContrib },
        );

    } else if (contractType === 'PRESTACION_SERVICIOS') {
        // Retefuente (11% sobre honorarios)
        const retefuente = Math.round(totalEarnings * 0.11);
        items.push({
            type: 'DEDUCTION',
            concept: 'RETEFUENTE',
            description: 'Retención en la Fuente (11% Honorarios)',
            amount: retefuente,
        });
        totalDeductions += retefuente;
    }

    // 8. Deducciones manuales (anticipos, préstamos, multas)
    const manualDeductionsAmount = (manualItems || [])
        .filter(item => item.type === 'DEDUCTION')
        .reduce((sum, item) => {
            items.push({ ...item, type: 'DEDUCTION' });
            return sum + item.amount;
        }, 0);
    totalDeductions += manualDeductionsAmount;

    const netPay = Math.round(totalEarnings - totalDeductions);
    const employerCostFromContribs = employerContributions.reduce((s, i) => s + i.amount, 0);
    const employerCost = netPay + employerCostFromContribs; // Costo real empresa

    return {
        totalEarnings: Math.round(totalEarnings),
        totalDeductions: Math.round(totalDeductions),
        netPay,
        employerCost,
        items,
        employerContributions,
    };
}

// ─── Reporte PILA (Planilla Integrada de Liquidación de Aportes) ──────────────
export interface PILAEmployeeRow {
    documentType: string;
    documentNumber: string;
    firstName: string;
    lastName: string;
    eps: string;
    pension: string;
    arlName: string;
    compensationBox: string;
    ibc: number; // Ingreso Base de Cotización
    days: number;
    healthEmployer: number;
    healthEmployee: number;
    pensionEmployer: number;
    pensionEmployee: number;
    sena: number;
    icbf: number;
    caja: number;
    arlAmount: number;
    totalEmployer: number;
    totalEmployee: number;
    totalContribution: number;
}

export function generatePILARows(
    employees: Array<{
        documentType: string;
        documentNumber: string;
        firstName: string;
        lastName: string;
        epsName?: string | null;
        afpName?: string | null;
        arlName?: string | null;
        compensationBox?: string | null;
        baseSalary: number;
    }>,
    workedDays: number = 30
): PILAEmployeeRow[] {
    return employees.map((emp) => {
        const ibc = emp.baseSalary;
        const healthEmp = Math.round(ibc * 0.04);
        const healthEmployer = Math.round(ibc * 0.085);
        const pensionEmp = Math.round(ibc * 0.04);
        const pensionEmployer = Math.round(ibc * 0.12);
        const sena = Math.round(ibc * 0.02);
        const icbf = Math.round(ibc * 0.03);
        const caja = Math.round(ibc * 0.04);
        const arlAmount = Math.round(ibc * 0.00522); // Nivel 1

        const totalEmployer = healthEmployer + pensionEmployer + sena + icbf + caja + arlAmount;
        const totalEmployee = healthEmp + pensionEmp;

        return {
            documentType: emp.documentType,
            documentNumber: emp.documentNumber,
            firstName: emp.firstName,
            lastName: emp.lastName,
            eps: emp.epsName || 'N/A',
            pension: emp.afpName || 'N/A',
            arlName: emp.arlName || 'N/A',
            compensationBox: emp.compensationBox || 'N/A',
            ibc,
            days: workedDays,
            healthEmployer,
            healthEmployee: healthEmp,
            pensionEmployer,
            pensionEmployee: pensionEmp,
            sena,
            icbf,
            caja,
            arlAmount,
            totalEmployer,
            totalEmployee,
            totalContribution: totalEmployer + totalEmployee,
        };
    });
}

// ─── Generador de CSV PILA ────────────────────────────────────────────────────
export function generatePILACSV(rows: PILAEmployeeRow[], period: string): string {
    const headers = [
        "Tipo Doc", "Número Doc", "Nombres", "Apellidos",
        "EPS", "AFP (Pensión)", "ARL", "Caja Compensación",
        "IBC", "Días", "Salud Empleador", "Salud Empleado",
        "Pensión Empleador", "Pensión Empleado", "SENA", "ICBF", "Caja", "ARL",
        "Total Empleador", "Total Empleado", "Total Aportes"
    ];

    const csvRows = rows.map((r) => [
        r.documentType, r.documentNumber, `"${r.firstName}"`, `"${r.lastName}"`,
        `"${r.eps}"`, `"${r.pension}"`, `"${r.arlName}"`, `"${r.compensationBox}"`,
        r.ibc, r.days, r.healthEmployer, r.healthEmployee,
        r.pensionEmployer, r.pensionEmployee, r.sena, r.icbf, r.caja, r.arlAmount,
        r.totalEmployer, r.totalEmployee, r.totalContribution
    ].join(","));

    return [`PLANILLA PILA - PERÍODO: ${period}`, headers.join(","), ...csvRows].join("\n");
}

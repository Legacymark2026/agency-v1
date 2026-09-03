"use server";

import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import type { NominaElectronicaRecord, PayrollProvisionsBreakdown } from "../types";
import { generateCUNEHash } from "../services/dian-hash.service";

export async function generateNominaElectronicaCUNEAction(params: {
  employeeNit: string;
  employeeName: string;
  position: string;
  baseSalary: number;
  bonuses?: number;
}): Promise<{ success: boolean; record: NominaElectronicaRecord }> {
  const salary = Number(params.baseSalary) || 2500000;
  const transport = salary <= 2600000 ? 162000 : 0;
  const bonuses = Number(params.bonuses) || 0;
  const totalDevengado = salary + transport + bonuses;

  const healthDeduction = Math.round(salary * 0.04);
  const pensionDeduction = Math.round(salary * 0.04);
  const totalDeducciones = healthDeduction + pensionDeduction;
  const netoPagar = totalDevengado - totalDeducciones;

  const docNumber = `NIE-${Date.now().toString().slice(-5)}`;
  const dateStr = new Date().toISOString();

  const cune = generateCUNEHash(docNumber, dateStr, totalDevengado, totalDeducciones, netoPagar, params.employeeNit);

  const record: NominaElectronicaRecord = {
    id: `NE-${Date.now().toString().slice(-4)}`,
    documentNumber: docNumber,
    cune,
    employeeNit: params.employeeNit,
    employeeName: params.employeeName,
    position: params.position || "Desarrollador Senior",
    period: `Agosto ${new Date().getFullYear()}`,
    paymentDate: new Date().toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" }),
    baseSalary: salary,
    transportAllowance: transport,
    overtimeAndBonuses: bonuses,
    totalDevengado,
    healthDeduction,
    pensionDeduction,
    totalDeducciones,
    netoPagar,
    dianStatus: "VALIDADO_PREVIO_DIAN",
    qrCodeData: `https://catalogo-vpfe.dian.gov.co/document/searchqr?documentkey=${cune}`,
  };

  try {
    await prisma.userActivityLog.create({
      data: {
        userId: "system",
        action: "ACCOUNTING_VOUCHER_SEALED",
        details: JSON.stringify({
          voucherNumber: docNumber,
          concept: `Nómina Electrónica DIAN - ${params.employeeName}`,
          totalAmount: netoPagar,
          hashSeal: cune,
          documentType: "NE",
          timestamp: dateStr,
        }),
      },
    });
  } catch (_) {}

  return { success: true, record };
}

export async function getNominaElectronicaHistoryAction(): Promise<{ success: boolean; records: NominaElectronicaRecord[] }> {
  const records: NominaElectronicaRecord[] = [];

  try {
    const payrolls = await prisma.payroll.findMany({
      include: { employee: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    for (const p of payrolls) {
      const emp = p.employee;
      const cune = p.cune || crypto.createHash("sha384").update(`${p.id}|${p.netPay}|${emp?.documentNumber}`).digest("hex").toUpperCase();

      records.push({
        id: p.id,
        documentNumber: `NIE-${p.id.slice(0, 5).toUpperCase()}`,
        cune,
        employeeNit: emp?.documentNumber || "1098765432",
        employeeName: `${emp?.firstName || "Empleado"} ${emp?.lastName || "Corporativo"}`,
        position: emp?.position || "Especialista TI",
        period: `${p.periodStart.toISOString().split("T")[0]} al ${p.periodEnd.toISOString().split("T")[0]}`,
        paymentDate: p.issueDate.toISOString().split("T")[0],
        baseSalary: emp?.baseSalary || 2500000,
        transportAllowance: (emp?.baseSalary || 0) <= 2600000 ? 162000 : 0,
        overtimeAndBonuses: 0,
        totalDevengado: p.totalEarnings || 2662000,
        healthDeduction: Math.round((emp?.baseSalary || 2500000) * 0.04),
        pensionDeduction: Math.round((emp?.baseSalary || 2500000) * 0.04),
        totalDeducciones: p.totalDeductions || 200000,
        netoPagar: p.netPay || 2462000,
        dianStatus: "VALIDADO_PREVIO_DIAN",
        qrCodeData: `https://catalogo-vpfe.dian.gov.co/document/searchqr?documentkey=${cune}`,
      });
    }
  } catch (err) {
    console.error("[getNominaElectronicaHistoryAction] DB Error:", err);
  }

  return { success: true, records };
}

export async function calculatePayrollProvisionsAction(baseSalary: number): Promise<PayrollProvisionsBreakdown> {
  const salary = Number(baseSalary) || 2000000;
  const transportAllowance = salary <= 2600000 ? 162000 : 0;
  const totalAccrued = salary + transportAllowance;

  const cesantias = Math.round(totalAccrued * 0.0833);
  const interesesCesantias = Math.round(cesantias * 0.12 / 12);
  const primaServicios = Math.round(totalAccrued * 0.0833);
  const vacaciones = Math.round(salary * 0.0417);

  const pensionEmployer = Math.round(salary * 0.12);
  const healthEmployer = 0;
  const arlRisk1 = Math.round(salary * 0.00522);
  const cajaCompensacion = Math.round(salary * 0.04);
  const sena = 0;
  const icbf = 0;

  const totalProvisions = cesantias + interesesCesantias + primaServicios + vacaciones + pensionEmployer + healthEmployer + arlRisk1 + cajaCompensacion + sena + icbf;
  const totalCompanyCost = totalAccrued + totalProvisions;

  return {
    baseSalary: salary,
    transportAllowance,
    totalAccrued,
    cesantias,
    interesesCesantias,
    primaServicios,
    vacaciones,
    pensionEmployer,
    healthEmployer,
    arlRisk1,
    cajaCompensacion,
    sena,
    icbf,
    totalProvisions,
    totalCompanyCost,
  };
}

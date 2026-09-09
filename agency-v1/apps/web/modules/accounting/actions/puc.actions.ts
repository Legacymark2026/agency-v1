"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { PUCTreeAccount } from "../types";
import { classifyPUCAccount } from "../services/accounting-engine.service";

const STANDARD_PUC_SEED = [
  // 1. ACTIVO
  { code: "1", name: "Activo", category: "ACTIVO", nature: "DEBITO", level: 1, parentCode: null },
  { code: "11", name: "Disponible", category: "ACTIVO", nature: "DEBITO", level: 2, parentCode: "1" },
  { code: "1105", name: "Caja", category: "ACTIVO", nature: "DEBITO", level: 3, parentCode: "11" },
  { code: "110505", name: "Caja General", category: "ACTIVO", nature: "DEBITO", level: 4, parentCode: "1105" },
  { code: "110510", name: "Cajas Menores", category: "ACTIVO", nature: "DEBITO", level: 4, parentCode: "1105" },
  { code: "1110", name: "Bancos", category: "ACTIVO", nature: "DEBITO", level: 3, parentCode: "11" },
  { code: "111005", name: "Moneda Nacional (Cuentas Corrientes y Ahorros)", category: "ACTIVO", nature: "DEBITO", level: 4, parentCode: "1110" },
  { code: "111010", name: "Moneda Extranjera (Cuentas USD / EUR)", category: "ACTIVO", nature: "DEBITO", level: 4, parentCode: "1110" },
  { code: "13", name: "Deudores", category: "ACTIVO", nature: "DEBITO", level: 2, parentCode: "1" },
  { code: "1305", name: "Clientes", category: "ACTIVO", nature: "DEBITO", level: 3, parentCode: "13" },
  { code: "130505", name: "Clientes Nacionales", category: "ACTIVO", nature: "DEBITO", level: 4, parentCode: "1305" },
  { code: "1355", name: "Anticipo de Impuestos y Contribuciones", category: "ACTIVO", nature: "DEBITO", level: 3, parentCode: "13" },
  { code: "135515", name: "Anticipo Retención en la Fuente", category: "ACTIVO", nature: "DEBITO", level: 4, parentCode: "1355" },
  { code: "135517", name: "Anticipo Impuesto a las Ventas Retenido (ReteIVA)", category: "ACTIVO", nature: "DEBITO", level: 4, parentCode: "1355" },
  { code: "135518", name: "Anticipo Impuesto de Industria y Comercio (ReteICA)", category: "ACTIVO", nature: "DEBITO", level: 4, parentCode: "1355" },
  { code: "14", name: "Inventarios", category: "ACTIVO", nature: "DEBITO", level: 2, parentCode: "1" },
  { code: "143501", name: "Mercancías No Fabricadas por la Empresa & Licencias", category: "ACTIVO", nature: "DEBITO", level: 4, parentCode: "14" },
  { code: "15", name: "Propiedades, Planta y Equipo", category: "ACTIVO", nature: "DEBITO", level: 2, parentCode: "1" },
  { code: "152805", name: "Equipos de Computación y Comunicación", category: "ACTIVO", nature: "DEBITO", level: 4, parentCode: "15" },
  { code: "1592", name: "Depreciación Acumulada", category: "ACTIVO", nature: "CREDITO", level: 3, parentCode: "15" },

  // 2. PASIVO
  { code: "2", name: "Pasivo", category: "PASIVO", nature: "CREDITO", level: 1, parentCode: null },
  { code: "22", name: "Proveedores", category: "PASIVO", nature: "CREDITO", level: 2, parentCode: "2" },
  { code: "220505", name: "Proveedores Nacionales", category: "PASIVO", nature: "CREDITO", level: 4, parentCode: "22" },
  { code: "23", name: "Cuentas por Pagar", category: "PASIVO", nature: "CREDITO", level: 2, parentCode: "2" },
  { code: "233525", name: "Honorarios y Servicios Profesionales", category: "PASIVO", nature: "CREDITO", level: 4, parentCode: "23" },
  { code: "2365", name: "Retención en la Fuente por Pagar", category: "PASIVO", nature: "CREDITO", level: 3, parentCode: "23" },
  { code: "236515", name: "Retención por Honorarios y Compras", category: "PASIVO", nature: "CREDITO", level: 4, parentCode: "2365" },
  { code: "236701", name: "Impuesto a las Ventas Retenido (ReteIVA)", category: "PASIVO", nature: "CREDITO", level: 4, parentCode: "23" },
  { code: "236801", name: "Impuesto de Industria y Comercio Retenido (ReteICA)", category: "PASIVO", nature: "CREDITO", level: 4, parentCode: "23" },
  { code: "24", name: "Impuestos, Gravámenes y Tasas", category: "PASIVO", nature: "CREDITO", level: 2, parentCode: "2" },
  { code: "240801", name: "Impuesto sobre las Ventas por Pagar (IVA 19%)", category: "PASIVO", nature: "CREDITO", level: 4, parentCode: "24" },
  { code: "25", name: "Obligaciones Laborales", category: "PASIVO", nature: "CREDITO", level: 2, parentCode: "2" },
  { code: "250505", name: "Salarios por Pagar a Trabajadores", category: "PASIVO", nature: "CREDITO", level: 4, parentCode: "25" },

  // 3. PATRIMONIO
  { code: "3", name: "Patrimonio", category: "PATRIMONIO", nature: "CREDITO", level: 1, parentCode: null },
  { code: "31", name: "Capital Social", category: "PATRIMONIO", nature: "CREDITO", level: 2, parentCode: "3" },
  { code: "310505", name: "Capital Suscrito y Pagado", category: "PATRIMONIO", nature: "CREDITO", level: 4, parentCode: "31" },
  { code: "36", name: "Resultados del Ejercicio", category: "PATRIMONIO", nature: "CREDITO", level: 2, parentCode: "3" },
  { code: "360505", name: "Utilidad del Ejercicio", category: "PATRIMONIO", nature: "CREDITO", level: 4, parentCode: "36" },

  // 4. INGRESOS
  { code: "4", name: "Ingresos", category: "INGRESOS", nature: "CREDITO", level: 1, parentCode: null },
  { code: "41", name: "Operacionales", category: "INGRESOS", nature: "CREDITO", level: 2, parentCode: "4" },
  { code: "413501", name: "Comercio de Software y Servicios Digitales", category: "INGRESOS", nature: "CREDITO", level: 4, parentCode: "41" },
  { code: "42", name: "No Operacionales", category: "INGRESOS", nature: "CREDITO", level: 2, parentCode: "4" },
  { code: "421005", name: "Ingresos Financieros por Diferencia en Cambio", category: "INGRESOS", nature: "CREDITO", level: 4, parentCode: "42" },

  // 5. GASTOS
  { code: "5", name: "Gastos", category: "GASTOS", nature: "DEBITO", level: 1, parentCode: null },
  { code: "51", name: "Operacionales de Administración", category: "GASTOS", nature: "DEBITO", level: 2, parentCode: "5" },
  { code: "510506", name: "Sueldos y Prestaciones del Personal", category: "GASTOS", nature: "DEBITO", level: 4, parentCode: "51" },
  { code: "511010", name: "Honorarios Profesionales y Asesoría TI", category: "GASTOS", nature: "DEBITO", level: 4, parentCode: "51" },
  { code: "513505", name: "Servicios Cloud, Hosting e Infraestructura", category: "GASTOS", nature: "DEBITO", level: 4, parentCode: "51" },
  { code: "53", name: "No Operacionales", category: "GASTOS", nature: "DEBITO", level: 2, parentCode: "5" },
  { code: "530525", name: "Gastos Financieros por Diferencia en Cambio", category: "GASTOS", nature: "DEBITO", level: 4, parentCode: "53" },

  // 6. COSTOS
  { code: "6", name: "Costos de Ventas", category: "COSTOS", nature: "DEBITO", level: 1, parentCode: null },
  { code: "613501", name: "Costo de Ventas - Prestación de Servicios Digitales", category: "COSTOS", nature: "DEBITO", level: 4, parentCode: "6" },
];

export async function getChartOfAccountsAction(query?: string): Promise<{
  success: boolean;
  accounts: PUCTreeAccount[];
  tree: PUCTreeAccount[];
  totalAccounts: number;
}> {
  try {
    const company = await prisma.company.findFirst({ select: { id: true } });
    if (!company) {
      return { success: false, accounts: [], tree: [], totalAccounts: 0 };
    }

    const existingCount = await (prisma as any).chartOfAccounts.count({
      where: { companyId: company.id },
    }).catch(() => 0);

    if (existingCount === 0) {
      for (const item of STANDARD_PUC_SEED) {
        await (prisma as any).chartOfAccounts.create({
          data: {
            companyId: company.id,
            code: item.code,
            name: item.name,
            category: item.category,
            nature: item.nature,
            level: item.level,
            parentCode: item.parentCode,
            isActive: true,
          },
        }).catch(() => {});
      }
    }

    const whereClause: any = { companyId: company.id };
    if (query?.trim()) {
      whereClause.OR = [
        { code: { contains: query.trim() } },
        { name: { contains: query.trim(), mode: "insensitive" } },
      ];
    }

    const dbAccounts = await (prisma as any).chartOfAccounts.findMany({
      where: whereClause,
      orderBy: { code: "asc" },
    });

    const accounts: PUCTreeAccount[] = dbAccounts.map((a: any) => ({
      id: a.id,
      code: a.code,
      name: a.name,
      category: a.category,
      nature: a.nature,
      parentCode: a.parentCode,
      level: a.level,
      isActive: a.isActive,
      description: a.description,
    }));

    const accountMap = new Map<string, PUCTreeAccount>();
    accounts.forEach((acc) => {
      accountMap.set(acc.code, { ...acc, children: [] });
    });

    const tree: PUCTreeAccount[] = [];
    accountMap.forEach((acc) => {
      if (!acc.parentCode || !accountMap.has(acc.parentCode)) {
        tree.push(acc);
      } else {
        const parent = accountMap.get(acc.parentCode);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(acc);
        }
      }
    });

    return {
      success: true,
      accounts,
      tree,
      totalAccounts: accounts.length,
    };
  } catch (error: any) {
    console.error("[getChartOfAccountsAction] Error:", error);
    return { success: false, accounts: [], tree: [], totalAccounts: 0 };
  }
}

export async function createPUCAccountAction(params: {
  code: string;
  name: string;
  category?: string;
  nature?: "DEBITO" | "CREDITO";
  parentCode?: string;
  description?: string;
}): Promise<{ success: boolean; account?: PUCTreeAccount; error?: string }> {
  try {
    const company = await prisma.company.findFirst({ select: { id: true } });
    if (!company) {
      return { success: false, error: "No se encontró empresa registrada" };
    }

    const cleanCode = params.code.trim().replace(/\D/g, "");
    if (!cleanCode || cleanCode.length < 2) {
      return { success: false, error: "El código de cuenta debe contener al menos 2 dígitos numéricos." };
    }

    const classified = classifyPUCAccount(cleanCode);
    const category = params.category || classified.category;
    const nature = params.nature || classified.nature;

    let level = 1;
    if (cleanCode.length === 2) level = 2;
    else if (cleanCode.length <= 4) level = 3;
    else if (cleanCode.length <= 6) level = 4;
    else level = 5;

    let parentCode = params.parentCode;
    if (!parentCode && cleanCode.length > 2) {
      parentCode = cleanCode.length === 6 ? cleanCode.slice(0, 4) : cleanCode.slice(0, 2);
    }

    const created = await (prisma as any).chartOfAccounts.create({
      data: {
        companyId: company.id,
        code: cleanCode,
        name: params.name.trim(),
        category,
        nature,
        level,
        parentCode: parentCode || null,
        description: params.description?.trim() || null,
        isActive: true,
      },
    });

    return {
      success: true,
      account: {
        id: created.id,
        code: created.code,
        name: created.name,
        category: created.category,
        nature: created.nature,
        parentCode: created.parentCode,
        level: created.level,
        isActive: created.isActive,
        description: created.description,
      },
    };
  } catch (error: any) {
    if (error.code === "P2002") {
      return { success: false, error: "Ya existe una cuenta con este código en el PUC de la empresa." };
    }
    return { success: false, error: error.message || "Error al crear cuenta en el PUC" };
  }
}

export async function togglePUCAccountAction(id: string, isActive: boolean): Promise<{ success: boolean; error?: string }> {
  try {
    await (prisma as any).chartOfAccounts.update({
      where: { id },
      data: { isActive },
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Error al actualizar estado de la cuenta" };
  }
}

"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { FiscalPeriodRecord } from "../types";

export async function getFiscalPeriodsAction(): Promise<{
  success: boolean;
  periods: FiscalPeriodRecord[];
}> {
  try {
    const company = await prisma.company.findFirst({ select: { id: true } });
    if (!company) return { success: false, periods: [] };

    // Auto-seed current and past periods if none exist
    const count = await (prisma as any).accountingPeriod.count({
      where: { companyId: company.id },
    }).catch(() => 0);

    const currentYear = new Date().getFullYear();

    if (count === 0) {
      const samplePeriods = [
        { name: `Enero ${currentYear}`, startDate: new Date(`${currentYear}-01-01`), endDate: new Date(`${currentYear}-01-31`), status: "CLOSED", closedAt: new Date(`${currentYear}-02-05`) },
        { name: `Febrero ${currentYear}`, startDate: new Date(`${currentYear}-02-01`), endDate: new Date(`${currentYear}-02-28`), status: "CLOSED", closedAt: new Date(`${currentYear}-03-05`) },
        { name: `Marzo ${currentYear}`, startDate: new Date(`${currentYear}-03-01`), endDate: new Date(`${currentYear}-03-31`), status: "CLOSED", closedAt: new Date(`${currentYear}-04-05`) },
        { name: `Abril ${currentYear}`, startDate: new Date(`${currentYear}-04-01`), endDate: new Date(`${currentYear}-04-30`), status: "CLOSED", closedAt: new Date(`${currentYear}-05-05`) },
        { name: `Mayo ${currentYear}`, startDate: new Date(`${currentYear}-05-01`), endDate: new Date(`${currentYear}-05-31`), status: "CLOSED", closedAt: new Date(`${currentYear}-06-05`) },
        { name: `Junio ${currentYear}`, startDate: new Date(`${currentYear}-06-01`), endDate: new Date(`${currentYear}-06-30`), status: "CLOSED", closedAt: new Date(`${currentYear}-07-05`) },
        { name: `Julio ${currentYear}`, startDate: new Date(`${currentYear}-07-01`), endDate: new Date(`${currentYear}-07-31`), status: "CLOSED", closedAt: new Date(`${currentYear}-08-05`) },
        { name: `Agosto ${currentYear}`, startDate: new Date(`${currentYear}-08-01`), endDate: new Date(`${currentYear}-08-31`), status: "CLOSED", closedAt: new Date(`${currentYear}-09-05`) },
        { name: `Septiembre ${currentYear}`, startDate: new Date(`${currentYear}-09-01`), endDate: new Date(`${currentYear}-09-30`), status: "OPEN" },
      ];

      for (const p of samplePeriods) {
        await (prisma as any).accountingPeriod.create({
          data: {
            companyId: company.id,
            name: p.name,
            startDate: p.startDate,
            endDate: p.endDate,
            status: p.status,
            closedAt: p.closedAt || null,
          },
        }).catch(() => {});
      }
    }

    const dbPeriods = await (prisma as any).accountingPeriod.findMany({
      where: { companyId: company.id },
      orderBy: { startDate: "desc" },
      include: {
        _count: { select: { vouchers: true } },
      },
    });

    const periods: FiscalPeriodRecord[] = dbPeriods.map((p: any) => ({
      id: p.id,
      name: p.name,
      startDate: p.startDate.toISOString().split("T")[0],
      endDate: p.endDate.toISOString().split("T")[0],
      status: p.status,
      closedAt: p.closedAt ? p.closedAt.toISOString() : null,
      vouchersCount: p._count?.vouchers || 0,
    }));

    return { success: true, periods };
  } catch (error: any) {
    console.error("[getFiscalPeriodsAction] Error:", error);
    return { success: false, periods: [] };
  }
}

export async function createFiscalPeriodAction(params: {
  name: string;
  startDate: string;
  endDate: string;
}): Promise<{ success: boolean; period?: FiscalPeriodRecord; error?: string }> {
  try {
    const company = await prisma.company.findFirst({ select: { id: true } });
    if (!company) return { success: false, error: "No se encontró empresa registrada" };

    const start = new Date(params.startDate);
    const end = new Date(params.endDate);

    if (start >= end) {
      return { success: false, error: "La fecha inicial debe ser anterior a la fecha final." };
    }

    const created = await (prisma as any).accountingPeriod.create({
      data: {
        companyId: company.id,
        name: params.name.trim(),
        startDate: start,
        endDate: end,
        status: "OPEN",
      },
    });

    return {
      success: true,
      period: {
        id: created.id,
        name: created.name,
        startDate: created.startDate.toISOString().split("T")[0],
        endDate: created.endDate.toISOString().split("T")[0],
        status: created.status,
      },
    };
  } catch (error: any) {
    if (error.code === "P2002") {
      return { success: false, error: "Ya existe un periodo contable configurado con este rango de fechas." };
    }
    return { success: false, error: error.message || "Error al crear periodo contable" };
  }
}

export async function closeFiscalPeriodAction(periodId: string): Promise<{ success: boolean; error?: string }> {
  try {
    let userId = "admin";
    try {
      const session = await auth();
      if (session?.user?.id) userId = session.user.id;
    } catch (_) {}

    await (prisma as any).accountingPeriod.update({
      where: { id: periodId },
      data: {
        status: "CLOSED",
        closedAt: new Date(),
        closedById: userId,
      },
    });

    await prisma.userActivityLog.create({
      data: {
        userId,
        action: "ACCOUNTING_PERIOD_LOCKED",
        details: JSON.stringify({ periodId, timestamp: new Date().toISOString() }),
      },
    }).catch(() => {});

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Error al cerrar periodo contable" };
  }
}

export async function reopenFiscalPeriodAction(periodId: string, reason: string): Promise<{ success: boolean; error?: string }> {
  try {
    let userId = "admin";
    try {
      const session = await auth();
      if (session?.user?.id) userId = session.user.id;
    } catch (_) {}

    await (prisma as any).accountingPeriod.update({
      where: { id: periodId },
      data: {
        status: "OPEN",
        closedAt: null,
        closedById: null,
      },
    });

    await prisma.userActivityLog.create({
      data: {
        userId,
        action: "ACCOUNTING_PERIOD_UNLOCKED_AUDIT",
        details: JSON.stringify({ periodId, reason, reopenedBy: userId, timestamp: new Date().toISOString() }),
      },
    }).catch(() => {});

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Error al reabrir periodo contable" };
  }
}

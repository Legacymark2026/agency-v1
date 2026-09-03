"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { dispatchMicroserviceRequest } from "@/lib/microservices-client";

async function resolveCompanyId(session: any): Promise<string | null> {
  if (session?.user?.companyId) return session.user.companyId;
  if (!session?.user?.id) return null;

  try {
    const membership = await prisma.companyUser.findFirst({
      where: { userId: session.user.id },
      select: { companyId: true },
    });
    if (membership?.companyId) return membership.companyId;

    const company = await prisma.company.findFirst({ select: { id: true } });
    if (company?.id) return company.id;
  } catch {}

  return null;
}

/**
 * Returns employees for the current tenant using resilient microservice dispatch
 * with direct Prisma database fallback.
 */
export async function getEmployees(includeInactive = false) {
  try {
    const session = await auth();
    if (!session?.user) return { success: false, data: [] };

    const companyId = await resolveCompanyId(session);
    if (!companyId) return { success: false, data: [] };

    const res = await dispatchMicroserviceRequest({
      service: "hr-service",
      path: `/api/employees?companyId=${companyId}${includeInactive ? "" : "&isActive=true"}&limit=1000`,
      companyId,
      fallback: async () => {
        // Direct Prisma DB Fallback
        const employees = await prisma.employee.findMany({
          where: {
            companyId,
            ...(includeInactive ? {} : { isActive: true }),
          },
          orderBy: { createdAt: "desc" },
        });
        return { employees };
      },
    });

    const employees = res.data?.employees || res.data || [];
    return { success: true, data: employees, isFallback: res.isFallback };
  } catch (error: any) {
    console.error("[getEmployees] Error:", error);
    return { success: false, data: [], error: error.message };
  }
}

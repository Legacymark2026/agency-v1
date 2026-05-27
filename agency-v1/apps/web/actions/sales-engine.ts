"use server";

import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

const GATEWAY_URL = process.env.API_GATEWAY_URL || "http://localhost:8080";

async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user;
}

export async function calculateCommissions(dealId: string) {
  try {
    const user = await requireAuth();
    const cuRes = await fetch(`${GATEWAY_URL}/api/crm/users/${user.id}/company`);
    const cuData = await cuRes.json();
    if (!cuRes.ok || !cuData.data) throw new Error("No company linked");
    const companyId = cuData.data.companyId;

    const res = await fetch(`${GATEWAY_URL}/api/crm/sales/commissions/calculate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ companyId, dealId })
    });
    const resData = await res.json();
    if (!res.ok) throw new Error(resData.error || "Failed to calculate commissions");

    revalidatePath("/dashboard/admin/sales/goals");
    return { success: true, commission: resData.commission };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function processClawback(dealId: string, reason: string) {
  try {
    const user = await requireAuth();
    const cuRes = await fetch(`${GATEWAY_URL}/api/crm/users/${user.id}/company`);
    const cuData = await cuRes.json();
    if (!cuRes.ok || !cuData.data) throw new Error("No company linked");
    const companyId = cuData.data.companyId;

    const res = await fetch(`${GATEWAY_URL}/api/crm/sales/commissions/clawback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ companyId, dealId, reason })
    });
    const resData = await res.json();
    if (!res.ok) throw new Error(resData.error || "Failed to process clawback");

    revalidatePath("/dashboard/admin/sales/goals");
    return { success: true, clawback: resData.clawback };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

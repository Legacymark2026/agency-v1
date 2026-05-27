"use server";

import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

const GATEWAY_URL = process.env.API_GATEWAY_URL || "http://localhost:8080";

async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user;
}

export async function createSalesGoal(data: {
  level: "AGENCY" | "DEPARTMENT" | "TEAM" | "INDIVIDUAL";
  period: string; // YYYY-MM
  targetAmount: number;
  departmentId?: string;
  userId?: string;
}) {
  try {
    const user = await requireAuth();
    const cuRes = await fetch(`${GATEWAY_URL}/api/crm/users/${user.id}/company`);
    const cuData = await cuRes.json();
    if (!cuRes.ok || !cuData.data) throw new Error("No company linked");
    const companyId = cuData.data.companyId;

    const res = await fetch(`${GATEWAY_URL}/api/crm/goals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        companyId,
        level: data.level,
        period: data.period,
        targetAmount: data.targetAmount,
        departmentId: data.departmentId,
        userId: data.userId
      })
    });
    const resData = await res.json();
    if (!res.ok) throw new Error(resData.error || "Failed to create sales goal");

    revalidatePath("/dashboard/admin/sales/goals");
    return { success: true, goal: resData.data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getHierarchicalGoals(period: string) {
  try {
    const user = await requireAuth();
    const cuRes = await fetch(`${GATEWAY_URL}/api/crm/users/${user.id}/company`);
    const cuData = await cuRes.json();
    if (!cuRes.ok || !cuData.data) throw new Error("No company linked");
    const companyId = cuData.data.companyId;

    const res = await fetch(`${GATEWAY_URL}/api/crm/goals/hierarchical?companyId=${companyId}&period=${period}`);
    const resData = await res.json();
    if (!res.ok) throw new Error(resData.error || "Failed to fetch hierarchical goals");

    return {
      success: true,
      goals: (resData.data.goals || []).map((g: any) => ({
        ...g,
        createdAt: new Date(g.createdAt),
        updatedAt: new Date(g.updatedAt),
      })),
      wonDeals: resData.data.wonDeals || []
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

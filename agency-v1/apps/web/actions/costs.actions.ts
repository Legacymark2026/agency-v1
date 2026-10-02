"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

import { requireTenant } from "@/lib/tenant";,
        include: { companyUsers: true }
    });
    
    if (!user || user.companyUsers.length === 0) throw new Error("User has no company");
    return { companyId: user.companyUsers[0].companyId, userId: user.id };
}

export async function createCostCenterAction(data: { name: string, code: string, description?: string }) {
    const { companyId } = await requireTenant(false);
    
    await prisma.costCenter.create({
        data: {
            companyId,
            name: data.name,
            code: data.code,
            description: data.description,
        }
    });
    
    revalidatePath("/dashboard/accounting/costs");
}

export async function createExpenseAction(data: {
    title: string,
    amount: number,
    date: string,
    costType: string,
    costCenterId: string,
    isDeductible: boolean,
}) {
    const { companyId, userId } = await requireTenant(false);
    
    await prisma.expense.create({
        data: {
            companyId,
            createdById: userId,
            title: data.title,
            amount: data.amount,
            date: new Date(data.date),
            costType: data.costType,
            costCenterId: data.costCenterId,
            isDeductible: data.isDeductible,
            status: "APPROVED" // auto-approve for now
        }
    });
    
    revalidatePath("/dashboard/accounting/costs");
}

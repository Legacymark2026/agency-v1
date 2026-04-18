"use server";
/**
 * actions/company.ts
 * ─────────────────────────────────────────────────────────────
 * Server Actions relacionadas con la empresa activa del usuario.
 */

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getActiveCompany() {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "No autorizado" };
  }

  const companyId = session.user.companyId as string;
  if (!companyId) {
    return { error: "No tienes una empresa asignada" };
  }

  try {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { id: true, name: true, slug: true },
    });

    if (!company) {
      return { error: "Empresa no encontrada" };
    }

    return { company };
  } catch (error) {
    console.error("[Company] Error getting active company:", error);
    return { error: "Error al obtener empresa" };
  }
}

export async function getActiveCompanyId(): Promise<string | null> {
  const session = await auth();
  return (session?.user?.companyId as string) || null;
}
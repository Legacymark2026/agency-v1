"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/audit";

export interface UpdateProfileInput {
  firstName?: string;
  lastName?: string;
  phone?: string;
  jobTitle?: string;
}

export async function updateUserProfile(input: UpdateProfileInput) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Usuario no autenticado." };
  }

  const userId = session.user.id;

  try {
    // 1. Update User model in PostgreSQL
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(input.firstName && { firstName: input.firstName }),
        ...(input.lastName && { lastName: input.lastName }),
        ...(input.phone && { phone: input.phone }),
        ...(input.jobTitle && { jobTitle: input.jobTitle }),
      },
    });

    // 2. Upsert UserProfile model in PostgreSQL
    await prisma.userProfile.upsert({
      where: { userId },
      update: {
        ...(input.jobTitle && { jobTitle: input.jobTitle }),
      },
      create: {
        userId,
        jobTitle: input.jobTitle || "Ejecutivo",
      },
    });

    // 3. Log real audit activity to PostgreSQL
    await audit({
      action: "user.update",
      outcome: "success",
      details: {
        userId,
        updatedFields: Object.keys(input),
      },
    });

    return {
      success: true,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        jobTitle: updatedUser.jobTitle,
      },
    };
  } catch (error: any) {
    console.error("[UserSettingsAction] Error updating profile in PostgreSQL:", error);
    return { success: false, error: error.message || "Error al actualizar perfil en base de datos." };
  }
}

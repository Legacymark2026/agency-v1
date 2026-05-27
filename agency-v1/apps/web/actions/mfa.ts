"use server";

/**
 * actions/mfa.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Server Actions para gestión de MFA (Multi-Factor Authentication).
 * 
 * EXPORTS:
 *   - setupMFA: Generar secret y QR para setup inicial
 *   - enableMFA: Habilitar MFA tras verificación
 *   - disableMFA: Deshabilitar MFA
 *   - verifyMFA: Verificar código TOTP en login
 *   - regenerateBackupCodes: Regenerar códigos de backup
 */

import { auth } from "@/lib/auth";
import { 
  generateSecret, 
  generateQRCode, 
  generateBackupCodes,
  verifyToken, 
  verifyBackupCode,
  isMFAEnabled 
} from "@/lib/mfa";
import { fail, ok, ActionResult } from "@/types/actions";
import { revalidatePath } from "next/cache";

const GATEWAY_URL = process.env.API_GATEWAY_URL || 'http://localhost:8080';

async function fetchGateway(path: string, options?: RequestInit) {
  const response = await fetch(`${GATEWAY_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.error || `HTTP error! status: ${response.status}`);
  }
  return response.json();
}

export async function setupMFA(): Promise<ActionResult<{ secret: string; qrCode: string }>> {
  const session = await auth();
  if (!session?.user?.id) {
    return fail("No autenticado", 401);
  }

  try {
    const user = await fetchGateway(`/api/auth/users/${session.user.id}/mfa`);

    if (!user) return fail("Usuario no encontrado", 404);
    if (user.mfaEnabled) return fail("MFA ya está habilitado");

    const { secret, otpauthUrl } = generateSecret(user.email!);
    const qrCode = await generateQRCode(otpauthUrl);

    await fetchGateway(`/api/auth/users/${session.user.id}/mfa`, {
      method: 'PATCH',
      body: JSON.stringify({ mfaSecret: secret }),
    });

    revalidatePath("/dashboard/settings");
    return ok({ secret, qrCode });
  } catch (error) {
    console.error("[MFA Setup] Error:", error);
    return fail("Error configurando MFA");
  }
}

export async function enableMFA(
  code: string
): Promise<ActionResult<{ backupCodes: string[] }>> {
  const session = await auth();
  if (!session?.user?.id) {
    return fail("No autenticado", 401);
  }

  try {
    const user = await fetchGateway(`/api/auth/users/${session.user.id}/mfa`);

    if (!user) return fail("Usuario no encontrado", 404);
    if (user.mfaEnabled) return fail("MFA ya está habilitado");
    if (!user.mfaSecret) return fail("Primero genera el código QR");

    const isValid = verifyToken(code, user.mfaSecret);
    if (!isValid) return fail("Código inválido. Intenta de nuevo.");

    const backupCodes = generateBackupCodes(10);
    const hashedCodes = backupCodes.map(c => c.replace(/-/g, ""));

    await fetchGateway(`/api/auth/users/${session.user.id}/mfa`, {
      method: 'PATCH',
      body: JSON.stringify({
        mfaEnabled: true,
        backupCodes: hashedCodes,
      }),
    });

    revalidatePath("/dashboard/settings");
    return ok({ backupCodes });
  } catch (error) {
    console.error("[MFA Enable] Error:", error);
    return fail("Error habilitando MFA");
  }
}

export async function disableMFA(
  code: string
): Promise<ActionResult<{ success: boolean }>> {
  const session = await auth();
  if (!session?.user?.id) {
    return fail("No autenticado", 401);
  }

  try {
    const user = await fetchGateway(`/api/auth/users/${session.user.id}/mfa`);

    if (!user || !user.mfaEnabled) return fail("MFA no está habilitado");

    let isValid = verifyToken(code, user.mfaSecret || "");
    
    if (!isValid) {
      const storedCodes = user.backupCodes as string[] | null;
      if (storedCodes && storedCodes.length > 0) {
        const codesArray = [...storedCodes];
        const backupResult = verifyBackupCode(code, codesArray);
        isValid = backupResult.valid;
      }
    }

    if (!isValid) return fail("Código inválido");

    await fetchGateway(`/api/auth/users/${session.user.id}/mfa`, {
      method: 'PATCH',
      body: JSON.stringify({
        mfaEnabled: false,
        mfaSecret: null,
        backupCodes: [],
      }),
    });

    revalidatePath("/dashboard/settings");
    return ok({ success: true });
  } catch (error) {
    console.error("[MFA Disable] Error:", error);
    return fail("Error deshabilitando MFA");
  }
}

export async function regenerateBackupCodes(): Promise<ActionResult<{ backupCodes: string[] }>> {
  const session = await auth();
  if (!session?.user?.id) return fail("No autenticado", 401);

  try {
    const user = await fetchGateway(`/api/auth/users/${session.user.id}/mfa`);

    if (!user?.mfaEnabled) return fail("MFA no está habilitado");

    const backupCodes = generateBackupCodes(10);
    const hashedCodes = backupCodes.map(c => c.replace(/-/g, ""));

    await fetchGateway(`/api/auth/users/${session.user.id}/mfa`, {
      method: 'PATCH',
      body: JSON.stringify({ backupCodes: hashedCodes }),
    });

    return ok({ backupCodes });
  } catch (error) {
    console.error("[MFA Regenerate] Error:", error);
    return fail("Error regenerando códigos");
  }
}

export async function verifyMFAForSession(
  userId: string,
  code: string
): Promise<{ valid: boolean; reason?: string }> {
  try {
    const user = await fetchGateway(`/api/auth/users/${userId}/mfa`);

    if (!user?.mfaEnabled || !user.mfaSecret) {
      return { valid: true };
    }

    let isValid = verifyToken(code, user.mfaSecret);
    
    if (!isValid) {
      const storedCodes = user.backupCodes as string[] | null;
      if (storedCodes && storedCodes.length > 0) {
        const backupResult = verifyBackupCode(code, [...storedCodes]);
        isValid = backupResult.valid;
      }
    }

    if (!isValid) {
      return { valid: false, reason: "Código MFA inválido" };
    }

    return { valid: true };
  } catch (error) {
    console.error("[MFA Verify] Error:", error);
    return { valid: false, reason: "Error verificando MFA" };
  }
}

export async function getMFAStatus(): Promise<ActionResult<{ 
  enabled: boolean;
  methods: string[];
}>> {
  const session = await auth();
  if (!session?.user?.id) {
    return fail("No autenticado", 401);
  }

  try {
    const user = await fetchGateway(`/api/auth/users/${session.user.id}/mfa`);

    const methods: string[] = [];
    if (user?.mfaEnabled) {
      methods.push("totp");
      const bc = user.backupCodes as string[] | null;
      if (bc && bc.length > 0) methods.push("backup");
    }

    return ok({ enabled: user?.mfaEnabled || false, methods });
  } catch (error) {
    return fail("Error obteniendo estado MFA");
  }
}
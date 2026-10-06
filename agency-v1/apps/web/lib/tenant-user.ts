import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";

/**
 * Genera un identificador único de usuario por empresa (Tenant User ID).
 * Formato: USR-[SLUG_PREFIX]-[NUMERO_SECUENCIAL_O_HASH_CORTO]
 * Ejemplo: USR-AGY-00042 o USR-CORP-A8F2
 * 
 * Garantiza unicidad mediante loop con comprobación y fallback criptográfico.
 */
export async function generateTenantUserId(companyId: string): Promise<string> {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { slug: true, name: true },
  });

  // Prefijo limpio de 3-4 caracteres basado en el slug o nombre
  const rawPrefix = (company?.slug || company?.name || "CORP")
    .replace(/[^a-zA-Z0-9]/g, "")
    .substring(0, 4)
    .toUpperCase();
  const prefix = rawPrefix.length >= 2 ? rawPrefix : "USR";

  // Contar los miembros actuales para generar un índice correlativo base
  const count = await prisma.companyUser.count({
    where: { companyId },
  });

  let nextSequence = count + 1;
  let candidateId = `USR-${prefix}-${String(nextSequence).padStart(4, "0")}`;

  // Verificar si ya existe en la empresa para evitar colisiones
  let exists = await prisma.companyUser.findFirst({
    where: { companyId, tenantUserId: candidateId },
  });

  // Si existe colisión, iterar o añadir sufijo aleatorio único
  while (exists) {
    const randomSuffix = randomBytes(2).toString("hex").toUpperCase();
    candidateId = `USR-${prefix}-${randomSuffix}`;
    exists = await prisma.companyUser.findFirst({
      where: { companyId, tenantUserId: candidateId },
    });
  }

  return candidateId;
}

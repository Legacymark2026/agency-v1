/**
 * modules/analytics/components/tenant-bi-wrapper.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Nivel 3A + 3B: Server Component Wrapper para Tenant BI
 *
 * Se encarga de obtener el companyId del contexto actual, hacer fetch de los
 * datos de BI aislados del tenant, y pasarlos al Client Component interactivo.
 * Diseñado para ser envuelto en <Suspense fallback={<BIDashboardSkeleton />}>.
 */

import { getAuthContext } from "@/lib/auth-context";
import { getTenantBISnapshot } from "../actions/bi-tenant";
import { TenantBIDashboard } from "./tenant-bi-dashboard";
import { prisma } from "@/lib/prisma";

export async function TenantBIWrapper() {
  const { companyId } = await getAuthContext();

  if (!companyId) {
    return (
      <div className="ds-card flex flex-col items-center justify-center py-12">
        <p className="font-mono text-xs text-rose-400 uppercase tracking-widest border border-rose-500/30 bg-rose-500/10 px-4 py-2 rounded-sm">
          [ERR] Tenant Context Missing
        </p>
        <p className="text-slate-400 mt-4 text-sm">
          No se pudo determinar el contexto de la empresa. Verifica la sesión activa.
        </p>
      </div>
    );
  }

  // Fetch data (Cached via unstable_cache inside action)
  const [data, company] = await Promise.all([
    getTenantBISnapshot(companyId),
    prisma.company.findUnique({ where: { id: companyId }, select: { name: true } })
  ]);

  return <TenantBIDashboard data={data} companyName={company?.name} />;
}

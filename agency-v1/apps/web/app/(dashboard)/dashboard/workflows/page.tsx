import React from "react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth"; // Fallback to your auth if different
import { redirect } from "next/navigation";
import Link from "next/link";
import { Network, Play, Pause, ExternalLink } from "lucide-react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export const metadata = {
  title: "Automation Hub - LegacyMark",
};

export default async function WorkflowsPage() {
  const session = await auth();
  if (!session?.user?.companyId) {
    redirect("/auth/signin");
  }

  const workflows = await prisma.workflow.findMany({
    where: { companyId: session.user.companyId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex-1 space-y-4 p-8 pt-6 bg-slate-950 text-slate-50 min-h-screen">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
          <Network className="h-8 w-8 text-teal-500" />
          Automation Hub
        </h2>
        <div className="flex items-center space-x-2">
          {/* Create new workflow button could go here */}
        </div>
      </div>
      
      <p className="text-slate-400 mb-6">
        Gestiona y visualiza tus flujos de trabajo autónomos (DAG) para la agencia.
      </p>

      <div className="border border-slate-800 rounded-md bg-slate-900/50 backdrop-blur">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-800 hover:bg-slate-800/50">
              <TableHead className="text-slate-300">Nombre del Flujo</TableHead>
              <TableHead className="text-slate-300">Trigger</TableHead>
              <TableHead className="text-slate-300">Estado</TableHead>
              <TableHead className="text-right text-slate-300">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {workflows.map((workflow) => (
              <TableRow key={workflow.id} className="border-slate-800 hover:bg-slate-800/50">
                <TableCell className="font-medium">
                  <div className="flex flex-col">
                    <span className="text-teal-400">{workflow.name}</span>
                    <span className="text-xs text-slate-500">{workflow.description || "Sin descripción"}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="border-teal-500/30 text-teal-400 bg-teal-500/10">
                    {workflow.triggerType}
                  </Badge>
                </TableCell>
                <TableCell>
                  {workflow.isActive ? (
                    <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 flex w-fit items-center gap-1">
                      <Play className="h-3 w-3" /> Activo
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-slate-800 text-slate-400 flex w-fit items-center gap-1">
                      <Pause className="h-3 w-3" /> Inactivo
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Link 
                    href={`/dashboard/workflows/${workflow.id}`}
                    className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-teal-400 transition-colors"
                  >
                    Visual Builder <ExternalLink className="h-4 w-4" />
                  </Link>
                </TableCell>
              </TableRow>
            ))}
            {workflows.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-slate-500">
                  No hay automatizaciones configuradas.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

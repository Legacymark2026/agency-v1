import React from "react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { WorkflowCanvas } from "./workflow-canvas";

export const metadata = {
  title: "Visual Builder - LegacyMark",
};

export default async function WorkflowBuilderPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();
  if (!session?.user?.companyId) {
    redirect("/auth/signin");
  }

  const workflow = await prisma.workflow.findUnique({
    where: { id: params.id, companyId: session.user.companyId },
  });

  if (!workflow) {
    redirect("/dashboard/workflows");
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] w-full flex-col bg-slate-950">
      <WorkflowCanvas workflow={workflow} />
    </div>
  );
}

import { getWorkflows, toggleWorkflowStatus, deleteWorkflow } from "@/actions/marketing/automation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Plus, Play, Pause, Trash2, GitBranch } from "lucide-react";
import { revalidatePath } from "next/cache";

// Temp: Direct DB access for Company ID


export default async function AutomationPage() {
    const session = await auth();
    if (!session?.user?.id) return redirect("/auth/login");

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { companies: true }
    });
    const companyId = user?.companies[0]?.companyId;

    if (!companyId) return <div>No company found.</div>;

    const workflows = await getWorkflows(companyId);

    return (
        <div className="p-8 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Marketing Automation</h1>
                    <p className="text-muted-foreground">Build workflows to nurture leads automatically.</p>
                </div>
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> Create Workflow
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {workflows.map(workflow => (
                    <Card key={workflow.id} className={workflow.isActive ? "border-l-4 border-l-green-500" : "border-l-4 border-l-gray-300"}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <div className="space-y-1">
                                <CardTitle className="text-base font-semibold">{workflow.name}</CardTitle>
                                <CardDescription className="text-xs">
                                    Trigger: {workflow.triggerType}
                                </CardDescription>
                            </div>
                            {workflow.isActive ? <Play size={16} className="text-green-600" /> : <Pause size={16} className="text-gray-400" />}
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-gray-500 line-clamp-2 my-2 h-10">
                                {workflow.description || "No description provided."}
                            </p>
                            <div className="flex items-center justify-between pt-4 border-t">
                                <div className="text-xs text-muted-foreground flex items-center gap-1">
                                    <GitBranch size={12} /> {Array.isArray(workflow.steps) ? workflow.steps.length : ((workflow.steps as any)?.nodes?.length || 0)} steps
                                </div>
                                <div className="flex gap-2">
                                    <form action={async () => {
                                        'use server';
                                        await toggleWorkflowStatus(workflow.id, !workflow.isActive);
                                    }}>
                                        <Button variant="ghost" size="icon" className="h-8 w-8" title={workflow.isActive ? "Pause" : "Activate"}>
                                            {workflow.isActive ? <Pause size={14} /> : <Play size={14} />}
                                        </Button>
                                    </form>
                                    <form action={async () => {
                                        'use server';
                                        await deleteWorkflow(workflow.id);
                                    }}>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50">
                                            <Trash2 size={14} />
                                        </Button>
                                    </form>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {/* Empty State / New Workflow Card */}
                <Button variant="outline" className="h-full min-h-[180px] flex flex-col gap-2 border-dashed border-2 hover:border-solid">
                    <Plus size={32} className="text-gray-300" />
                    <span className="text-muted-foreground font-medium">Create New Workflow</span>
                </Button>
            </div>
        </div>
    );
}

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Plus, Trash2, GripVertical, Clock, Mail } from "lucide-react";
import Link from "next/link";
import { revalidatePath } from "next/cache";

// Server Actions for this page
async function saveStep(formData: FormData) {
    'use server';
    const campaignId = formData.get("campaignId") as string;
    const workflowId = formData.get("workflowId") as string;
    const type = formData.get("type") as string;

    const workflow = await db.workflow.findUnique({ where: { id: workflowId } });
    if (!workflow) return;

    const steps = (workflow.steps as any[]) || [];

    if (type === 'EMAIL') {
        steps.push({
            id: crypto.randomUUID(),
            type: 'EMAIL',
            subject: formData.get("subject"),
            content: formData.get("content"),
            delay: 0
        });
    } else if (type === 'WAIT') {
        steps.push({
            id: crypto.randomUUID(),
            type: 'WAIT',
            duration: formData.get("duration") || '1d'
        });
    }

    await db.workflow.update({
        where: { id: workflowId },
        data: { steps }
    });

    revalidatePath(`/dashboard/marketing/campaigns/${campaignId}`);
}

async function deleteStep(formData: FormData) {
    'use server';
    const workflowId = formData.get("workflowId") as string;
    const stepId = formData.get("stepId") as string;
    const campaignId = formData.get("campaignId") as string; // passed for revalidate

    const workflow = await db.workflow.findUnique({ where: { id: workflowId } });
    if (!workflow) return;

    const steps = (workflow.steps as any[]).filter((s: any) => s.id !== stepId);

    await db.workflow.update({
        where: { id: workflowId },
        data: { steps }
    });

    revalidatePath(`/dashboard/marketing/campaigns/${campaignId}`);
}

export default async function CampaignEditorPage({ params }: { params: { id: string } }) {
    const session = await auth();
    if (!session?.user?.id) return redirect("/auth/login");

    const campaign = await db.campaign.findUnique({
        where: { id: params.id }
    });

    if (!campaign) return <div>Campaign not found</div>;

    // Find associated workflow (created automatically with campaign)
    const workflow = await db.workflow.findFirst({
        where: {
            triggerType: 'CAMPAIGN_ENROLLMENT',
            triggerConfig: {
                path: ['campaignId'],
                equals: campaign.id
            }
        }
    }) || await db.workflow.findFirst({
        // Fallback: search by name/description convention if config structure varies
        where: { description: { contains: campaign.id } }
    });

    // Valid check for steps
    const steps = workflow ? (workflow.steps as any[]) : [];

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/marketing/campaigns">
                    <Button variant="ghost" size="icon"><ArrowLeft /></Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold">{campaign.name}</h1>
                    <p className="text-muted-foreground">Sequence Editor</p>
                </div>
                <div className="ml-auto">
                    <Button variant={campaign.status === 'ACTIVE' ? "primary" : "secondary"}>
                        {campaign.status}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Visual Timeline */}
                <div className="lg:col-span-2 space-y-6">
                    {steps.length === 0 && (
                        <div className="text-center py-12 border-2 border-dashed rounded-lg">
                            <p className="text-muted-foreground mb-4">No steps in this sequence yet.</p>
                            <p className="text-sm">Add an email or wait time on the right.</p>
                        </div>
                    )}

                    {steps.map((step, index) => (
                        <div key={step.id || index} className="relative pl-8 border-l-2 border-gray-200 last:border-0 pb-8">
                            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-2 border-primary"></div>

                            <Card className="relative group">
                                <CardHeader className="p-4 flex flex-row items-start justify-between space-y-0">
                                    <div className="flex items-center gap-2">
                                        {step.type === 'EMAIL' ? <Mail size={16} className="text-blue-500" /> : <Clock size={16} className="text-orange-500" />}
                                        <CardTitle className="text-base">
                                            {step.type === 'EMAIL' ? step.subject : `Wait ${step.duration}`}
                                        </CardTitle>
                                    </div>
                                    <form action={deleteStep}>
                                        <input type="hidden" name="workflowId" value={workflow?.id} />
                                        <input type="hidden" name="stepId" value={step.id} />
                                        <input type="hidden" name="campaignId" value={campaign.id} />
                                        <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Trash2 size={14} className="text-red-500" />
                                        </Button>
                                    </form>
                                </CardHeader>
                                {step.type === 'EMAIL' && (
                                    <CardContent className="p-4 pt-0 text-sm text-muted-foreground line-clamp-2">
                                        {step.content}
                                    </CardContent>
                                )}
                            </Card>
                        </div>
                    ))}
                </div>

                {/* Sidebar Controls */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader><CardTitle className="text-lg">Add Email</CardTitle></CardHeader>
                        <CardContent>
                            <form action={saveStep} className="space-y-4">
                                <input type="hidden" name="campaignId" value={campaign.id} />
                                <input type="hidden" name="workflowId" value={workflow?.id} />
                                <input type="hidden" name="type" value="EMAIL" />

                                <div className="space-y-2">
                                    <Label>Subject</Label>
                                    <Input name="subject" required placeholder="Welcome..." />
                                </div>
                                <div className="space-y-2">
                                    <Label>Content</Label>
                                    <Textarea name="content" required placeholder="Hi there..." />
                                </div>
                                <Button type="submit" className="w-full" variant="outline"><Plus className="mr-2 h-4 w-4" /> Add Email Node</Button>
                            </form>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle className="text-lg">Add Delay</CardTitle></CardHeader>
                        <CardContent>
                            <form action={saveStep} className="space-y-4">
                                <input type="hidden" name="campaignId" value={campaign.id} />
                                <input type="hidden" name="workflowId" value={workflow?.id} />
                                <input type="hidden" name="type" value="WAIT" />

                                <div className="space-y-2">
                                    <Label>Duration</Label>
                                    <select name="duration" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                                        <option value="1h">1 Hour</option>
                                        <option value="1d">1 Day</option>
                                        <option value="2d">2 Days</option>
                                        <option value="1w">1 Week</option>
                                    </select>
                                </div>
                                <Button type="submit" className="w-full" variant="outline"><Clock className="mr-2 h-4 w-4" /> Add Wait Node</Button>
                            </form>
                        </CardContent>
                    </Card>

                    {!workflow && (
                        <div className="p-4 bg-yellow-50 text-yellow-800 rounded-md text-sm border border-yellow-200">
                            No linked workflow found. Please delete and recreate this campaign.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

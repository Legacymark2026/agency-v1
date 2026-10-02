import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { revalidatePath } from "next/cache";

export default async function AdSpendPage() {
    const session = await auth();
    if (!session?.user?.id) return redirect("/auth/login");

    const spends = await db.adSpend.findMany({
        orderBy: { date: 'desc' },
        take: 50
    });

    async function addSpend(formData: FormData) {
        'use server';
        const session = await auth();
        if (!session?.user?.id) return;

        // Quick hack: get companyId from user relation (ideally cached or in session)
        const user = await db.user.findUnique({
            where: { id: session.user.id },
            include: { companies: true }
        });
        const companyId = user?.companies[0]?.companyId;
        if (!companyId) return;

        const date = new Date(formData.get("date") as string);
        const platform = formData.get("platform") as string;
        const amount = parseFloat(formData.get("amount") as string);

        await db.adSpend.create({
            data: {
                companyId,
                date,
                platform,
                amount,
                impressions: parseInt(formData.get("impressions") as string) || 0,
                clicks: parseInt(formData.get("clicks") as string) || 0
            }
        });

        revalidatePath("/dashboard/marketing");
        revalidatePath("/dashboard/marketing/spend");
    }

    return (
        <div className="p-8 space-y-8">
            <h1 className="text-3xl font-bold">Ad Spend Manager</h1>

            <Card>
                <CardHeader>
                    <CardTitle>Log Daily Spend</CardTitle>
                </CardHeader>
                <CardContent>
                    <form action={addSpend} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                        <div className="space-y-2">
                            <Label>Date</Label>
                            <Input name="date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} />
                        </div>
                        <div className="space-y-2">
                            <Label>Platform</Label>
                            <select name="platform" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                                <option value="FACEBOOK">Meta / Facebook</option>
                                <option value="GOOGLE">Google Ads</option>
                                <option value="LINKEDIN">LinkedIn</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label>Amount ($)</Label>
                            <Input name="amount" type="number" step="0.01" required placeholder="0.00" />
                        </div>
                        <div className="space-y-2">
                            <Label>Clicks (Optional)</Label>
                            <Input name="clicks" type="number" placeholder="0" />
                        </div>
                        <Button type="submit">Log Spend</Button>
                    </form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Recent Entries</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {spends.map((spend) => (
                            <div key={spend.id} className="flex justify-between border-b pb-2">
                                <span>{spend.date.toLocaleDateString()} - <b>{spend.platform}</b></span>
                                <span>${spend.amount.toFixed(2)} ({spend.clicks} clicks)</span>
                            </div>
                        ))}
                        {spends.length === 0 && <p className="text-muted-foreground">No spend data logged yet.</p>}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

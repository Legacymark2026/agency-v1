import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { revalidatePath } from "next/cache";

export default async function ShortLinksPage() {
    const session = await auth();
    if (!session?.user?.id) return redirect("/auth/login");

    const links = await db.shortLink.findMany({
        orderBy: { createdAt: 'desc' }
    });

    async function createLink(formData: FormData) {
        'use server';
        const session = await auth();
        if (!session?.user?.id) return;

        const user = await db.user.findUnique({
            where: { id: session.user.id },
            include: { companies: true }
        });
        const companyId = user?.companies[0]?.companyId;
        if (!companyId) return;

        const slug = formData.get("slug") as string;
        const url = formData.get("url") as string;

        await db.shortLink.create({
            data: {
                companyId,
                slug,
                destinationUrl: url,
                utmSource: formData.get("utm_source") as string,
                utmMedium: formData.get("utm_medium") as string,
                utmCampaign: formData.get("utm_campaign") as string,
            }
        });

        revalidatePath("/dashboard/marketing/links");
    }

    return (
        <div className="p-8 space-y-8">
            <h1 className="text-3xl font-bold">Tracked Links</h1>

            <Card>
                <CardHeader>
                    <CardTitle>Create New Link</CardTitle>
                </CardHeader>
                <CardContent>
                    <form action={createLink} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Slug (e.g. "summer-sale")</Label>
                                <Input name="slug" required placeholder="summer-sale" />
                            </div>
                            <div className="space-y-2">
                                <Label>Destination URL</Label>
                                <Input name="url" required placeholder="https://..." />
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label>UTM Source</Label>
                                <Input name="utm_source" placeholder="facebook" />
                            </div>
                            <div className="space-y-2">
                                <Label>UTM Medium</Label>
                                <Input name="utm_medium" placeholder="social" />
                            </div>
                            <div className="space-y-2">
                                <Label>UTM Campaign</Label>
                                <Input name="utm_campaign" placeholder="launch" />
                            </div>
                        </div>
                        <Button type="submit">Create Link</Button>
                    </form>
                </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {links.map(link => (
                    <Card key={link.id}>
                        <CardHeader className="p-4">
                            <CardTitle className="text-lg">/{link.slug}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <p className="text-xs text-muted-foreground truncate mb-2">{link.destinationUrl}</p>
                            <div className="flex justify-between items-center">
                                <span className="font-bold text-2xl">{link.clicks} <span className="text-sm font-normal text-muted-foreground">clicks</span></span>
                                <Button variant="outline" size="sm">Copy</Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}

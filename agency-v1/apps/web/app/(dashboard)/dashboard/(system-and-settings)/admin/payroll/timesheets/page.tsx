import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getTimesheets } from "@/actions/hr-time";
import { TimesheetManager } from "@/components/hr/timesheet-manager";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export default async function TimesheetsPage() {
    const session = await auth();
    if (!session?.user) redirect("/auth/login");

    const companyUser = await prisma.companyUser.findFirst({
        where: { userId: session.user.id },
        select: { companyId: true }
    });

    if (!companyUser) redirect("/dashboard");

    const sheets = await getTimesheets(companyUser.companyId);

    return (
        <div className="animate-in fade-in duration-300 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
            <TimesheetManager companyId={companyUser.companyId} initialData={sheets} />
        </div>
    );
}

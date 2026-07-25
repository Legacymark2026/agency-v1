import { getUsers, getCustomRoles } from "@/actions/admin";
import { auth } from "@/lib/auth";
import { UsersDashboardClient } from "@/components/users/UsersDashboardClient";

export const dynamic = 'force-dynamic';

export default async function UsersPage() {
    const [result, session, rolesRes] = await Promise.all([getUsers(), auth(), getCustomRoles()]);

    if ('error' in result) {
        return (
            <div className="flex flex-col items-center justify-center p-10 h-full min-h-[400px]">
                <div className="bg-rose-950/60 text-rose-300 p-6 rounded-2xl border border-rose-800/80 shadow-xl space-y-2 max-w-md text-center">
                    <h2 className="font-bold text-lg text-white">Error al cargar usuarios</h2>
                    <p className="text-xs text-rose-200">{result.error}</p>
                </div>
            </div>
        );
    }

    const users = result.users || [];
    const currentUserId = session?.user?.id ?? "";
    const customRoles = rolesRes?.success ? rolesRes.roles : [];

    return (
        <div className="h-full">
            <UsersDashboardClient
                initialUsers={users as any}
                currentUserId={currentUserId}
                customRoles={customRoles}
            />
        </div>
    );
}

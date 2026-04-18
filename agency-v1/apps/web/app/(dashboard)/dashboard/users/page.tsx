import { getUsers, getCustomRoles } from "@/actions/admin";
import { auth } from "@/lib/auth";
import { UsersDashboardClient } from "@/components/users/UsersDashboardClient";

export const dynamic = 'force-dynamic';

export default async function UsersPage() {
    const [result, session, rolesRes] = await Promise.all([getUsers(), auth(), getCustomRoles()]);

    if ('error' in result) {
        return (
            <div className="flex flex-col items-center justify-center p-10 h-full">
                <div className="bg-red-50 text-red-600 p-6 rounded-2xl border border-red-200">
                    <h2 className="font-bold text-lg">Error fatal</h2>
                    <p>{result.error}</p>
                </div>
            </div>
        );
    }

    const { users } = result;
    const currentUserId = session?.user?.id ?? "";
    const customRoles = rolesRes.success ? rolesRes.roles : [];

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

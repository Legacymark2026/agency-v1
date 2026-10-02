import { redirect } from "next/navigation";

export default function IntegrationsPageRedirect() {
    redirect("/dashboard/admin/marketing/settings");
}

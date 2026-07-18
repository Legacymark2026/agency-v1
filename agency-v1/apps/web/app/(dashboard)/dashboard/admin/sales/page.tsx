import { redirect } from "next/navigation";

/**
 * /dashboard/admin/sales — Landing page
 * Redirects to the Sales Goals hub (the primary entry point for the Sales module).
 */
export default function SalesIndexPage() {
  redirect("/dashboard/admin/sales/goals");
}

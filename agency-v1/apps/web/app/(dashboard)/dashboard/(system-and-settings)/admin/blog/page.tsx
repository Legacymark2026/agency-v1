import { redirect } from "next/navigation";

/**
 * /dashboard/admin/blog — Landing page
 * Redirects to the Blog Comments moderation panel (the primary blog admin view).
 */
export default function BlogAdminIndexPage() {
  redirect("/dashboard/admin/blog/comments");
}

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getCompanyFeedAction } from "@/actions/feed.actions";
import { EnterpriseFeedClient } from "@/components/feed/enterprise-feed-client";

export const metadata = {
  title: "Muro Corporativo | LegacyMark SaaS",
  description: "Publicaciones internas, comunicados de equipo e interacciones sociales empresariales."
};

export default async function FeedPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  let posts = [];
  try {
    const res: any = await getCompanyFeedAction();
    if (res?.data) {
      posts = res.data;
    }
  } catch (err) {
    console.error("Error fetching company feed:", err);
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <EnterpriseFeedClient
        initialPosts={posts}
        currentUserId={session.user.id}
        currentUserName={session.user.name || "Colaborador"}
        companyId={session.user.companyId || "default-tenant"}
      />
    </div>
  );
}

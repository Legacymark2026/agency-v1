import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getChatChannelsAction } from "@/actions/chat.actions";
import { EnterpriseChatClient } from "@/components/chat/enterprise-chat-client";

export const metadata = {
  title: "Chat Empresarial | LegacyMark SaaS",
  description: "Comunicación en tiempo real y salas de coordinación operativa interna."
};

export default async function ChatPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  let channels = [];
  try {
    const res: any = await getChatChannelsAction();
    if (res?.data) {
      channels = res.data;
    }
  } catch (err) {
    console.error("Error fetching channels:", err);
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <EnterpriseChatClient
        initialChannels={channels}
        currentUserId={session.user.id}
        currentUserName={session.user.name || "Colaborador"}
        companyId={session.user.companyId || "default-tenant"}
      />
    </div>
  );
}

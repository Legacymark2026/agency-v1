import { validateApiKey } from "@/lib/auth-api";
import { notFound } from "next/navigation";
import { ChatWidgetEmbed } from "./chat-widget-embed";

export default async function ChatWidgetPage({
    searchParams,
}: {
    searchParams: { apiKey?: string; visitorId?: string };
}) {
    const { apiKey, visitorId } = await searchParams;

    if (!apiKey) return notFound();

    const auth = await validateApiKey(apiKey);
    if (!auth) return notFound();

    return (
        <main className="min-h-screen bg-transparent">
            <ChatWidgetEmbed 
                apiKey={apiKey} 
                companyId={auth.companyId} 
                visitorId={visitorId} 
            />
        </main>
    );
}

import { Suspense } from "react";
import { getEvents } from "@/actions/events/event-actions";
import { EventsClient } from "@/components/events/events-client";
import { Loader2 } from "lucide-react";

export const metadata = {
    title: "Calendario y Eventos | LegacyMark",
    description: "Centralized Calendar and Advanced Event Management",
};

export default async function EventsPage() {
    // Initial fetch of current month's events
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 2, 0); // Fetch a bit ahead

    const eventsRes = await getEvents({
        startDate: firstDay.toISOString(),
        endDate: lastDay.toISOString()
    });

    const initialEvents = eventsRes.success ? eventsRes.events : [];

    return (
        <div className="flex-1 h-[calc(100vh-64px)] overflow-hidden flex flex-col" style={{ background: '#0B0F19' }}>
            <Suspense fallback={
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
                </div>
            }>
                <EventsClient initialEvents={initialEvents} />
            </Suspense>
        </div>
    );
}

import { ChannelsClient } from "./channels-client";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Canales y Logística (Omnichannel) - NeoGestión Enterprise",
  description: "Parametrización de costos logísticos variables, salvaguarda de márgenes por canal y tableros regionales por SKU.",
};

export default function ChannelsPage() {
  return (
    <div className="flex-1 w-full bg-slate-950 min-h-screen text-slate-50">
      <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
        <ChannelsClient />
      </div>
    </div>
  );
}

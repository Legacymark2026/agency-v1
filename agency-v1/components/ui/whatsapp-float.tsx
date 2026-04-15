"use client";

import { MessageCircle } from "lucide-react";
import { siteConfig } from "@/lib/site-config";

export function WhatsAppFloat() {
    return (
        <a
            href={siteConfig.links.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="fixed bottom-6 right-6 z-40 bg-green-500 hover:bg-green-600 text-white p-3 rounded-full shadow-lg hover:scale-110 transition-all duration-300"
            aria-label="Contactar por WhatsApp"
        >
            <MessageCircle size={28} />
        </a>
    );
}
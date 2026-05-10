"use client";

import { IntegrationAppCard } from "./integration-app-card";
import { disconnectIntegration } from "@/actions/integrations";
import { toast } from "sonner";
import { useState } from "react";

interface NewIntegrationCardProps {
    integration: {
        key: string;
        name: string;
        desc: string;
        logo: string;
        fields?: { label: string; placeholder: string }[];
    };
    status?: any;
}

export function NewIntegrationCard({ integration, status }: NewIntegrationCardProps) {
    const isConnected = status?.status === "OK";
    
    const handleConnect = () => {
        // Redirigir al endpoint real de OAuth
        window.location.href = `/api/integrations/oauth/authorize?provider=${integration.key.toLowerCase()}`;
    };

    // Mapeo básico de colores según el nombre o key
    let brandColor = "bg-gradient-to-r from-slate-600 to-slate-400";
    if (integration.key === "HUBSPOT") brandColor = "bg-gradient-to-r from-orange-500 to-orange-400";
    if (integration.key === "MAILCHIMP") brandColor = "bg-gradient-to-r from-yellow-500 to-yellow-400";
    if (integration.key === "SLACK") brandColor = "bg-gradient-to-r from-purple-600 to-blue-500";
    if (integration.key === "ZAPIER") brandColor = "bg-gradient-to-r from-orange-500 to-red-500";

    return (
        <IntegrationAppCard
            name={integration.name}
            description={integration.desc}
            icon={<span className="text-2xl">{integration.logo}</span>}
            brandColor={brandColor}
            status={isConnected ? "connected" : "disconnected"}
            onConnect={handleConnect}
            providerId={integration.key.toLowerCase()}
        />
    );
}

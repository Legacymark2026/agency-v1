'use client';

import { useEffect } from "react";
import { useFacebookPixel } from "@/hooks/use-facebook-pixel";
import { useAnalytics } from "./analytics-provider";

interface TrackPageEventProps {
    eventName: string;
    data?: any;
    isCustom?: boolean;
}

export function TrackPageEvent({ eventName, data, isCustom = false }: TrackPageEventProps) {
    const { trackEvent: trackPixel, trackCustom: trackCustomPixel } = useFacebookPixel();
    const { trackEvent: trackAnalytics } = useAnalytics();

    useEffect(() => {
        // Delay slightly to ensure pixel is loaded
        const timer = setTimeout(() => {
            // Track in Internal Analytics
            trackAnalytics(eventName, data);

            // Track in Facebook Pixel
            if (isCustom) {
                trackCustomPixel(eventName, data);
            } else {
                trackPixel(eventName, data);
            }
        }, 1000);

        return () => clearTimeout(timer);
    }, [eventName, data, isCustom, trackPixel, trackCustomPixel, trackAnalytics]);

    return null;
}

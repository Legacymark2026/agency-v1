'use client';

import { useEffect, useState } from 'react';

export const useFacebookPixel = () => {
    const [pixel, setPixel] = useState<any>(null);

    useEffect(() => {
        import("react-facebook-pixel").then((x) => setPixel(x.default));
    }, []);

    const trackEvent = (event: string, data?: any) => {
        if (pixel) {
            const payload = { currency: 'COP', value: 0.00, ...(data || {}) };
            pixel.track(event, payload);
        }
    };

    const trackCustom = (event: string, data?: any) => {
        if (pixel) {
            const payload = { currency: 'COP', value: 0.00, ...(data || {}) };
            pixel.trackCustom(event, payload);
        }
    };

    return { trackEvent, trackCustom };
};

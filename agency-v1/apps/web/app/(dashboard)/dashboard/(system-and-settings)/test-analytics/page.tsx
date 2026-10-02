'use client';

import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";

export default function AnalyticsTestPage() {
    const [status, setStatus] = useState<{ ga4: string; pixel: string; hotjar: string }>({
        ga4: 'Checking...',
        pixel: 'Checking...',
        hotjar: 'Checking...'
    });
    const [events, setEvents] = useState<string[]>([]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            // Check GA4
            const gaStatus = (window as any).dataLayer ? 'Active (dataLayer found)' : 'Inactive';

            // Check Facebook Pixel
            const pixelStatus = (window as any).fbq ? 'Active (fbq found)' : 'Inactive';

            // Check Hotjar
            const hotjarStatus = (window as any).hj ? 'Active (hj found)' : 'Inactive';

            setStatus({ ga4: gaStatus, pixel: pixelStatus, hotjar: hotjarStatus });
        }
    }, []);

    const sendTestEvent = (provider: 'ga4' | 'pixel' | 'hotjar') => {
        const timestamp = new Date().toLocaleTimeString();
        if (typeof window === 'undefined') return;

        try {
            if (provider === 'ga4') {
                if ((window as any).gtag) {
                    (window as any).gtag('event', 'test_event', {
                        'event_category': 'testing',
                        'event_label': 'manual_trigger',
                        'value': 1
                    });
                    setEvents(prev => [...prev, `[GA4] Event sent at ${timestamp}`]);
                } else {
                    setEvents(prev => [...prev, `[GA4] Failed: gtag not found`]);
                }
            } else if (provider === 'pixel') {
                if ((window as any).fbq) {
                    (window as any).fbq('track', 'TestEvent', { value: 1, currency: 'USD' });
                    setEvents(prev => [...prev, `[Pixel] Event sent at ${timestamp}`]);
                } else {
                    setEvents(prev => [...prev, `[Pixel] Failed: fbq not found`]);
                }
            } else if (provider === 'hotjar') {
                if ((window as any).hj) {
                    (window as any).hj('event', 'test_trigger');
                    setEvents(prev => [...prev, `[Hotjar] Event sent at ${timestamp}`]);
                } else {
                    setEvents(prev => [...prev, `[Hotjar] Failed: hj not found`]);
                }
            }
        } catch (e) {
            setEvents(prev => [...prev, `[${provider}] Error: ${e}`]);
        }
    };

    return (
        <div className="p-10 max-w-2xl mx-auto space-y-8">
            <h1 className="text-3xl font-bold">Analytics Verification Center</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* GA4 Status */}
                <div className={`p-4 rounded-lg border ${status.ga4.includes('Active') ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <h3 className="font-bold text-sm mb-1">Google Analytics 4</h3>
                    <p className="text-xs">{status.ga4}</p>
                    <Button onClick={() => sendTestEvent('ga4')} size="sm" className="w-full mt-3" variant="outline">
                        Test GA4 Event
                    </Button>
                </div>

                {/* Facebook Pixel Status */}
                <div className={`p-4 rounded-lg border ${status.pixel.includes('Active') ? 'bg-blue-50 border-blue-200' : 'bg-red-50 border-red-200'}`}>
                    <h3 className="font-bold text-sm mb-1">Facebook Pixel</h3>
                    <p className="text-xs">{status.pixel}</p>
                    <Button onClick={() => sendTestEvent('pixel')} size="sm" className="w-full mt-3" variant="outline">
                        Test Pixel Event
                    </Button>
                </div>

                {/* Hotjar Status */}
                <div className={`p-4 rounded-lg border ${status.hotjar.includes('Active') ? 'bg-orange-50 border-orange-200' : 'bg-red-50 border-red-200'}`}>
                    <h3 className="font-bold text-sm mb-1">Hotjar</h3>
                    <p className="text-xs">{status.hotjar}</p>
                    <Button onClick={() => sendTestEvent('hotjar')} size="sm" className="w-full mt-3" variant="outline">
                        Test Hotjar Event
                    </Button>
                </div>
            </div>

            <div className="space-y-2 border rounded-lg p-4 bg-gray-50 min-h-[200px]">
                <h3 className="font-semibold text-sm text-gray-500 uppercase tracking-widest mb-4">Event Log</h3>
                {events.length === 0 && <p className="text-xs text-gray-400 italic">No events triggered yet.</p>}
                {events.map((e, i) => (
                    <div key={i} className="text-xs font-mono bg-white p-2 border rounded shadow-sm">{e}</div>
                ))}
            </div>
        </div>
    );
}

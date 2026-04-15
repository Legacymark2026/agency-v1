"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import Link from "next/link";

export function CookieConsent() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const consent = localStorage.getItem("cookie_consent");
        if (!consent) {
            // Auto-accept on first visit — dispara el evento para que el AnalyticsProvider active el tracking
            localStorage.setItem("cookie_consent", "accepted");
            window.dispatchEvent(new Event("cookie_consent_updated"));
            setIsVisible(true);
        } else {
            if (consent !== 'accepted') {
                setTimeout(() => setIsVisible(true), 2000);
            }
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem("cookie_consent", "accepted");
        window.dispatchEvent(new Event("cookie_consent_updated"));
        setIsVisible(false);
    };

    const handleDecline = () => {
        localStorage.setItem("cookie_consent", "declined");
        window.dispatchEvent(new Event("cookie_consent_updated"));
        setIsVisible(false);
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{ type: "spring", damping: 20, stiffness: 100 }}
                    className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-[400px] z-[1000] p-6 bg-white border border-gray-200 shadow-2xl rounded-2xl"
                >
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="text-lg font-bold text-black">🍪 Cookies & Privacidad</h3>
                        <button onClick={handleDecline} className="text-gray-400 hover:text-black">
                            <X size={20} />
                        </button>
                    </div>

                    <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                        Utilizamos cookies propias y de terceros para mejorar tu experiencia y analizar el tráfico. Puedes aceptar todas o gestionar tus preferencias.
                        {" "}
                        <Link href="/politica-cookies" className="underline text-black hover:text-blue-600">Política de Cookies</Link> y <Link href="/politica-privacidad" className="underline text-black hover:text-blue-600">Privacidad</Link>.
                    </p>

                    <div className="flex gap-3">
                        <Button
                            variant="primary"
                            className="flex-1"
                            onClick={handleAccept}
                        >
                            Aceptar Todo
                        </Button>
                        <Button
                            variant="outline"
                            className="flex-1"
                            onClick={handleDecline}
                        >
                            Rechazar
                        </Button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

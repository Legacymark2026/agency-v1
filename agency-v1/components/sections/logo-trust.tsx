"use client";

import { motion } from "framer-motion";
import Image from "next/image";

// Placeholder logos (using text/icons for valid component, assuming images would be real URLs)
// In a real app, replace src with actual client logo URLs
const CLIENTS = [
    { name: "TechCorp", src: "/placeholder/logo1.png" },
    { name: "GlobalFinance", src: "/placeholder/logo2.png" },
    { name: "StartUpBoom", src: "/placeholder/logo3.png" },
    { name: "MegaRetail", src: "/placeholder/logo4.png" },
    { name: "InnovateLabs", src: "/placeholder/logo5.png" },
    { name: "AlphaGroup", src: "/placeholder/logo6.png" },
];

// Duplicate for seamless loop
const LOGOS = [...CLIENTS, ...CLIENTS, ...CLIENTS];

export function LogoTrust() {
    return (
        <section className="bg-white py-10 border-b border-gray-100 overflow-hidden">
            <div className="mx-auto max-w-7xl px-4 text-center mb-8">
                <p className="text-sm font-semibold uppercase tracking-wider text-gray-400">
                    Confían en nuestra estrategia
                </p>
            </div>

            <div className="relative flex w-full">
                {/* Gradient Masks */}
                <div className="absolute left-0 top-0 z-10 h-full w-24 bg-gradient-to-r from-white to-transparent" />
                <div className="absolute right-0 top-0 z-10 h-full w-24 bg-gradient-to-l from-white to-transparent" />

                <motion.div
                    className="flex min-w-full items-center gap-16 px-8"
                    animate={{ x: "-50%" }}
                    transition={{
                        duration: 30,
                        repeat: Infinity,
                        ease: "linear",
                    }}
                >
                    {LOGOS.map((client, i) => (
                        <div key={`${client.name}-${i}`} className="flex flex-shrink-0 flex-col items-center justify-center opacity-50 grayscale transition-all hover:opacity-100 hover:grayscale-0 cursor-pointer">
                            {/* Using specific font styling to simulate logo if image missing */}
                            <span className="text-xl font-black italic text-gray-800 tracking-tighter">{client.name}</span>
                        </div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}

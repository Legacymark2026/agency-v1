"use client";

import Image from "next/image";

// Placeholder logos - in a real app these would be imported from assets or CDN
const logos = [
    "Google", "Amazon", "Microsoft", "Uber", "Spotify", "Airbnb", "Tesla", "Adobe"
];

export function InfiniteLogos() {
    return (
        <section className="relative w-full border-t border-white/5 bg-[#030014] py-12">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />

            <p className="mb-8 text-center text-sm font-medium uppercase tracking-widest text-gray-500">
                Confían en nosotros compañías líderes
            </p>

            <div className="relative flex overflow-hidden">
                <div className="flex animate-marquee gap-16 whitespace-nowrap py-4">
                    {[...logos, ...logos].map((logo, index) => (
                        <div key={index} className="flex items-center gap-2 text-2xl font-bold text-gray-700 hover:text-white transition-colors cursor-default">
                            {/* Replaced Image with Text for stability if assets missing, but keeping the structure for logos */}
                            <span className="opacity-50 hover:opacity-100 hover:scale-105 transition-all duration-300 transform">
                                {logo}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Gradient Masks */}
                <div className="pointer-events-none absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[#030014] to-transparent" />
                <div className="pointer-events-none absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-[#030014] to-transparent" />
            </div>
        </section>
    );
}

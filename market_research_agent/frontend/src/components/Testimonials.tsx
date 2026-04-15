"use client"

import { motion } from "framer-motion"

const testimonials = [
    {
        quote: "We've seen a 300% increase in qualified leads since working with Agency.",
        author: "Sarah Johnson",
        role: "CMO, TechFlow",
        image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&h=100"
    },
    {
        quote: "The visual identity they created for us completely transformed our brand perception.",
        author: "Michael Chen",
        role: "Founder, Zenith",
        image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&h=100"
    },
    {
        quote: "Incredible attention to detail and a team that truly cares about your success.",
        author: "Emma Davis",
        role: "Director, ArtVibe",
        image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&h=100"
    },
    {
        quote: "Best investment we made this year. The ROI speaks for itself.",
        author: "James Wilson",
        role: "CEO, GrowthLabs",
        image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=100&h=100"
    },
]

export function Testimonials() {
    return (
        <section className="py-24 bg-white overflow-hidden border-t border-gray-100">
            <div className="max-w-7xl mx-auto px-6 mb-16 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                >
                    <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight" translate="no">Loved by Founders</h2>
                    <p className="text-xl text-gray-500" translate="no">Don't just take our word for it</p>
                </motion.div>
            </div>

            <div className="relative w-full overflow-hidden space-y-8">
                {/* Gradient Masks */}
                <div className="absolute top-0 left-0 w-32 h-full bg-gradient-to-r from-white z-20 pointer-events-none" />
                <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-white z-20 pointer-events-none" />

                {/* Row 1 - Left */}
                <div className="flex gap-6 w-max animate-scroll">
                    {[...testimonials, ...testimonials, ...testimonials].map((t, i) => (
                        <div
                            key={`row1-${i}`}
                            className="w-[350px] p-8 rounded-3xl bg-gray-50 border border-gray-100 flex-shrink-0 hover:bg-white hover:shadow-xl transition-all duration-300"
                        >
                            <div className="flex gap-1 mb-6">
                                {[1, 2, 3, 4, 5].map(star => (
                                    <svg key={star} className="w-4 h-4 text-yellow-500 fill-current" viewBox="0 0 20 20">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                ))}
                            </div>
                            <p className="text-lg font-medium text-gray-900 mb-6 leading-relaxed" translate="no">
                                "{t.quote}"
                            </p>
                            <div className="flex items-center gap-4">
                                <img src={t.image} alt={t.author} className="w-10 h-10 rounded-full object-cover ring-2 ring-white" />
                                <div>
                                    <div className="font-bold text-gray-900 text-sm" translate="no">{t.author}</div>
                                    <div className="text-xs text-gray-500" translate="no">{t.role}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Row 2 - Right */}
                <div className="flex gap-6 w-max animate-scroll-reverse">
                    {[...testimonials, ...testimonials, ...testimonials].map((t, i) => (
                        <div
                            key={`row2-${i}`}
                            className="w-[350px] p-8 rounded-3xl bg-gray-50 border border-gray-100 flex-shrink-0 hover:bg-white hover:shadow-xl transition-all duration-300"
                        >
                            <div className="flex gap-1 mb-6">
                                {[1, 2, 3, 4, 5].map(star => (
                                    <svg key={star} className="w-4 h-4 text-yellow-500 fill-current" viewBox="0 0 20 20">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                ))}
                            </div>
                            <p className="text-lg font-medium text-gray-900 mb-6 leading-relaxed" translate="no">
                                "{t.quote}"
                            </p>
                            <div className="flex items-center gap-4">
                                <img src={t.image} alt={t.author} className="w-10 h-10 rounded-full object-cover ring-2 ring-white" />
                                <div>
                                    <div className="font-bold text-gray-900 text-sm" translate="no">{t.author}</div>
                                    <div className="text-xs text-gray-500" translate="no">{t.role}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <style jsx>{`
                @keyframes scroll {
                    from { transform: translateX(0); }
                    to { transform: translateX(-50%); }
                }
                @keyframes scroll-reverse {
                    from { transform: translateX(-50%); }
                    to { transform: translateX(0); }
                }
                .animate-scroll {
                    animation: scroll 60s linear infinite;
                }
                .animate-scroll-reverse {
                    animation: scroll-reverse 70s linear infinite;
                }
                .animate-scroll:hover, .animate-scroll-reverse:hover {
                    animation-play-state: paused;
                }
            `}</style>
        </section>
    )
}

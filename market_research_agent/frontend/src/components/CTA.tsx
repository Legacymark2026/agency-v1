"use client"

import { motion } from "framer-motion"
import { ArrowRight, Sparkles } from "lucide-react"

export function CTA() {
    return (
        <section className="relative py-40 bg-black text-white overflow-hidden">
            {/* Animated mesh gradient background */}
            <div className="absolute inset-0">
                <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900" />

                {/* Animated orbs */}
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.5, 0.3],
                    }}
                    transition={{
                        duration: 8,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                    className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl"
                />
                <motion.div
                    animate={{
                        scale: [1.2, 1, 1.2],
                        opacity: [0.2, 0.4, 0.2],
                    }}
                    transition={{
                        duration: 8,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 1,
                    }}
                    className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"
                />
            </div>

            {/* Grid pattern */}
            <div
                className="absolute inset-0 opacity-[0.07]"
                style={{
                    backgroundImage: `linear-gradient(rgba(255,255,255,0.05) 1.5px, transparent 1.5px), linear-gradient(90deg, rgba(255,255,255,0.05) 1.5px, transparent 1.5px)`,
                    backgroundSize: '80px 80px',
                }}
            />

            <div className="relative z-10 max-w-6xl mx-auto px-6 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                >
                    {/* Badge */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-sm font-semibold mb-8"
                    >
                        <Sparkles className="w-4 h-4" />
                        <span>Start Growing Today</span>
                    </motion.div>

                    {/* Headline */}
                    <h2 className="text-5xl md:text-8xl font-bold mb-8 tracking-tight leading-[1.1]" translate="no">
                        <span className="block">Ready to Scale</span>
                        <span className="block bg-gradient-to-r from-white via-gray-300 to-white bg-clip-text text-transparent">
                            Your Brand?
                        </span>
                    </h2>

                    {/* Description */}
                    <p className="text-xl md:text-3xl text-gray-400 mb-16 max-w-4xl mx-auto leading-relaxed font-light" translate="no">
                        Join 500+ companies that trust us to drive their digital growth.
                        <br className="hidden md:block" />
                        Let's create something extraordinary together.
                    </p>

                    {/* CTAs */}
                    <div className="flex flex-col sm:flex-row gap-6 justify-center">
                        <motion.button
                            whileHover={{ scale: 1.05, boxShadow: "0 25px 50px rgba(255,255,255,0.2)" }}
                            whileTap={{ scale: 0.98 }}
                            className="group relative px-12 py-6 bg-white text-black rounded-full font-bold text-lg overflow-hidden shadow-2xl"
                            translate="no"
                        >
                            {/* Animated gradient background */}
                            <div className="absolute inset-0 bg-gradient-to-r from-gray-100 to-white group-hover:from-white group-hover:to-gray-100 transition-all duration-500" />

                            <span className="relative flex items-center justify-center gap-3">
                                Start Your Project
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" strokeWidth={2.5} />
                            </span>
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.1)" }}
                            whileTap={{ scale: 0.98 }}
                            className="group px-12 py-6 border-2 border-white/30 text-white rounded-full font-bold text-lg hover:border-white/50 transition-all shadow-lg backdrop-blur-sm"
                            translate="no"
                        >
                            <span className="flex items-center justify-center gap-2">
                                View Case Studies
                                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                            </span>
                        </motion.button>
                    </div>

                    {/* Trust indicators */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.6 }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-8 mt-16 text-sm text-gray-400"
                    >
                        <span className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            No Credit Card Required
                        </span>
                        <span className="hidden sm:block w-1 h-1 bg-gray-600 rounded-full" />
                        <span className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Free 14-Day Trial
                        </span>
                        <span className="hidden sm:block w-1 h-1 bg-gray-600 rounded-full" />
                        <span className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Cancel Anytime
                        </span>
                    </motion.div>
                </motion.div>
            </div>
        </section>
    )
}

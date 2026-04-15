"use client"

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion"
import { FloatingIcons } from "./FloatingIcons"
import { useEffect, useState } from "react"

export function HeroSection() {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

    // 3D Tilt Effect Logic
    const x = useMotionValue(0)
    const y = useMotionValue(0)

    const mouseXSpring = useSpring(x)
    const mouseYSpring = useSpring(y)

    const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["7deg", "-7deg"])
    const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-7deg", "7deg"])

    const handleMouseMove = (e: React.MouseEvent) => {
        const rect = (e.target as HTMLElement).getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const xPct = mouseX / width - 0.5;
        const yPct = mouseY / height - 0.5;
        x.set(xPct);
        y.set(yPct);
    }

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    }

    // Word Pull Up Animation
    const container = {
        hidden: { opacity: 0 },
        visible: (i = 1) => ({
            opacity: 1,
            transition: { staggerChildren: 0.12, delayChildren: 0.04 * i },
        }),
    };

    const child = {
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                type: "spring" as const,
                damping: 12,
                stiffness: 100,
            },
        },
        hidden: {
            opacity: 0,
            y: 20,
            transition: {
                type: "spring" as const,
                damping: 12,
                stiffness: 100,
            },
        },
    };

    return (
        <section className="relative min-h-[140vh] w-full bg-[#FAFAFA] flex flex-col items-center overflow-x-hidden">
            <div className="absolute inset-0 w-full h-full bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />

            <div className="sticky top-0 h-screen w-full flex items-center justify-center overflow-hidden">

                {/* Ambient background effects */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <motion.div
                        animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.3, 0.5, 0.3],
                            left: ["20%", "25%", "20%"],
                            top: ["10%", "15%", "10%"]
                        }}
                        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute w-[500px] h-[500px] bg-purple-200/30 rounded-full blur-[100px]"
                    />
                    <motion.div
                        animate={{
                            scale: [1, 1.1, 1],
                            opacity: [0.3, 0.5, 0.3],
                            right: ["10%", "15%", "10%"],
                            bottom: ["0%", "5%", "0%"]
                        }}
                        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute w-[600px] h-[600px] bg-blue-200/20 rounded-full blur-[100px]"
                    />
                </div>

                {/* Premium Phone Mockup with 3D Tilt */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.85, y: 100 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 1.2, type: "spring", bounce: 0.2 }}
                    className="relative z-10 perspective-1000"
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                    style={{ transformStyle: "preserve-3d", rotateX, rotateY }}
                >
                    {/* Phone container with premium shadows */}
                    <div className="relative w-[340px] h-[680px] bg-black rounded-[55px] p-3 shadow-2xl ring-1 ring-white/10 shadow-black/40 transition-shadow duration-500 ease-out hover:shadow-black/60">
                        {/* Inner phone border */}
                        <div className="w-full h-full bg-black rounded-[48px] p-[3px] border border-gray-800">
                            {/* Screen */}
                            <div className="relative w-full h-full bg-white rounded-[45px] overflow-hidden">
                                {/* Top Notch */}
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-black rounded-b-3xl z-30 flex items-center justify-center gap-2">
                                    <div className="w-16 h-1 bg-gray-900 rounded-full" />
                                </div>

                                {/* Screen Content */}
                                <div className="absolute inset-0 bg-white">
                                    {/* App Header */}
                                    <div className="absolute top-0 w-full h-24 bg-gradient-to-b from-black/80 to-transparent z-20" />

                                    {/* Main Image */}
                                    <div className="relative w-full h-full">
                                        <div className="absolute inset-0 bg-blue-500/10 mix-blend-overlay z-10" />
                                        <img
                                            src="https://images.unsplash.com/photo-1557804506-669a67965ba0?q=80&w=1000&auto=format&fit=crop"
                                            alt="Dashboard UI"
                                            className="w-full h-full object-cover"
                                        />

                                        {/* Floating Elements on Screen */}
                                        <motion.div
                                            initial={{ y: 20, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            transition={{ delay: 0.8 }}
                                            className="absolute md:top-32 md:left-6 top-24 left-4 bg-white/90 backdrop-blur-md p-4 rounded-xl shadow-lg border border-white/20 z-20 w-48"
                                        >
                                            <div className="h-2 w-16 bg-gray-200 rounded mb-2" />
                                            <div className="h-8 w-24 bg-blue-500 rounded-lg opacity-20" />
                                        </motion.div>

                                        <motion.div
                                            initial={{ y: 20, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            transition={{ delay: 1 }}
                                            className="absolute bottom-32 right-6 bg-black/80 backdrop-blur-md p-4 rounded-xl shadow-lg border border-white/10 z-20 w-40"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-green-400" />
                                                <div className="space-y-1">
                                                    <div className="h-2 w-16 bg-white/50 rounded" />
                                                    <div className="h-2 w-10 bg-white/30 rounded" />
                                                </div>
                                            </div>
                                        </motion.div>
                                    </div>
                                </div>

                                {/* Screen Reflection/Glare */}
                                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/20 pointer-events-none z-40 rounded-[45px]" />
                            </div>
                        </div>

                        {/* Hardware Buttons */}
                        <div className="absolute right-[-2px] top-28 w-[3px] h-12 bg-gray-700 rounded-r-sm" />
                        <div className="absolute left-[-2px] top-24 w-[3px] h-8 bg-gray-700 rounded-l-sm" />
                        <div className="absolute left-[-2px] top-36 w-[3px] h-8 bg-gray-700 rounded-l-sm" />
                    </div>
                </motion.div>

                {/* Floating Background Icons */}
                <FloatingIcons />

            </div>

            {/* Scroll Content */}
            <div className="relative z-20 w-full bg-white pt-24 pb-48 rounded-t-[3rem] shadow-[0_-50px_100px_rgba(0,0,0,0.05)] mt-[-10vh]">
                <div className="max-w-6xl mx-auto px-6 text-center">
                    <div className="flex flex-col items-center gap-8">
                        {/* Trust badge */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-50/50 border border-orange-100/50 text-sm font-medium text-orange-600 mb-4"
                        >
                            <span className="flex h-2 w-2 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                            </span>
                            #1 Rated Agency Platform
                        </motion.div>

                        {/* Animated Headline */}
                        <motion.h1
                            className="text-5xl md:text-8xl font-bold tracking-tight text-gray-900 leading-[0.9]"
                            variants={container}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                        >
                            <div className="overflow-hidden flex justify-center gap-4 flex-wrap">
                                {["Transform", "Your", "Digital"].map((word, i) => (
                                    <motion.span key={i} variants={child} className="inline-block">
                                        {word}
                                    </motion.span>
                                ))}
                            </div>
                            <div className="overflow-hidden flex justify-center gap-4 flex-wrap mt-2">
                                {["Presence", "Today"].map((word, i) => (
                                    <motion.span
                                        key={i}
                                        variants={child}
                                        className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
                                    >
                                        {word}
                                    </motion.span>
                                ))}
                            </div>
                        </motion.h1>

                        {/* Subheadline */}
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4, duration: 0.8 }}
                            className="text-xl md:text-2xl text-gray-500 max-w-2xl mx-auto font-medium leading-relaxed"
                        >
                            Leverage AI-driven insights to dominate your market.
                            We blend creativity with data to build brands that convert.
                        </motion.p>

                        {/* CTA Buttons */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6, duration: 0.8 }}
                            className="flex flex-col sm:flex-row gap-4 pt-8"
                        >
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="group px-8 py-4 bg-black text-white rounded-full font-medium text-lg flex items-center gap-3 shadow-xl hover:shadow-2xl hover:shadow-black/20 transition-all"
                            >
                                Start Your Journey
                                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                    </svg>
                                </div>
                            </motion.button>

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="px-8 py-4 bg-white text-gray-900 border border-gray-200 rounded-full font-medium text-lg hover:bg-gray-50 transition-colors"
                            >
                                View Case Studies
                            </motion.button>
                        </motion.div>
                    </div>
                </div>
            </div>
        </section>
    )
}

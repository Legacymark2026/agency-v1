"use client"

import { motion, useMotionTemplate, useMotionValue } from "framer-motion"
import { Megaphone, TrendingUp, Sparkles, Target, BarChart3, Zap } from "lucide-react"
import { MouseEvent } from "react"

const services = [
    {
        icon: Megaphone,
        title: "Social Media Marketing",
        description: "Amplify your brand across all major platforms with data-driven strategies and viral content.",
        gradient: "from-pink-500 to-rose-500",
    },
    {
        icon: TrendingUp,
        title: "Growth Strategy",
        description: "Scale your business with proven frameworks and performance marketing techniques.",
        gradient: "from-blue-500 to-indigo-500",
    },
    {
        icon: Sparkles,
        title: "Brand Identity",
        description: "Create unforgettable brand experiences that resonate with your target audience.",
        gradient: "from-purple-500 to-pink-500",
    },
    {
        icon: Target,
        title: "Paid Advertising",
        description: "Maximize ROI with precision-targeted campaigns across Google, Meta, and TikTok.",
        gradient: "from-orange-500 to-red-500",
    },
    {
        icon: BarChart3,
        title: "Analytics & Insights",
        description: "Transform data into actionable insights with advanced tracking and reporting.",
        gradient: "from-green-500 to-emerald-500",
    },
    {
        icon: Zap,
        title: "Conversion Optimization",
        description: "Increase conversions with A/B testing, UX optimization, and behavioral analysis.",
        gradient: "from-yellow-500 to-orange-500",
    },
]

function ServiceCard({ service, index }: { service: typeof services[0], index: number }) {
    const mouseX = useMotionValue(0)
    const mouseY = useMotionValue(0)

    function handleMouseMove({ currentTarget, clientX, clientY }: MouseEvent) {
        const { left, top } = currentTarget.getBoundingClientRect()
        mouseX.set(clientX - left)
        mouseY.set(clientY - top)
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="group relative border border-gray-200 bg-white rounded-3xl px-8 py-10 overflow-hidden"
            onMouseMove={handleMouseMove}
        >
            <motion.div
                className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 transition duration-300 group-hover:opacity-100"
                style={{
                    background: useMotionTemplate`
                        radial-gradient(
                          650px circle at ${mouseX}px ${mouseY}px,
                          rgba(14, 165, 233, 0.15),
                          transparent 80%
                        )
                      `,
                }}
            />
            <div className="relative h-full flex flex-col">
                <div className={`inline-flex w-14 h-14 rounded-xl bg-gradient-to-br ${service.gradient} items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <service.icon className="w-7 h-7 text-white" />
                </div>

                <h3 className="text-2xl font-bold text-gray-900 mb-4">{service.title}</h3>
                <p className="text-gray-500 leading-relaxed mb-8 flex-grow">
                    {service.description}
                </p>

                <div className="flex items-center gap-2 text-sm font-semibold text-gray-400 group-hover:text-black transition-colors cursor-pointer">
                    <span>Learn more</span>
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                </div>
            </div>
        </motion.div>
    )
}

export function Services() {
    return (
        <section className="relative py-32 bg-gray-50 overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-50" />

            <div className="relative max-w-7xl mx-auto px-6">
                <div className="text-center max-w-3xl mx-auto mb-20">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        className="text-4xl md:text-6xl font-bold tracking-tight text-gray-900 mb-6"
                    >
                        Services That Drive <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Real Growth</span>
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-xl text-gray-500 leading-relaxed"
                    >
                        Comprehensive digital solutions tailored to scale your business.
                    </motion.p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {services.map((service, index) => (
                        <ServiceCard key={service.title} service={service} index={index} />
                    ))}
                </div>
            </div>
        </section>
    )
}

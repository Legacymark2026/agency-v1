"use client"

import { motion, useInView } from "framer-motion"
import { useRef, useEffect, useState } from "react"
import { TrendingUp, Users, Award, DollarSign } from "lucide-react"
import { cn } from "@/lib/utils"

interface StatProps {
    value: number
    label: string
    suffix?: string
    prefix?: string
    icon: React.ElementType
    color: string
}

function AnimatedCounter({ value, suffix = "", prefix = "" }: Omit<StatProps, 'label' | 'icon' | 'color'>) {
    const [count, setCount] = useState(0)
    const ref = useRef<HTMLSpanElement>(null)
    const isInView = useInView(ref, { once: true, margin: "-100px" })

    useEffect(() => {
        if (!isInView) return

        let startTime: number | null = null
        const duration = 2500

        const animate = (currentTime: number) => {
            if (!startTime) startTime = currentTime
            const progress = Math.min((currentTime - startTime) / duration, 1)

            const easeOutQuart = 1 - Math.pow(1 - progress, 4)
            setCount(Math.floor(easeOutQuart * value))

            if (progress < 1) {
                requestAnimationFrame(animate)
            }
        }

        requestAnimationFrame(animate)
    }, [isInView, value])

    return <span ref={ref}>{prefix}{count.toLocaleString()}{suffix}</span>
}

function Stat({ value, label, suffix, prefix, icon: Icon, color }: StatProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ y: -8, transition: { duration: 0.2 } }}
            className="group"
        >
            <div className="relative p-8 rounded-3xl bg-gradient-to-br from-white to-gray-50 border border-gray-200 shadow-lg hover:shadow-2xl transition-all duration-300">
                {/* Icon badge */}
                <div className={cn(
                    "inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4",
                    "bg-gradient-to-br", color,
                    "shadow-lg group-hover:scale-110 transition-transform duration-300"
                )}>
                    <Icon className="w-7 h-7 text-white" strokeWidth={2} />
                </div>

                {/* Number */}
                <div className="text-6xl font-bold text-black mb-2 tracking-tight" translate="no">
                    <AnimatedCounter value={value} suffix={suffix} prefix={prefix} />
                </div>

                {/* Label */}
                <div className="text-gray-600 text-sm font-semibold uppercase tracking-wider" translate="no">
                    {label}
                </div>

                {/* Hover effect */}
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            </div>
        </motion.div>
    )
}

export function Stats() {
    return (
        <section className="relative py-32 bg-gradient-to-b from-white via-gray-50 to-white border-y border-gray-100">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-radial from-gray-200/40 to-transparent blur-3xl" />
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-radial from-gray-200/40 to-transparent blur-3xl" />
            </div>

            <div className="relative max-w-7xl mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-16"
                >
                    <h2 className="text-4xl md:text-5xl font-bold text-black mb-4" translate="no">
                        Trusted by Industry Leaders
                    </h2>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto" translate="no">
                        Numbers that speak louder than words
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    <Stat
                        value={500}
                        suffix="+"
                        label="Projects Delivered"
                        icon={TrendingUp}
                        color="from-blue-500 to-indigo-600"
                    />
                    <Stat
                        value={98}
                        suffix="%"
                        label="Client Satisfaction"
                        icon={Award}
                        color="from-green-500 to-emerald-600"
                    />
                    <Stat
                        value={50}
                        suffix="+"
                        label="Team Members"
                        icon={Users}
                        color="from-purple-500 to-pink-600"
                    />
                    <Stat
                        value={15}
                        suffix="M+"
                        label="Revenue Generated"
                        prefix="$"
                        icon={DollarSign}
                        color="from-orange-500 to-red-600"
                    />
                </div>
            </div>
        </section>
    )
}

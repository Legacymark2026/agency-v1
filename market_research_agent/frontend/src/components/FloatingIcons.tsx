"use client"

import { motion, useScroll, useTransform } from "framer-motion"
import { Facebook, Instagram, Linkedin, Megaphone, MessageCircle, MousePointer2, Search, Share2, ThumbsUp, Video } from "lucide-react"
import { useRef } from "react"
import { cn } from "@/lib/utils"

const icons = [
    { Icon: Instagram, x: -180, y: -120, delay: 0.2, size: 72, color: "from-pink-500/20 to-purple-500/20" },
    { Icon: Facebook, x: 200, y: -100, delay: 0.5, size: 64, color: "from-blue-500/20 to-indigo-500/20" },
    { Icon: Linkedin, x: -200, y: 140, delay: 0.8, size: 56, color: "from-blue-600/20 to-cyan-500/20" },
    { Icon: Video, x: 180, y: 120, delay: 0.3, size: 80, color: "from-red-500/20 to-pink-500/20" },
    { Icon: Megaphone, x: -100, y: -220, delay: 0.6, size: 88, color: "from-orange-500/20 to-red-500/20" },
    { Icon: MessageCircle, x: 140, y: -200, delay: 0.4, size: 60, color: "from-green-500/20 to-emerald-500/20" },
    { Icon: ThumbsUp, x: 100, y: 220, delay: 0.7, size: 68, color: "from-blue-500/20 to-purple-500/20" },
    { Icon: Search, x: -140, y: 240, delay: 0.5, size: 62, color: "from-yellow-500/20 to-orange-500/20" },
    { Icon: Share2, x: 0, y: -280, delay: 0.9, size: 48, color: "from-gray-500/20 to-slate-500/20" },
    { Icon: MousePointer2, x: 0, y: 280, delay: 0.4, size: 52, color: "from-violet-500/20 to-fuchsia-500/20" },
]

export function FloatingIcons() {
    const containerRef = useRef<HTMLDivElement>(null)
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end start"],
    })

    return (
        <div ref={containerRef} className="absolute inset-0 pointer-events-none overflow-hidden">
            {icons.map(({ Icon, x, y, delay, size, color }, index) => {
                const yOffset = useTransform(scrollYProgress, [0, 1], [0, y * 2.5])
                const xOffset = useTransform(scrollYProgress, [0, 1], [0, x * 2])
                const opacity = useTransform(scrollYProgress, [0, 0.6], [1, 0])
                const rotate = useTransform(scrollYProgress, [0, 1], [0, index % 2 === 0 ? 45 : -45])

                return (
                    <motion.div
                        key={index}
                        className={cn(
                            "absolute left-1/2 top-1/2",
                            "rounded-[32px] backdrop-blur-xl",
                            "border border-white/30",
                            "shadow-[0_8px_32px_rgba(0,0,0,0.12),inset_0_2px_8px_rgba(255,255,255,0.25)]"
                        )}
                        style={{
                            width: size,
                            height: size,
                            x: xOffset,
                            y: yOffset,
                            opacity,
                            rotate,
                        }}
                        animate={{
                            y: [y - 15, y + 15, y - 15],
                        }}
                        transition={{
                            duration: 5 + Math.random() * 3,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: delay,
                        }}
                    >
                        {/* Premium glassmorphism background */}
                        <div className={cn(
                            "relative w-full h-full rounded-[30px] overflow-hidden",
                            "bg-gradient-to-br",
                            color,
                            "border border-white/40"
                        )}>
                            {/* Inner glow */}
                            <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-white/20 to-transparent" />

                            {/* Icon */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Icon
                                    size={size * 0.5}
                                    strokeWidth={1.5}
                                    className="text-gray-800 drop-shadow-sm"
                                />
                            </div>

                            {/* Shine effect */}
                            <motion.div
                                className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-transparent"
                                animate={{
                                    x: ['-100%', '200%'],
                                }}
                                transition={{
                                    duration: 3,
                                    repeat: Infinity,
                                    delay: delay * 2,
                                    ease: "easeInOut",
                                }}
                            />
                        </div>
                    </motion.div>
                )
            })}
        </div>
    )
}

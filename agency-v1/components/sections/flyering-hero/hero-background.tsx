import { memo } from "react";
import { motion, MotionValue, useMotionTemplate } from "framer-motion";
import { Meteors } from "@/components/ui/meteor-card";

interface HeroBackgroundProps {
    mouseX: MotionValue<number>;
    mouseY: MotionValue<number>;
}

export const HeroBackground = memo(function HeroBackground({ mouseX, mouseY }: HeroBackgroundProps) {
    return (
        <>
            {/* Quantum Grid */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <Meteors number={20} />
                <div
                    className="absolute -inset-[100%] bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20 animate-grid-flow transform-gpu perspective-3d rotate-x-60 title-grid"
                    style={{ transform: 'perspective(500px) rotateX(60deg) translateY(-100px) scale(2)' }}
                />
            </div>

            {/* Global Spotlight Follower */}
            <motion.div
                className="pointer-events-none absolute -inset-px opacity-0 transition duration-300 group-hover:opacity-100 z-10"
                style={{
                    background: useMotionTemplate`
                        radial-gradient(
                            600px circle at ${mouseX}px ${mouseY}px,
                            rgba(13, 148, 136, 0.03),
                            transparent 80%
                        )
                    `,
                }}
            />
        </>
    );
});

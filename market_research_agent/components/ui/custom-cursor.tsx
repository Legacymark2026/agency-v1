"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export function CustomCursor() {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const mouseMove = (e: MouseEvent) => {
            setMousePosition({ x: e.clientX, y: e.clientY });
            setIsVisible(true);
        };

        const mouseLeave = () => setIsVisible(false);
        const mouseEnter = () => setIsVisible(true);

        window.addEventListener("mousemove", mouseMove);
        document.body.addEventListener("mouseleave", mouseLeave);
        document.body.addEventListener("mouseenter", mouseEnter);

        return () => {
            window.removeEventListener("mousemove", mouseMove);
            document.body.removeEventListener("mouseleave", mouseLeave);
            document.body.removeEventListener("mouseenter", mouseEnter);
        };
    }, []);

    // Only show on desktop (coarse pointer check)
    if (typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches) {
        return null;
    }

    return (
        <motion.div
            className="fixed top-0 left-0 w-8 h-8 bg-black rounded-full mix-blend-difference pointer-events-none z-[9999]"
            animate={{
                x: mousePosition.x - 16,
                y: mousePosition.y - 16,
                opacity: isVisible ? 1 : 0,
                scale: isVisible ? 1 : 0,
            }}
            transition={{ type: "spring", damping: 30, stiffness: 200, mass: 0.5 }}
        />
    );
}

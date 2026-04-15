"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export function AmbientBackground() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
         
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none bg-white">
            <motion.div
                 
                animate={{
                    x: [0, 100, 0],
                    y: [0, -50, 0],
                    scale: [1, 1.2, 1],
                }}
                transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
                className="absolute -top-[10%] -left-[10%] w-[50vw] h-[50vh] bg-purple-100 rounded-full blur-[100px] opacity-40 mix-blend-multiply"
            />
            <motion.div
                 
                animate={{
                    x: [0, -100, 0],
                    y: [0, 100, 0],
                    scale: [1, 1.5, 1],
                }}
                transition={{
                    duration: 25,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 2,
                }}
                className="absolute top-[20%] -right-[10%] w-[40vw] h-[40vh] bg-blue-100 rounded-full blur-[100px] opacity-40 mix-blend-multiply"
            />
            <motion.div
                 
                animate={{
                    x: [0, 50, 0],
                    y: [0, 50, 0],
                    scale: [1, 1.3, 1],
                }}
                transition={{
                    duration: 30,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 5,
                }}
                className="absolute -bottom-[20%] left-[20%] w-[60vw] h-[60vh] bg-pink-50 rounded-full blur-[120px] opacity-30 mix-blend-multiply"
            />
        </div>
    );
}

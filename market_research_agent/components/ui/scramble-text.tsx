"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

interface ScrambleTextProps {
    text: string;
    className?: string;
    reveal?: boolean; // If true, triggers on mount/in-view. If false, triggers on hover (parent controlled usually)
    speed?: number;
    delay?: number;
}

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+";

export const ScrambleText = ({ text, className, reveal = true, speed = 50, delay = 0 }: ScrambleTextProps) => {
    const [displayText, setDisplayText] = useState(reveal ? "" : text);
    const [isScrambling, setIsScrambling] = useState(false);
    const ref = useRef<HTMLSpanElement>(null);
    const isInView = useInView(ref, { once: true });

    const startScramble = React.useCallback(async () => {
        if (isScrambling) return;
        setIsScrambling(true);

        // Initial delay
        await new Promise((resolve) => setTimeout(resolve, delay));

        let iteration = 0;
        const maxIterations = text.length * 3; // How much "scrambling" before settling

        const interval = setInterval(() => {
            setDisplayText((prev) =>
                text
                    .split("")
                    .map((char, index) => {
                        if (index < iteration / 3) {
                            return text[index];
                        }
                        return CHARS[Math.floor(Math.random() * CHARS.length)];
                    })
                    .join("")
            );

            if (iteration >= maxIterations) {
                clearInterval(interval);
                setDisplayText(text);
                setIsScrambling(false);
            }

            iteration += 1;
        }, speed);
    }, [isScrambling, delay, text, speed]);

    useEffect(() => {
        if (reveal && isInView) {
            startScramble();
        }
    }, [reveal, isInView, startScramble]);

    return (
        <span ref={ref} className={className} onMouseEnter={!reveal ? startScramble : undefined}>
            {displayText}
        </span>
    );
};

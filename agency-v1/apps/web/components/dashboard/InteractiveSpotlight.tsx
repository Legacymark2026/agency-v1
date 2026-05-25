"use client";

import React, { useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface InteractiveSpotlightProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    glowColor?: string; // Default to the teal theme color with low opacity
}

export function InteractiveSpotlight({
    children,
    className,
    glowColor = "rgba(13, 148, 136, 0.08)",
    ...props
}: InteractiveSpotlightProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [opacity, setOpacity] = useState(0);
    const [position, setPosition] = useState({ x: 0, y: 0 });

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        setPosition({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        });
        setOpacity(1);
    };

    const handleMouseLeave = () => {
        setOpacity(0);
    };

    return (
        <div
            ref={containerRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className={cn("relative overflow-hidden", className)}
            {...props}
        >
            {/* Spotlight overlay */}
            <div
                className="pointer-events-none absolute inset-0 transition-opacity duration-300 ease-out"
                style={{
                    opacity,
                    background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, ${glowColor}, transparent 40%)`,
                    zIndex: 0,
                }}
            />
            {/* Content wrapper */}
            <div className="relative z-10 w-full h-full">{children}</div>
        </div>
    );
}

"use client";

import { cn } from "@/lib/utils";
import React, { useEffect, useState } from "react";

export const MeteorCard = ({
    className,
    children,
}: {
    className?: string;
    children: React.ReactNode;
}) => {
    return (
        <div className={cn("relative w-full overflow-hidden rounded-2xl border border-gray-800 bg-gray-900/50 p-8", className)}>
            <div className="absolute inset-0 h-full w-full bg-gradient-to-br from-teal-500/10 to-emerald-500/10" />
            <div className="relative z-10">{children}</div>
            <Meteors number={20} />
        </div>
    );
};

export const Meteors = ({ number = 20 }: { number?: number }) => {
    const [meteorStyles, setMeteorStyles] = useState<Array<React.CSSProperties>>([]);

    useEffect(() => {
        const styles = [...new Array(number)].map(() => ({
            top: 0,
            left: Math.floor(Math.random() * (400 - -400) + -400) + "px",
            animationDelay: Math.random() * (0.8 - 0.2) + 0.2 + "s",
            animationDuration: Math.floor(Math.random() * (10 - 2) + 2) + "s",
        }));
        setMeteorStyles(styles);
    }, [number]);

    return (
        <>
            {meteorStyles.map((style, idx) => (
                <span
                    key={"meteor" + idx}
                    className={cn(
                        "animate-meteor-effect absolute top-1/2 left-1/2 h-0.5 w-0.5 rounded-[9999px] bg-teal-200 shadow-[0_0_0_1px_#ffffff10] rotate-[215deg]",
                        "before:content-[''] before:absolute before:top-1/2 before:transform before:-translate-y-[50%] before:w-[50px] before:h-[1px] before:bg-gradient-to-r before:from-teal-400 before:to-transparent"
                    )}
                    style={style}
                ></span>
            ))}
        </>
    );
};

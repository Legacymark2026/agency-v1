"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export function IAStatus() {
    const [activeAgents, setActiveAgents] = useState(4);
    const [ticks, setTicks] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setTicks(t => t + 1);
            // Simulate agent fluctuation
            if (ticks % 10 === 0) {
                 setActiveAgents(prev => prev === 4 ? 3 : 4);
            }
        }, 500);
        return () => clearInterval(interval);
    }, [ticks]);

    return (
        <div className="flex items-center gap-3 rounded-full border border-teal-500/20 bg-teal-950/20 px-4 py-2 backdrop-blur-sm">
            <div className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-teal-500"></span>
            </div>
            <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-widest text-teal-500">
                    IA Agents Activos
                </span>
                <div className="flex items-center gap-1.5 font-mono text-[10px] text-teal-400/80">
                    <span>{activeAgents}</span>
                    <span className="h-px w-2 bg-teal-500/20" />
                    <motion.span
                        key={ticks}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-white"
                    >
                        Optimizando_
                    </motion.span>
                    <motion.span
                         key={`dot-${ticks}`}
                         animate={{ opacity: [0, 1, 0] }}
                         transition={{ repeat: Infinity, duration: 0.8 }}
                    >
                        .
                    </motion.span>
                     <motion.span
                         key={`dot2-${ticks}`}
                         animate={{ opacity: [0, 1, 0] }}
                         transition={{ repeat: Infinity, duration: 0.8, delay: 0.2 }}
                    >
                        .
                    </motion.span>
                     <motion.span
                         key={`dot3-${ticks}`}
                         animate={{ opacity: [0, 1, 0] }}
                         transition={{ repeat: Infinity, duration: 0.8, delay: 0.4 }}
                    >
                        .
                    </motion.span>
                </div>
            </div>
        </div>
    );
}
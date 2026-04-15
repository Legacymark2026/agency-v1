"use client";

import { motion } from "framer-motion";

const TECH_STACK = [
    { name: "React / Next.js", category: "Frontend", icon: "⚛️" },
    { name: "TypeScript", category: "Language", icon: "TS" },
    { name: "Python", category: "Backend/AI", icon: "🐍" },
    { name: "n8n", category: "Automation", icon: "⚡" },
    { name: "OpenAI API", category: "AI Models", icon: "🤖" },
    { name: "Supabase", category: "Database", icon: "🔥" },
    { name: "Vercel", category: "Cloud", icon: "▲" },
    { name: "Tailwind", category: "Styling", icon: "🎨" },
];

export function TechStackShowcase() {
    return (
        <section className="py-24 bg-black text-white overflow-hidden">
            <div className="mx-auto max-w-7xl px-4 text-center mb-16">
                <h2 className="text-3xl font-bold mb-4">Nuestro Arsenal Tecnológico</h2>
                <p className="text-gray-400">Herramientas modernas para soluciones escalables.</p>
            </div>

            <div className="flex flex-wrap justify-center gap-8 max-w-5xl mx-auto">
                {TECH_STACK.map((tech, index) => (
                    <motion.div
                        key={tech.name}
                        initial={{ opacity: 0, scale: 0.8 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ y: -5, boxShadow: "0 0 20px rgba(255,255,255,0.2)" }}
                        className="flex flex-col items-center justify-center w-32 h-32 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm cursor-default"
                    >
                        <span className="text-4xl mb-2">{tech.icon}</span>
                        <span className="text-sm font-semibold">{tech.name}</span>
                        <span className="text-xs text-gray-500 mt-1">{tech.category}</span>
                    </motion.div>
                ))}
            </div>
        </section>
    );
}

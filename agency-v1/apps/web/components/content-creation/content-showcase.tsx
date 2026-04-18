"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Instagram,
    Linkedin,
    Youtube,
    Twitter,
    Video,
    FileText,
    Image as ImageIcon,
    BarChart,
    CheckCircle,
    Play
} from "lucide-react";

const contentTypes = [
    { id: "all", label: "Todos" },
    { id: "video", label: "Video Short-Form" },
    { id: "graphics", label: "Diseño Gráfico" },
    { id: "copy", label: "Copywriting" }
];

const portfolioItems = [
    {
        id: 1,
        type: "video",
        title: "Viral TikTok Campaign",
        stats: "2.4M Views",
        color: "from-pink-500 to-rose-500",
        size: "col-span-2 row-span-2",
        icon: <Video className="w-6 h-6" />
    },
    {
        id: 2,
        type: "graphics",
        title: "Brand Identity",
        stats: "Re-brand",
        color: "from-purple-500 to-indigo-500",
        size: "col-span-1 row-span-1",
        icon: <ImageIcon className="w-6 h-6" />
    },
    {
        id: 3,
        type: "copy",
        title: "Email Sequence",
        stats: "45% Open Rate",
        color: "from-blue-400 to-cyan-400",
        size: "col-span-1 row-span-1",
        icon: <FileText className="w-6 h-6" />
    },
    {
        id: 4,
        type: "video",
        title: "Product Reel",
        stats: "High Conversion",
        color: "from-orange-400 to-red-500",
        size: "col-span-1 row-span-2",
        icon: <Play className="w-6 h-6" />
    },
    {
        id: 5,
        type: "graphics",
        title: "Infographics",
        stats: "12k Shares",
        color: "from-emerald-400 to-teal-500",
        size: "col-span-1 row-span-1",
        icon: <BarChart className="w-6 h-6" />
    }
];

export default function ContentShowcase() {
    const [activeFilter, setActiveFilter] = useState("all");
    const [hoveredItem, setHoveredItem] = useState<number | null>(null);

    const filteredItems = activeFilter === "all"
        ? portfolioItems
        : portfolioItems.filter(item => item.type === activeFilter);

    return (
        <section className="py-20 bg-white relative">
            <div className="container px-4 md:px-6">
                <div className="text-center mb-16 relative">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-teal-500/10 blur-[100px] rounded-full pointer-events-none mix-blend-multiply"></div>

                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-3xl md:text-5xl font-bold mb-8 text-slate-900 relative z-10"
                    >
                        Showcase de Impacto
                    </motion.h2>

                    <div className="flex flex-wrap justify-center gap-2 p-1 bg-slate-100/80 backdrop-blur-md rounded-full inline-flex border border-slate-200 relative z-10">
                        {contentTypes.map((type) => (
                            <button
                                key={type.id}
                                onClick={() => setActiveFilter(type.id)}
                                className={`relative px-6 py-2 rounded-full text-sm font-medium transition-colors duration-300 z-10 ${activeFilter === type.id ? "text-white" : "text-slate-500 hover:text-slate-900"
                                    }`}
                            >
                                {activeFilter === type.id && (
                                    <motion.div
                                        layoutId="activeFilter"
                                        className="absolute inset-0 bg-gradient-to-r from-teal-500 to-sky-500 rounded-full -z-10 shadow-lg shadow-teal-500/30"
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    />
                                )}
                                {type.label}
                            </button>
                        ))}
                    </div>
                </div>

                <motion.div
                    layout
                    className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 auto-rows-[200px]"
                >
                    <AnimatePresence mode="popLayout">
                        {filteredItems.map((item) => (
                            <motion.div
                                key={item.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
                                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                                exit={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
                                transition={{ duration: 0.4 }}
                                className={`relative group rounded-3xl overflow-hidden cursor-pointer ${item.size} bg-gradient-to-br ${item.color} p-[1px] shadow-lg shadow-slate-200/50 hover:shadow-xl hover:shadow-slate-300/50 transition-shadow`}
                                onMouseEnter={() => setHoveredItem(item.id)}
                                onMouseLeave={() => setHoveredItem(null)}
                            >
                                {/* Gradient Border Content Wrapper */}
                                <div className="h-full w-full bg-white rounded-[23px] relative overflow-hidden">

                                    {/* Background Pattern */}
                                    <div className="absolute inset-0 opacity-10 bg-[url('/grid-pattern.svg')] group-hover:scale-110 transition-transform duration-700"></div>
                                    <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}></div>

                                    {/* Content Overlay */}
                                    <div className="absolute inset-0 p-6 flex flex-col justify-between z-10">
                                        <div className="flex justify-between items-start">
                                            <div className="p-3 bg-slate-50 backdrop-blur-md rounded-2xl border border-slate-100 group-hover:bg-white transition-colors shadow-sm text-slate-700">
                                                {item.icon}
                                            </div>
                                            {item.id === 1 && (
                                                <span className="px-3 py-1 bg-rose-500 text-white text-xs font-bold tracking-widest uppercase rounded-full animate-pulse shadow-lg shadow-rose-500/30">
                                                    HOT
                                                </span>
                                            )}
                                        </div>

                                        <div>
                                            <h3 className="text-2xl font-bold text-slate-800 mb-1 translate-y-4 group-hover:translate-y-0 transition-transform duration-300 ease-out">
                                                {item.title}
                                            </h3>
                                            <p className="text-teal-600 font-medium opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-4 group-hover:translate-y-0 delay-75">
                                                {item.stats}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Hover Reveal Button */}
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 scale-50 group-hover:scale-100 rotate-45 group-hover:rotate-0">
                                        <button className="w-16 h-16 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold shadow-xl hover:scale-110 transition-transform">
                                            Ver
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </motion.div>

                {/* Platform Icons */}
                <div className="mt-20 flex justify-center gap-8 md:gap-16 opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
                    {[Instagram, Linkedin, Youtube, Twitter].map((Icon, i) => (
                        <div key={i} className="group relative">
                            <Icon className="w-8 h-8 md:w-12 md:h-12 text-slate-400 group-hover:text-teal-500 transition-colors" />
                            <div className="absolute -inset-4 bg-teal-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

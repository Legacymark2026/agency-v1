"use client";

import { Phone, Mail, Clock, Star, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function TopBar() {
    const pathname = usePathname();
    const isMarketingPage = pathname === "/" || pathname?.startsWith("/contacto") || pathname?.startsWith("/blog") || pathname?.startsWith("/nosotros") || pathname?.startsWith("/metodologia") || pathname?.startsWith("/portfolio") || pathname?.startsWith("/tarifario") || pathname?.startsWith("/flyering") || pathname?.startsWith("/soluciones");

    return (
        <div className="w-full bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-xs text-slate-300 relative overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-1/2 -left-1/4 w-1/2 h-full bg-gradient-to-r from-teal-500/5 to-transparent rounded-full blur-3xl" />
                <div className="absolute -bottom-1/2 -right-1/4 w-1/2 h-full bg-gradient-to-l from-emerald-500/5 to-transparent rounded-full blur-3xl" />
            </div>

            <div className="max-w-7xl mx-auto px-4">
                {/* Main Top Bar */}
                <div className="flex items-center justify-between h-10">
                    {/* Left: Trust Badges */}
                    <div className="hidden md:flex items-center gap-6">
                        <motion.div 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center gap-2"
                        >
                            <div className="flex items-center justify-center w-5 h-5 rounded-full bg-teal-500/20">
                                <svg className="w-3 h-3 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <span>_startup <span className="text-teal-400 font-bold">innovador</span></span>
                        </motion.div>

                        <div className="w-px h-4 bg-slate-700" />

                        <motion.div 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                            className="flex items-center gap-2"
                        >
                            <div className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/20">
                                <svg className="w-3 h-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                            </div>
                            <span>Calidad <span className="text-emerald-400 font-medium">garantizada</span></span>
                        </motion.div>

                        <div className="hidden lg:block w-px h-4 bg-slate-700" />

                        <motion.div 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className="hidden lg:flex items-center gap-2"
                        >
                            <div className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-500/20">
                                <Clock className="w-3 h-3 text-amber-400" />
                            </div>
                            <span>Respuesta <span className="text-amber-400 font-medium">&lt; 2 min</span></span>
                        </motion.div>
                    </div>

                    {/* Right: Contact Info */}
                    <div className="flex items-center gap-4">
                        <motion.a 
                            href="tel:+573223047353"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            whileHover={{ scale: 1.05 }}
                            className="flex items-center gap-2 hover:text-teal-400 transition-colors group"
                        >
                            <Phone className="w-3.5 h-3.5 text-teal-500 group-hover:text-teal-400" />
                            <span className="hidden sm:inline font-medium">+57 322 304 7353</span>
                        </motion.a>

                        <div className="hidden sm:block w-px h-4 bg-slate-700" />

                        <motion.a 
                            href="mailto:gerencia@legacymarksas.com"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            whileHover={{ scale: 1.05 }}
                            className="hidden md:flex items-center gap-2 hover:text-teal-400 transition-colors group"
                        >
                            <Mail className="w-3.5 h-3.5 text-emerald-500 group-hover:text-emerald-400" />
                            <span className="hidden lg:inline font-medium">gerencia@legacymarksas.com</span>
                        </motion.a>

                        <div className="hidden md:block w-px h-4 bg-slate-700" />

                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="hidden lg:flex items-center gap-2"
                        >
                            <Clock className="w-3.5 h-3.5 text-amber-500" />
                            <span>Lun-Vie <span className="text-slate-100 font-medium">9am-6pm</span></span>
                        </motion.div>

                        {/* CTA Button */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3 }}
                            className="ml-2"
                        >
                            <Link 
                                href="/contacto"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-teal-500 to-emerald-500 text-white text-[10px] font-bold rounded-full hover:shadow-lg hover:shadow-teal-500/30 transition-all hover:scale-105"
                            >
                                <span>Contáctanos</span>
                                <ChevronRight className="w-3 h-3" />
                            </Link>
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* Bottom subtle gradient line */}
            <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-teal-500/50 to-transparent" />
        </div>
    );
}
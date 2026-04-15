"use client"

import { motion, useScroll, useMotionValueEvent, AnimatePresence } from "framer-motion"
import { useState } from "react"
import { Menu, X, ArrowRight } from "lucide-react"

export function Navbar() {
    const [hidden, setHidden] = useState(false)
    const { scrollY } = useScroll()
    const [scrolled, setScrolled] = useState(false)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    useMotionValueEvent(scrollY, "change", (latest) => {
        const previous = scrollY.getPrevious() ?? 0
        if (latest > previous && latest > 150) {
            setHidden(true)
        } else {
            setHidden(false)
        }
        setScrolled(latest > 50)
    })

    const navVariants = {
        visible: { y: 0, opacity: 1 },
        hidden: { y: -20, opacity: 0 },
    }

    return (
        <>
            <motion.nav
                variants={navVariants}
                animate={hidden ? "hidden" : "visible"}
                transition={{ duration: 0.35, ease: "easeInOut" }}
                className={`fixed top-6 left-0 right-0 z-50 flex justify-center pointer-events-none`}
            >
                <div
                    className={`pointer-events-auto transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${scrolled
                            ? "w-auto px-6 py-3 bg-white/80 backdrop-blur-md rounded-full border border-white/20 shadow-lg shadow-black/5"
                            : "w-full max-w-7xl px-6 py-6 bg-transparent"
                        }`}
                >
                    <div className="flex items-center justify-between gap-8">
                        {/* Logo */}
                        <div className="flex items-center gap-2 font-bold text-xl tracking-tight z-50">
                            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white">
                                <span className="font-bold">A</span>
                            </div>
                            <span className={`${scrolled ? "hidden md:inline" : "inline"}`}>Agency.</span>
                        </div>

                        {/* Desktop Links - Dynamic visibility */}
                        <div className="hidden md:flex items-center gap-1 bg-gray-100/50 p-1 rounded-full border border-gray-200/50">
                            {["Services", "Work", "About", "Blog", "Tarifario"].map((item) => (
                                <a
                                    key={item}
href={item === "Tarifario" ? "/tarifario" : "#"}
                                    className="px-4 py-1.5 rounded-full text-sm font-medium text-gray-600 hover:text-black hover:bg-white transition-all hover:shadow-sm"
                                >
                                    {item}
                                </a>
                            ))}
                        </div>

                        {/* CTA Button */}
                        <div className="hidden md:flex items-center gap-4">
                            {!scrolled && (
                                <a href="#" className="text-sm font-semibold text-gray-900 hover:text-gray-600">
                                    Login
                                </a>
                            )}
                            <button className="group px-5 py-2 bg-black text-white text-sm font-semibold rounded-full hover:bg-gray-800 transition-all shadow-lg shadow-black/20 hover:scale-105 active:scale-95 flex items-center gap-2">
                                Get Started
                                <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                            </button>
                        </div>

                        {/* Mobile Menu Toggle */}
                        <button
                            className="md:hidden pointer-events-auto p-2 rounded-full hover:bg-gray-100 bg-white shadow-sm border border-gray-100"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        >
                            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </motion.nav>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-4 z-40 bg-white rounded-3xl shadow-2xl overflow-hidden md:hidden border border-gray-100"
                    >
                        <div className="p-6 flex flex-col h-full">
                            <div className="flex justify-between items-center mb-12">
                                <span className="text-xl font-bold">Menu</span>
                                <button
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="p-2 bg-gray-50 rounded-full"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="flex flex-col gap-4 text-2xl font-medium">
                                <a href="#" onClick={() => setMobileMenuOpen(false)}>Services</a>
                                <a href="#" onClick={() => setMobileMenuOpen(false)}>Work</a>
                                <a href="#" onClick={() => setMobileMenuOpen(false)}>About</a>
                                <a href="#" onClick={() => setMobileMenuOpen(false)}>Contact</a>
                                <a href="/tarifario" onClick={() => setMobileMenuOpen(false)}>Tarifario</a>
                            </div>
                            <div className="mt-auto space-y-4">
                                <button className="w-full py-4 bg-black text-white rounded-xl font-semibold text-lg">
                                    Get Started
                                </button>
                                <button className="w-full py-4 bg-gray-50 text-black rounded-xl font-semibold text-lg">
                                    Login
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}

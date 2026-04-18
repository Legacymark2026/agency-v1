"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import {
    ArrowRight, TrendingUp, Target, Share2,
    BarChart3, Users, CheckCircle2,
    Search, MousePointerClick, RefreshCcw
} from "lucide-react";
import Link from "next/link";
import { motion, useScroll, useTransform, useSpring, useInView, useMotionValue, useMotionTemplate } from "framer-motion";
import { useRef, useEffect, useState } from "react";

// --- Advanced Visual Components ---

// 1. Spotlight Effect Card
function SpotlightCard({ children, className = "" }: { children: React.ReactNode, className?: string }) {
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
        const { left, top } = currentTarget.getBoundingClientRect();
        mouseX.set(clientX - left);
        mouseY.set(clientY - top);
    }

    return (
        <div
            className={`group relative border border-slate-800 bg-slate-900/50 overflow-hidden ${className}`}
            onMouseMove={handleMouseMove}
        >
            <motion.div
                className="pointer-events-none absolute -inset-px opacity-0 transition duration-300 group-hover:opacity-100"
                style={{
                    background: useMotionTemplate`
                        radial-gradient(
                            650px circle at ${mouseX}px ${mouseY}px,
                            rgba(20, 184, 166, 0.15),
                            transparent 80%
                        )
                    `,
                }}
            />
            <div className="relative h-full">{children}</div>
        </div>
    );
}

// 2. Animated Counter
const Counter = ({ value, label, prefix = "", suffix = "" }: { value: number, label: string, prefix?: string, suffix?: string }) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });
    const springValue = useSpring(0, { duration: 3000, bounce: 0 });
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
        if (isInView) {
            springValue.set(value);
        }
    }, [isInView, value, springValue]);

    useEffect(() => {
        return springValue.on("change", (latest) => {
            setDisplayValue(Math.floor(latest));
        });
    }, [springValue]);

    return (
        <motion.div
            ref={ref}
            whileHover={{ scale: 1.05 }}
            className="text-center group p-6 rounded-2xl bg-slate-900/30 border border-slate-800 hover:border-teal-500/30 transition-all cursor-default"
        >
            <div className="text-4xl md:text-5xl font-bold text-white mb-2 font-mono group-hover:text-teal-400 transition-colors">
                {prefix}{displayValue.toLocaleString()}{suffix}
            </div>
            <div className="text-sm font-medium text-slate-500 uppercase tracking-widest group-hover:text-slate-300 transition-colors">{label}</div>
        </motion.div>
    );
};

// 3. Floating Data Particles
const FloatingParticle = ({ delay = 0, xRange = 100, yRange = 100, size = 10, color = "bg-teal-500" }: { delay?: number, xRange?: number, yRange?: number, size?: number, color?: string }) => {
    const [duration, setDuration] = useState(15);

    useEffect(() => {
        const timeout = setTimeout(() => setDuration(Math.random() * 10 + 10), 0);
        return () => clearTimeout(timeout);
    }, []);

    return (
        <motion.div
            animate={{
                x: [0, xRange, -xRange, 0],
                y: [0, yRange, -yRange, 0],
                opacity: [0.2, 0.5, 0.2],
                scale: [1, 1.2, 1],
            }}
            transition={{
                duration: duration,
                repeat: Infinity,
                delay: delay,
                ease: "linear",
            }}
            className={`absolute rounded-full blur-md ${color}`}
            style={{ width: size, height: size }}
        />
    );
};


// 4. Growth Loop Visualization (Enhanced)
const GrowthLoop = () => {
    return (
        <div className="relative w-full max-w-lg aspect-square mx-auto perspective-1000">
            {/* Spinning Rings with 3D effect */}
            <motion.div
                animate={{ rotateX: [0, 10, 0], rotateY: [0, 10, 0], rotateZ: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 rounded-full border border-dashed border-slate-700/50"
            />
            <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                className="absolute inset-8 rounded-full border border-dotted border-teal-500/20"
            />

            {/* Core */}
            <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="w-32 h-32 bg-slate-900 rounded-full border border-teal-500/50 flex items-center justify-center shadow-[0_0_50px_rgba(20,184,166,0.2)] z-10 relative group cursor-pointer"
                >
                    <div className="absolute inset-0 bg-teal-500/10 rounded-full animate-ping opacity-20" />
                    <RefreshCcw size={40} className="text-teal-400 group-hover:rotate-180 transition-transform duration-700" />
                </motion.div>
            </div>

            {/* Nodes */}
            {[
                { icon: Search, label: "Attract", angle: 0, color: "text-blue-400", border: "border-blue-500/30" },
                { icon: MousePointerClick, label: "Convert", angle: 90, color: "text-purple-400", border: "border-purple-500/30" },
                { icon: RefreshCcw, label: "Retain", angle: 180, color: "text-green-400", border: "border-green-500/30" },
                { icon: Users, label: "Refer", angle: 270, color: "text-amber-400", border: "border-amber-500/30" },
            ].map((node, i) => (
                <motion.div
                    key={i}
                    className={`absolute w-16 h-16 bg-slate-900 rounded-2xl border ${node.border} flex items-center justify-center shadow-lg cursor-pointer z-20`}
                    style={{
                        top: "50%",
                        left: "50%",
                        marginLeft: -32,
                        marginTop: -32,
                        transform: `rotate(${node.angle}deg) translate(140px) rotate(-${node.angle}deg)`
                    }}
                    whileHover={{ scale: 1.2, backgroundColor: "#0f172a" }}
                    initial={{ opacity: 0, scale: 0 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.2 }}
                >
                    <node.icon size={24} className={node.color} />
                    <div className="absolute -bottom-8 text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-900 px-2 py-0.5 rounded border border-slate-800">{node.label}</div>
                </motion.div>
            ))}
        </div>
    );
};

export default function ServicesPage() {
    const targetRef = useRef(null);
    const { scrollYProgress } = useScroll();

    // Parallax & Scale Transforms
    const heroOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);
    const heroScale = useTransform(scrollYProgress, [0, 0.3], [1, 0.95]);
    const rotateBg = useTransform(scrollYProgress, [0, 1], [0, 45]);

    return (
        <main className="bg-slate-950 selection:bg-teal-500 selection:text-white overflow-hidden text-white w-full">

            {/* 5. Scroll Progress Bar */}
            <motion.div
                className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 via-blue-500 to-purple-500 origin-left z-50"
                style={{ scaleX: scrollYProgress }}
            />

            {/* 1. HERO SECTION: "Marketing is Math" */}
            <section ref={targetRef} className="relative min-h-screen flex items-center justify-center pt-24 pb-20 overflow-hidden bg-slate-950 perspective-1000">
                {/* 6. Dynamic Background Grid with Rotation */}
                <motion.div
                    style={{ rotate: rotateBg, scale: 1.5 }}
                    className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03] bg-center pointer-events-none"
                />

                {/* 7. Floating Particles Background */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <FloatingParticle delay={0} xRange={200} yRange={100} size={300} color="bg-teal-500/10" />
                    <FloatingParticle delay={2} xRange={-150} yRange={200} size={250} color="bg-blue-600/10" />
                    <FloatingParticle delay={4} xRange={100} yRange={-150} size={200} color="bg-purple-600/10" />
                </div>

                {/* 8. Floating Analytics Dashboard (Left) - Enhanced */}
                <motion.div
                    initial={{ x: -100, opacity: 0, rotateY: 20 }}
                    animate={{ x: 0, opacity: 1, rotateY: 10 }} // Slight persistent tilt
                    transition={{ duration: 1, delay: 0.5 }}
                    className="absolute left-[3%] top-[25%] w-72 p-5 bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl hidden xl:block shadow-2xl hover:rotate-y-0 transition-transform duration-500"
                >
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-xs font-mono text-slate-400">LIVE_ROAS_TRACKER</span>
                        <div className="flex gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-red-500/50" />
                            <div className="w-2 h-2 rounded-full bg-yellow-500/50" />
                            <div className="w-2 h-2 rounded-full bg-green-500/50" />
                        </div>
                    </div>
                    <div className="flex justify-between items-end mb-2">
                        <span className="text-sm font-bold text-slate-300">Facebook Ads</span>
                        <span className="text-sm font-bold text-green-400">+124%</span>
                    </div>
                    <div className="h-24 w-full flex items-end gap-1.5 ">
                        {[30, 45, 35, 60, 50, 75, 65, 80, 70, 95].map((h, i) => (
                            <motion.div
                                key={i}
                                initial={{ height: 0 }}
                                animate={{ height: `${h}%` }}
                                transition={{ duration: 1, delay: 1 + (i * 0.1) }}
                                className="flex-1 bg-gradient-to-t from-teal-500/20 to-teal-400 rounded-t-sm hover:from-teal-400 hover:to-white transition-all cursor-pointer"
                            />
                        ))}
                    </div>
                </motion.div>

                {/* 9. Floating Leads Card (Right) - Enhanced */}
                <motion.div
                    initial={{ x: 100, opacity: 0, rotateY: -20 }}
                    animate={{ x: 0, opacity: 1, rotateY: -10 }}
                    transition={{ duration: 1, delay: 0.7 }}
                    className="absolute right-[3%] bottom-[25%] w-72 p-5 bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl hidden xl:block shadow-2xl hover:rotate-y-0 transition-transform duration-500"
                >
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)]"><Users size={20} /></div>
                        <div>
                            <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">New Leads</div>
                            <div className="text-xl font-bold text-white tabular-nums">2,845</div>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs text-slate-400">
                            <span>Conversion Rate</span>
                            <span className="text-white font-bold">4.2%</span>
                        </div>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: "75%" }}
                                transition={{ duration: 1.5, delay: 1.5 }}
                                className="h-full bg-gradient-to-r from-blue-600 to-blue-400"
                            />
                        </div>
                    </div>
                </motion.div>


                <motion.div style={{ opacity: heroOpacity, scale: heroScale }} className="container relative z-10 mx-auto px-6 lg:px-8 text-center max-w-5xl">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-teal-500/30 bg-teal-950/30 backdrop-blur-md shadow-[0_0_15px_rgba(20,184,166,0.3)] mb-8 hover:shadow-[0_0_25px_rgba(20,184,166,0.5)] transition-shadow cursor-default"
                    >
                        <BarChart3 size={14} className="text-teal-400" />
                        <span className="text-teal-300 text-xs font-mono font-medium uppercase tracking-widest">Growth Hacking & Strategy</span>
                    </motion.div>

                    {/* 10. Gradient Text Reveal */}
                    <h1 className="text-5xl lg:text-8xl font-bold tracking-tighter text-white mb-8 leading-[1.05]">
                        <motion.span
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="block"
                        >
                            El Marketing no es
                        </motion.span>
                        <motion.span
                            initial={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
                            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                            transition={{ duration: 0.8, delay: 0.4 }}
                            className="block mt-2 text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-emerald-400 to-blue-500 animate-gradient-x bg-[length:200%_auto]"
                        >
                            Magia. Es Matemática.
                        </motion.span>
                    </h1>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 1, delay: 0.6 }}
                        className="text-xl lg:text-2xl text-slate-400 mb-12 max-w-3xl mx-auto leading-relaxed font-light"
                    >
                        Dejamos las &quot;corazonadas&quot; para otros.
                        Nosotros usamos <span className="text-white font-medium border-b border-teal-500/50">datos, experimentos y tecnología</span> para escalar tus ingresos de forma predecible.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.8 }}
                        className="flex flex-col sm:flex-row justify-center gap-6"
                    >
                        <Link href="/contacto">
                            <Button size="lg" className="h-16 px-10 rounded-full bg-teal-500 text-white hover:bg-teal-400 text-lg font-bold shadow-[0_0_40px_-10px_rgba(20,184,166,0.5)] transition-all hover:scale-105 active:scale-95">
                                Escalar ROI <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                        </Link>
                        <Link href="#methodology">
                            <Button variant="outline" size="lg" className="h-16 px-10 rounded-full border-slate-700 bg-slate-900/50 backdrop-blur text-slate-300 hover:bg-slate-800 hover:text-white hover:border-teal-500/50 text-lg transition-all hover:-translate-y-1">
                                Ver Metodología
                            </Button>
                        </Link>
                    </motion.div>
                </motion.div>
            </section>

            {/* 2. RESULTS METRICS - "Proof of Work" */}
            <section className="py-20 bg-slate-900 border-y border-slate-800 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] pointer-events-none" />
                <div className="container mx-auto px-6 lg:px-8 relative z-10">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
                        <Counter value={25} label="Millones $ Gestionados" prefix="$" suffix="M+" />
                        <Counter value={450} label="ROI Promedio %" suffix="%" />
                        <Counter value={120} label="Nichos Dominados" suffix="+" />
                        <Counter value={98} label="Tasa de Retención" suffix="%" />
                    </div>
                </div>
            </section>

            {/* 3. SERVICE ECOSYSTEM - 3-Col Layout with SpotlightCards */}
            <section className="py-32 bg-slate-950">
                <div className="container mx-auto px-6 lg:px-8">
                    <div className="text-center mb-24">
                        <h2 className="text-4xl font-bold text-white mb-6">Ecosistema de Crecimiento</h2>
                        <p className="text-xl text-slate-400 max-w-2xl mx-auto">
                            No ejecutamos tácticas aisladas. Construimos sistemas integrales donde cada canal potencia al otro.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Paid Media - Blue */}
                        <SpotlightCard className="p-8 rounded-[2rem] hover:border-blue-500/50 transition-colors">
                            <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 mb-8 border border-blue-500/20 group-hover:bg-blue-500 group-hover:text-white transition-colors duration-500">
                                <Target size={32} />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-blue-400 transition-colors">Paid Media (Ads)</h3>
                            <p className="text-slate-400 mb-8 leading-relaxed">
                                Cortamos el ruido y vamos directo a tu cliente ideal. Algoritmos predictivos y creativos persuasivos.
                            </p>
                            <ul className="space-y-4">
                                {["Meta Ads (Facebook/Instagram)", "Google Ads Search & Display", "LinkedIn B2B Lead Gen", "TikTok Ads Viral"].map((item, i) => (
                                    <li key={i} className="flex gap-3 text-sm text-slate-300 group-hover:text-white transition-colors">
                                        <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </SpotlightCard>

                        {/* SEO - Green */}
                        <SpotlightCard className="p-8 rounded-[2rem] hover:border-green-500/50 transition-colors">
                            <div className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-400 mb-8 border border-green-500/20 group-hover:bg-green-500 group-hover:text-white transition-colors duration-500">
                                <TrendingUp size={32} />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-green-400 transition-colors">SEO & Contenido</h3>
                            <p className="text-slate-400 mb-8 leading-relaxed">
                                Dominio orgánico a largo plazo. Convertimos tu marca en la autoridad indiscutible de tu sector.
                            </p>
                            <ul className="space-y-4">
                                {["Auditoría Técnica SEO", "Estrategia de Linkbuilding", "Marketing de Contenidos", "Optimización de Conversión (CRO)"].map((item, i) => (
                                    <li key={i} className="flex gap-3 text-sm text-slate-300 group-hover:text-white transition-colors">
                                        <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </SpotlightCard>

                        {/* Strategy - Purple */}
                        <SpotlightCard className="p-8 rounded-[2rem] hover:border-purple-500/50 transition-colors">
                            <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400 mb-8 border border-purple-500/20 group-hover:bg-purple-500 group-hover:text-white transition-colors duration-500">
                                <Share2 size={32} />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-purple-400 transition-colors">Estrategia & CRM</h3>
                            <p className="text-slate-400 mb-8 leading-relaxed">
                                No solo traemos leads, te ayudamos a cerrarlos. Automatización de ventas y nutrición de clientes.
                            </p>
                            <ul className="space-y-4">
                                {["Implementación CRM", "Email Marketing Automations", "Lead Scoring & Nurturing", "Consultoría de Ventas"].map((item, i) => (
                                    <li key={i} className="flex gap-3 text-sm text-slate-300 group-hover:text-white transition-colors">
                                        <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </SpotlightCard>
                    </div>
                </div>
            </section>

            {/* 4. THE GROWTH LOOP - Visualization */}
            <section id="methodology" className="py-32 bg-slate-900 overflow-hidden relative">
                <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-teal-500/5 rounded-full blur-[120px] pointer-events-none" />

                <div className="container mx-auto px-6 lg:px-8">
                    <div className="grid lg:grid-cols-2 gap-20 items-center">
                        <div>
                            <Badge variant="outline" className="mb-6 border-teal-500/30 bg-teal-500/10 text-teal-300">
                                Nuestra Metodología
                            </Badge>
                            <h2 className="text-4xl md:text-5xl font-bold text-white mb-8 leading-tight">
                                El Ciclo de <br />
                                <span className="text-teal-400">Optimización Infinita.</span>
                            </h2>
                            <p className="text-lg text-slate-400 mb-10 leading-relaxed border-l-2 border-slate-700 pl-6">
                                El marketing no es lineal. Es un ciclo constante de experimentación, aprendizaje y mejora.
                                Aplicamos la filosofía Lean Startup a tus campañas.
                            </p>

                            <div className="space-y-8">
                                <motion.div
                                    whileHover={{ x: 10 }}
                                    className="flex gap-6 group cursor-default"
                                >
                                    <div className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center text-teal-400 font-bold border border-teal-500/20 shrink-0 text-xl group-hover:bg-teal-500 group-hover:text-white transition-colors">1</div>
                                    <div>
                                        <h4 className="text-xl font-bold text-white mb-2 group-hover:text-teal-400 transition-colors">Hipótesis de Datos</h4>
                                        <p className="text-slate-400">Analizamos tus métricas actuales para encontrar fugas de dinero y oportunidades ocultas.</p>
                                    </div>
                                </motion.div>
                                <motion.div
                                    whileHover={{ x: 10 }}
                                    className="flex gap-6 group cursor-default"
                                >
                                    <div className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center text-teal-400 font-bold border border-teal-500/20 shrink-0 text-xl group-hover:bg-teal-500 group-hover:text-white transition-colors">2</div>
                                    <div>
                                        <h4 className="text-xl font-bold text-white mb-2 group-hover:text-teal-400 transition-colors">Experimentación Rápida</h4>
                                        <p className="text-slate-400">Lanzamos micro-test A/B en creativos, copys y audiencias para validar ganadores.</p>
                                    </div>
                                </motion.div>
                                <motion.div
                                    whileHover={{ x: 10 }}
                                    className="flex gap-6 group cursor-default"
                                >
                                    <div className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center text-teal-400 font-bold border border-teal-500/20 shrink-0 text-xl group-hover:bg-teal-500 group-hover:text-white transition-colors">3</div>
                                    <div>
                                        <h4 className="text-xl font-bold text-white mb-2 group-hover:text-teal-400 transition-colors">Escalado Agresivo</h4>
                                        <p className="text-slate-400">Inyectamos presupuesto solo en lo que funciona, rotando creativos para evitar la fatiga.</p>
                                    </div>
                                </motion.div>
                            </div>
                        </div>

                        {/* Interactive Growth Loop Visualization */}
                        <div className="relative flex justify-center items-center py-10 scale-[0.8] md:scale-100">
                            <div className="absolute inset-0 bg-gradient-to-r from-teal-500/10 to-transparent rounded-full blur-3xl opacity-30" />
                            <GrowthLoop />
                        </div>
                    </div>
                </div>
            </section>

            {/* 5. TECH STACK - DUAL MARQUEE (Enhanced) */}
            <section className="py-24 bg-slate-950 border-y border-slate-900 relative overflow-hidden">
                <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-slate-950 to-transparent z-10" />
                <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-slate-950 to-transparent z-10" />

                <div className="container mx-auto px-6 lg:px-8 relative z-10 text-center mb-16">
                    <p className="text-sm font-bold text-teal-500 uppercase tracking-widest mb-3">Tools of Trade</p>
                    <h2 className="text-3xl font-bold text-white">Dominamos el Stack Moderno</h2>
                </div>

                {/* Marquee Left */}
                <div className="relative flex overflow-x-hidden group mb-8">
                    <div className="animate-marquee flex gap-12 items-center whitespace-nowrap py-4 grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-500">
                        {[
                            "Google Analytics 4", "Meta Business Suite", "HubSpot", "Salesforce", "SEMrush", "Ahrefs"
                        ].map((tech, i) => (
                            <span key={i} className="text-3xl md:text-5xl font-bold text-slate-600 mx-4 font-mono">{tech}</span>
                        ))}
                        {[
                            "Google Analytics 4", "Meta Business Suite", "HubSpot", "Salesforce", "SEMrush", "Ahrefs"
                        ].map((tech, i) => (
                            <span key={`dup-${i}`} className="text-3xl md:text-5xl font-bold text-slate-600 mx-4 font-mono">{tech}</span>
                        ))}
                    </div>
                </div>

                {/* Marquee Right */}
                <div className="relative flex overflow-x-hidden group">
                    <div className="animate-marquee-reverse flex gap-12 items-center whitespace-nowrap py-4 grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-500">
                        {[
                            "Looker Studio", "Hotjar", "Zapier", "Slack", "Mailchimp", "Klaviyo"
                        ].map((tech, i) => (
                            <span key={i} className="text-3xl md:text-5xl font-bold text-slate-600 mx-4 font-mono">{tech}</span>
                        ))}
                        {[
                            "Looker Studio", "Hotjar", "Zapier", "Slack", "Mailchimp", "Klaviyo"
                        ].map((tech, i) => (
                            <span key={`dup-${i}`} className="text-3xl md:text-5xl font-bold text-slate-600 mx-4 font-mono">{tech}</span>
                        ))}
                    </div>
                </div>
            </section>

            {/* 6. PRICING / ENGAGEMENT MODELS */}
            <section className="py-32 bg-slate-900 border-t border-slate-800">
                <div className="container mx-auto px-6 lg:px-8">
                    <div className="text-center mb-24">
                        <Badge variant="outline" className="mb-4 border-teal-500/30 bg-teal-500/10 text-teal-300">
                            Scale With Us
                        </Badge>
                        <h2 className="text-4xl text-white font-bold">Cómo Trabajamos Contigo</h2>
                    </div>

                    <div className="grid md:grid-cols-2 gap-12 max-w-4xl mx-auto">
                        {/* Project Based */}
                        <motion.div
                            whileHover={{ y: -5 }}
                            className="bg-gradient-to-b from-slate-900 to-slate-950 p-10 rounded-3xl border border-slate-800 flex flex-col hover:border-slate-700 transition-colors"
                        >
                            <h3 className="text-2xl font-bold text-white mb-2">Proyectos Sprint</h3>
                            <p className="text-slate-400 text-sm mb-8 leading-relaxed">Intervenciones tácticas de alto impacto con deliverables claros y fecha de fin.</p>

                            <div className="bg-slate-900 rounded-xl p-6 mb-8 border border-slate-800/50">
                                <div className="text-sm text-slate-500 mb-3 font-semibold uppercase tracking-wider">Ejemplos:</div>
                                <ul className="space-y-3">
                                    <li className="text-slate-300 text-sm flex gap-2"><ArrowRight size={14} className="mt-1 text-slate-500" /> Auditoría SEO Técnica</li>
                                    <li className="text-slate-300 text-sm flex gap-2"><ArrowRight size={14} className="mt-1 text-slate-500" /> Setup de CRM & Automatización</li>
                                    <li className="text-slate-300 text-sm flex gap-2"><ArrowRight size={14} className="mt-1 text-slate-500" /> Lanzamiento de Producto</li>
                                </ul>
                            </div>

                            <div className="mt-auto pt-6 border-t border-slate-800">
                                <div className="text-xl font-bold text-slate-200 mb-4 font-mono">Desde $1,500 USD</div>
                                <Button variant="outline" className="w-full border-slate-700 text-slate-300 hover:bg-slate-800 h-12">Solicitar Proyecto</Button>
                            </div>
                        </motion.div>

                        {/* Retainer - Featured with 3D Pop */}
                        <div className="relative group perspective-1000">
                            <div className="absolute -inset-1 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-[2rem] blur opacity-20 group-hover:opacity-40 transition duration-500" />
                            <motion.div
                                className="relative bg-slate-900 p-10 rounded-[2rem] border border-teal-500 flex flex-col shadow-2xl h-full transform transition-transform duration-500 group-hover:translate-z-10"
                            >
                                <div className="absolute top-0 right-0 bg-teal-500 text-white text-xs font-bold px-4 py-1.5 rounded-bl-xl rounded-tr-[1.8rem] shadow-lg">GROWTH PARTNER</div>
                                <h3 className="text-2xl font-bold text-white mb-2">Retainer Mensual</h3>
                                <p className="text-slate-300 text-sm mb-8 leading-relaxed">Nos convertimos en tu departamento de growth externo. Ejecución continua y mejora semana a semana.</p>

                                <div className="bg-slate-950/50 rounded-xl p-6 mb-8 border border-teal-500/20">
                                    <div className="text-sm text-slate-500 mb-3 font-semibold uppercase tracking-wider">Incluye:</div>
                                    <ul className="space-y-3">
                                        <li className="text-white text-sm font-medium flex gap-2"><CheckCircle2 size={16} className="text-teal-400 mt-0.5" /> Estrategia Full-Funnel</li>
                                        <li className="text-white text-sm font-medium flex gap-2"><CheckCircle2 size={16} className="text-teal-400 mt-0.5" /> Gestión de Ads (Meta/Google)</li>
                                        <li className="text-white text-sm font-medium flex gap-2"><CheckCircle2 size={16} className="text-teal-400 mt-0.5" /> Reportes Semanales de ROI</li>
                                    </ul>
                                </div>

                                <div className="mt-auto pt-6 border-t border-slate-800">
                                    <div className="text-xl font-bold text-teal-400 mb-4 font-mono">Desde $2,500 USD <span className="text-sm text-slate-500 font-normal">/ mes</span></div>
                                    <Button className="w-full bg-teal-500 hover:bg-teal-400 text-white font-bold h-12 shadow-[0_0_20px_rgba(20,184,166,0.3)]">Aplicar al Programa</Button>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 7. FAQ */}
            <section className="py-24 bg-slate-950 border-t border-slate-900">
                <div className="container mx-auto px-6 lg:px-8 max-w-3xl">
                    <h2 className="text-3xl font-bold text-white text-center mb-16">
                        Preguntas de Negocio
                    </h2>
                    <Accordion type="single" collapsible className="w-full space-y-4">
                        {[
                            { q: "¿Cuánto debo invertir en Ads?", a: "Recomendamos que tu presupuesto publicitario sea al menos 3x nuestro fee de gestión para tener suficiente data para optimizar. Generalmente sugerimos iniciar con $1,000 - $3,000 USD mensuales en pauta." },
                            { q: "¿Garantizan resultados?", a: "Nadie honesto puede garantizar resultados específicos en plataformas de subasta (Google/Facebook). Lo que garantizamos es la excelencia en la ejecución y transparencia total en los datos." },
                            { q: "¿Trabajan con mi equipo interno?", a: "Sí. Frecuentemente actuamos como consultores estratégicos o 'brazo armado' para equipos de marketing in-house que necesitan expertise en canales específicos." }
                        ].map((faq, i) => (
                            <AccordionItem key={i} value={`item-${i}`} className="border border-slate-800 rounded-xl px-6 bg-slate-900/30 data-[state=open]:bg-slate-900 transition-all">
                                <AccordionTrigger className="text-lg font-medium text-slate-200 hover:no-underline py-6 hover:text-teal-400 transition-colors text-left font-serif-heading">{faq.q}</AccordionTrigger>
                                <AccordionContent className="text-slate-400 text-base leading-relaxed pb-6 pr-8">
                                    {faq.a}
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </div>
            </section>

            {/* 8. CTA - FINAL */}
            <section className="py-40 bg-black border-t border-slate-900 relative overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent 50%,rgba(20,184,166,0.05))]" />
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 0.2 }}
                    transition={{ duration: 1 }}
                    className="absolute inset-0 bg-[url('/grid.svg')] bg-fixed"
                />

                <div className="container mx-auto px-6 lg:px-8 text-center relative z-10">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        whileInView={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.5 }}
                    >
                        <h2 className="text-5xl md:text-8xl font-bold text-white mb-8 tracking-tighter">
                            ¿Listo para <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-emerald-400">Escalar?</span>
                        </h2>
                        <p className="text-xl md:text-2xl text-slate-500 mb-16 max-w-3xl mx-auto font-light">
                            Agenda una auditoría gratuita de 30 minutos. <br />
                            Analizaremos tu funnel actual sin compromiso.
                        </p>

                        <Link href="/contacto">
                            <Button size="lg" className="h-24 px-16 rounded-full bg-white text-black hover:bg-slate-200 text-2xl font-bold shadow-[0_0_80px_-20px_rgba(255,255,255,0.3)] hover:scale-105 transition-all duration-300">
                                Agendar Auditoría
                            </Button>
                        </Link>
                    </motion.div>
                </div>
            </section>
        </main>
    );
}

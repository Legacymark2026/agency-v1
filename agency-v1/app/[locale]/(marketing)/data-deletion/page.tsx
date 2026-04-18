'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
    Shield, 
    Trash2, 
    Mail, 
    CheckCircle, 
    Lock, 
    ArrowRight, 
    Database, 
    UserX, 
    Server,
    History,
    Key,
    Info
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export default function DataDeletionPage() {
    const steps = [
        {
            icon: <Mail className="w-6 h-6" />,
            title: "Solicitud Oficial",
            desc: "Envía un correo desde la cuenta que deseas eliminar para validar la propiedad.",
            color: "text-blue-400",
            bg: "bg-blue-400/10"
        },
        {
            icon: <Shield className="w-6 h-6" />,
            title: "Verificación Segura",
            desc: "Nuestro DPO validará tu identidad y confirmará los servicios vinculados.",
            color: "text-teal-400",
            bg: "bg-teal-400/10"
        },
        {
            icon: <Trash2 className="w-6 h-6" />,
            title: "Purga de Datos",
            desc: "Eliminación irreversible de bases de datos, backups y tokens de acceso.",
            color: "text-red-400",
            bg: "bg-red-400/10"
        }
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <div className="min-h-screen bg-slate-950 font-sans text-slate-300 selection:bg-teal-500/30 selection:text-teal-200 overflow-x-hidden">
            {/* Ambient Background Glows */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-teal-500/10 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full animate-pulse delay-1000" />
                <div className="absolute top-[20%] right-[20%] w-[20%] h-[20%] bg-indigo-500/5 blur-[100px] rounded-full" />
            </div>

            <div className="relative z-10">
                {/* Navbar Placeholder / Branding */}
                <nav className="border-b border-white/5 bg-slate-950/50 backdrop-blur-md sticky top-0 z-50">
                    <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                        <Link href="/" className="flex items-center gap-2 group">
                            <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center group-hover:shadow-[0_0_15px_rgba(20,184,166,0.5)] transition-all">
                                <Shield className="w-5 h-5 text-slate-950" />
                            </div>
                            <span className="font-bold tracking-tighter text-white text-lg uppercase transition-all group-hover:text-teal-400">
                                Legacy<span className="text-teal-500">Mark</span>
                            </span>
                        </Link>
                        <Badge variant="outline" className="border-teal-500/30 bg-teal-500/5 text-teal-400 font-mono text-xs uppercase tracking-widest px-3">
                            Security Hub
                        </Badge>
                    </div>
                </nav>

                {/* Hero Section */}
                <header className="relative py-24 md:py-32 overflow-hidden border-b border-white/5">
                    <motion.div 
                        className="max-w-5xl mx-auto px-6 text-center"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-teal-400 text-xs font-mono mb-8 backdrop-blur-sm">
                            <Lock className="w-3 h-3" />
                            <span>GDPR & Meta Compliance Engine</span>
                        </div>
                        <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-white mb-6 leading-[1.1]">
                            Control Total de <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-blue-400 to-teal-400 animate-gradient-x">Tus Datos</span>
                        </h1>
                        <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
                            Garantizamos el derecho al olvido y la portabilidad de tus datos mediante un proceso de purga seguro, transparente y auditado.
                        </p>
                    </motion.div>
                </header>

                <main className="max-w-6xl mx-auto px-6 py-20">
                    <motion.div 
                        className="grid gap-20"
                        variants={containerVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                    >
                        {/* Status Grid */}
                        <div className="grid md:grid-cols-3 gap-8">
                            {steps.map((step, idx) => (
                                <motion.div key={idx} variants={itemVariants}>
                                    <Card className="bg-white/5 border-white/10 backdrop-blur-md hover:border-teal-500/30 transition-all duration-500 group relative overflow-hidden h-full">
                                        <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <CardContent className="p-8 relative z-10 flex flex-col h-full">
                                            <div className={`w-12 h-12 ${step.bg} ${step.color} rounded-xl flex items-center justify-center mb-6 ring-1 ring-inset ring-white/10`}>
                                                {step.icon}
                                            </div>
                                            <h3 className="text-xl font-bold text-white mb-3 flex items-center justify-between">
                                                {step.title}
                                                <span className="text-slate-700 font-mono text-sm">0{idx + 1}</span>
                                            </h3>
                                            <p className="text-slate-400 text-sm leading-relaxed">
                                                {step.desc}
                                            </p>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>

                        {/* Action Module */}
                        <motion.div variants={itemVariants}>
                            <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-teal-900/20 rounded-[2.5rem] p-1 border border-white/5 relative group overflow-hidden">
                                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none" />
                                <div className="bg-slate-950/80 backdrop-blur-2xl rounded-[2.4rem] p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-12 relative z-10 border border-white/5">
                                    <div className="space-y-6 max-w-xl text-center md:text-left">
                                        <div className="flex items-center gap-4 justify-center md:justify-start">
                                            <div className="p-3 bg-red-500/10 rounded-2xl ring-1 ring-red-500/20">
                                                <UserX className="w-6 h-6 text-red-400" />
                                            </div>
                                            <div>
                                                <h3 className="text-2xl font-bold text-white">Iniciar Desvinculación Permanentemente</h3>
                                            </div>
                                        </div>
                                        <p className="text-slate-400 leading-relaxed">
                                            Al solicitar la eliminación, enviaremos un token de confirmación para validar que eres el titular de la cuenta. Este proceso es irreversible una vez ejecutado.
                                        </p>
                                        <div className="flex flex-wrap items-center gap-4 justify-center md:justify-start pt-4">
                                            <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
                                                <CheckCircle className="w-3 h-3 text-teal-500" />
                                                SLA: 24h Respuesta
                                            </div>
                                            <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
                                                <CheckCircle className="w-3 h-3 text-teal-500" />
                                                Procesado en 30 días
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-center gap-6 w-full md:w-auto">
                                        <div className="text-center md:text-right hidden md:block">
                                            <p className="text-xs uppercase tracking-widest text-slate-500 mb-1 font-bold">Oficial Support</p>
                                            <p className="text-white font-mono text-sm">legacymarkcolombia@legacymarksas.com</p>
                                        </div>
                                        <a
                                            href="mailto:legacymarkcolombia@legacymarksas.com?subject=Solicitud de Eliminación de Datos de Usuario&body=Hola equipo de LegacyMark,%0D%0A%0D%0ASolicito formalmente la eliminación de mis datos personales y cuenta asociada a este correo electrónico.%0D%0A%0D%0AIdentificación de Usuario (si conoce): %0D%0A%0D%0AGracias."
                                            className="w-full md:w-auto"
                                        >
                                            <Button size="lg" className="h-16 px-10 rounded-full bg-white text-slate-950 hover:bg-teal-400 transition-all duration-300 font-bold text-lg group w-full">
                                                Solicitar Eliminación
                                                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                            </Button>
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Details Sections */}
                        <div className="grid md:grid-cols-2 gap-16 items-start">
                            <motion.div variants={itemVariants} className="space-y-8">
                                <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                                    <Database className="w-6 h-6 text-teal-400" />
                                    ¿Qué datos purgamos?
                                </h3>
                                <div className="space-y-4">
                                    {[
                                        { icon: <History className="w-4 h-4" />, label: "Historial de interacciones y logs operativos" },
                                        { icon: <Key className="w-4 h-4" />, label: "Tokens de integración (Meta, Google, TikTok)" },
                                        { icon: <Server className="w-4 h-4" />, label: "Assets multimedia y grabaciones de audio" },
                                        { icon: <Info className="w-4 h-4" />, label: "Información de facturación y CRM" }
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 group hover:bg-white/10 transition-colors">
                                            <div className="text-teal-400">{item.icon}</div>
                                            <span className="text-sm text-slate-400">{item.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>

                            <motion.div variants={itemVariants} className="space-y-8 p-10 rounded-[2rem] bg-teal-500/5 border border-teal-500/10 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 blur-[50px] rounded-full" />
                                <h3 className="text-2xl font-bold text-white">Transparencia Total</h3>
                                <p className="text-slate-400 text-sm leading-relaxed italic">
                                    "Nuestro compromiso con la privacidad va más allá del cumplimiento legal. Diseñamos sistemas que priorizan la soberanía del usuario sobre sus propios datos, asegurando que 'eliminado' signifique exactamente eso."
                                </p>
                                <div className="pt-6 flex items-center justify-between text-xs font-mono uppercase tracking-[0.2em] text-teal-500">
                                    <span>Audit Level 4</span>
                                    <span>DPO Certified</span>
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>
                </main>

                <footer className="border-t border-white/5 py-12 bg-slate-950 relative overflow-hidden">
                    <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8 md:gap-0">
                        <div className="text-sm text-slate-500 font-mono">
                            © {new Date().getFullYear()} LEGACYMARK SAS. ALL RIGHTS RESERVED.
                        </div>
                        <div className="flex items-center gap-8 text-xs font-bold uppercase tracking-widest text-slate-400">
                            <Link href="/politica-privacidad" className="hover:text-teal-500 transition-colors">Privacy</Link>
                            <Link href="/terms" className="hover:text-teal-500 transition-colors">Terms</Link>
                            <Link href="/contacto" className="hover:text-teal-500 transition-colors">Support</Link>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
}

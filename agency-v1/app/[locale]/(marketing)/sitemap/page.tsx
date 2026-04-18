'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
    Map,
    Link as LinkIcon,
    ArrowUpRight,
    ChevronRight,
    ExternalLink,
    Shield,
    Globe,
    Zap,
    Users,
    Briefcase,
    FileText,
    MessageSquare,
    Info,
    Lock
} from 'lucide-react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default function SitemapPage() {
    const t = useTranslations('sitemapPage');
    const tFooter = useTranslations('footer');
    const tNav = useTranslations('nav');
    const locale = useLocale();

    const sections = [
        {
            title: t('sections.main'),
            icon: <Globe className="w-5 h-5 text-teal-400" />,
            links: [
                { label: tNav('getStarted'), href: `/${locale}` },
                { label: tFooter('links.about'), href: `/${locale}/nosotros` },
                { label: tNav('services'), href: `/${locale}/servicios` },
                { label: tNav('methodology'), href: `/${locale}/metodologia` },
                { label: tNav('portfolio'), href: `/${locale}/portfolio` },
                { label: tNav('blog'), href: `/${locale}/blog` },
                { label: tNav('contact'), href: `/${locale}/contacto` }
            ]
        },
        {
            title: t('sections.solutions'),
            icon: <Zap className="w-5 h-5 text-blue-400" />,
            links: [
                { label: tFooter('links.automation'), href: `/${locale}/soluciones/automatizacion` },
                { label: tFooter('links.webdev'), href: `/${locale}/soluciones/web-dev` },
                { label: tFooter('links.strategy'), href: `/${locale}/soluciones/estrategia-de-marca` },
                { label: tFooter('links.content'), href: `/${locale}/soluciones/creacion-contenido` },
                { label: tFooter('links.marketing'), href: `/${locale}/soluciones/estrategia` }
            ]
        },
        {
            title: t('sections.company'),
            icon: <Users className="w-5 h-5 text-indigo-400" />,
            links: [
                { label: 'VIP Services', href: `/${locale}/vip` },
                { label: 'Flyering & BTL', href: `/${locale}/flyering` },
                { label: 'Metodología Detallada', href: `/${locale}/metodologia` },
                { label: 'Nuestro Equipo', href: `/${locale}/nosotros#equipo` }
            ]
        },
        {
            title: t('sections.legal'),
            icon: <Shield className="w-5 h-5 text-red-400" />,
            links: [
                { label: tFooter('privacyPolicy'), href: `/${locale}/politica-privacidad` },
                { label: tFooter('terms'), href: `/${locale}/terms` },
                { label: tFooter('cookies'), href: `/${locale}/politica-cookies` },
                { label: 'Data Deletion', href: `/${locale}/data-deletion` }
            ]
        }
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, x: -10 },
        visible: { opacity: 1, x: 0 }
    };

    return (
        <div className="min-h-screen bg-slate-950 font-sans text-slate-300 selection:bg-teal-500/30 selection:text-teal-200 overflow-x-hidden">
            {/* Ambient background glows */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-[20%] w-[50%] h-[50%] bg-teal-500/5 blur-[120px] rounded-full" />
                <div className="absolute bottom-0 right-[10%] w-[40%] h-[40%] bg-blue-500/5 blur-[100px] rounded-full" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-6 py-24 md:py-32">
                {/* Header */}
                <header className="mb-20 text-center md:text-left">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <Badge variant="outline" className="border-teal-500/30 bg-teal-500/5 text-teal-400 font-mono text-xs uppercase tracking-widest px-3 mb-6">
                            {t('hero.badge')}
                        </Badge>
                        <h1 className="text-4xl md:text-6xl font-bold tracking-tighter text-white mb-6">
                            {t('hero.titleStart')}{" "}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-blue-500">
                                {t('hero.titleHighlight')}
                            </span>
                        </h1>
                        <p className="text-lg text-slate-400 max-w-2xl leading-relaxed">
                            {t('hero.description')}
                        </p>
                    </motion.div>
                </header>

                {/* Sitemap Grid */}
                <motion.main
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    {sections.map((section, sIdx) => (
                        <div key={sIdx} className="space-y-8">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-slate-900 rounded-lg border border-white/5 ring-1 ring-white/5">
                                    {section.icon}
                                </div>
                                <h2 className="text-xl font-bold text-white uppercase tracking-tight">
                                    {section.title}
                                </h2>
                            </div>

                            <ul className="space-y-4">
                                {section.links.map((link, lIdx) => (
                                    <motion.li key={lIdx} variants={itemVariants}>
                                        <Link
                                            href={link.href}
                                            className="group flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-teal-500/30 transition-all duration-300"
                                        >
                                            <span className="text-sm font-medium text-slate-400 group-hover:text-white transition-colors">
                                                {link.label}
                                            </span>
                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-1 group-hover:translate-x-0">
                                                <ChevronRight className="w-4 h-4 text-teal-500" />
                                            </div>
                                        </Link>
                                    </motion.li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </motion.main>

                {/* Footer Section / Technical Info */}
                <motion.section
                    className="mt-32 pt-12 border-t border-white/5 grid md:grid-cols-2 gap-12 items-center"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                >
                    <div className="flex items-center gap-6">
                        <div className="p-4 bg-teal-500/10 rounded-2xl border border-teal-500/20">
                            <Info className="w-8 h-8 text-teal-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white mb-1">Indexación en Tiempo Real</h3>
                            <p className="text-sm text-slate-500 max-w-md">
                                Este mapa del sitio es generado dinámicamente. Todas las rutas se sincronizan con nuestro motor de búsqueda para garantizar la accesibilidad total.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-4 md:justify-end">
                        <Badge variant="secondary" className="bg-slate-900 text-slate-400 border-white/5 font-mono text-xs">
                            SSL SECURED
                        </Badge>
                        <Badge variant="secondary" className="bg-slate-900 text-slate-400 border-white/5 font-mono text-xs">
                            HTTP/3 ENABLED
                        </Badge>
                        <Badge variant="secondary" className="bg-slate-900 text-slate-400 border-white/5 font-mono text-xs">
                            GLOBAL EDGE
                        </Badge>
                    </div>
                </motion.section>
            </div>
        </div>
    );
}

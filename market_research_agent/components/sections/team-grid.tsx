"use client";

import { motion } from "framer-motion";
import { Github, Linkedin, Mail, Shield, Code2, Users } from "lucide-react";
import Image from "next/image";

import * as LucideIcons from "lucide-react";
import type { Expert } from "@/types/experts";
import { useTranslations } from "next-intl";

interface TeamGridProps {
    experts: Expert[];
}

export function TeamGrid({ experts }: TeamGridProps) {
    const t = useTranslations("home.teamGrid");
    // Si no hay expertos reales, usamos un fallback básico u ocultamos la sección
    if (!experts || experts.length === 0) {
        return null;
    }
    return (
        <section className="bg-transparent py-20 sm:py-32 relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-800 to-transparent" />

            <div className="mx-auto max-w-7xl px-4 sm:px-6 relative z-10">
                <div className="text-center mb-24">
                    <h2 className="text-4xl font-black tracking-[-0.04em] text-white sm:text-6xl mb-6">
                        {t('titleStart')} <span className="text-teal-400 font-light">{t('titleHighlight')}</span>
                    </h2>
                    <p className="text-slate-400 max-w-2xl mx-auto text-base md:text-lg font-light uppercase tracking-widest font-mono">
                        {t('subtitle')}
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {experts.map((member, index) => {
                        // Resuelve el icono dinámicamente o usa Users como predeterminado
                        // @ts-ignore
                        const IconComponent = member.iconName && LucideIcons[member.iconName]
                            // @ts-ignore
                            ? LucideIcons[member.iconName]
                            : Users;

                        return (
                            <motion.div
                                key={member.id}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="group relative"
                            >
                                <div className="relative bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-sm p-4 overflow-hidden hover:border-teal-500/30 hover:shadow-[0_20px_50px_-12px_rgba(13,148,136,0.15)] hover:-translate-y-2 transition-all duration-500">
                                    {/* Profile Header */}
                                    <div className="relative aspect-square rounded-sm overflow-hidden bg-slate-950 mb-6">
                                        <Image
                                            src={member.imageUrl || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=2070&auto=format&fit=crop"}
                                            alt={member.name}
                                            fill
                                            className="object-cover grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105 opacity-80 group-hover:opacity-100"
                                        />
                                        {/* Overlay Gradient */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent opacity-80" />

                                        <div className="absolute bottom-6 left-6 text-white">
                                            <div className="flex items-center gap-2 mb-2">
                                                <IconComponent size={14} strokeWidth={1.5} className="text-slate-300" />
                                                {member.badgeId && (
                                                    <span className="text-[10px] font-mono tracking-widest uppercase bg-white/10 px-2 py-0.5 rounded-sm backdrop-blur-md border border-white/20">{member.badgeId}</span>
                                                )}
                                            </div>
                                            <div className="font-black tracking-tight text-xl sm:text-2xl leading-tight text-shadow-sm line-clamp-2 uppercase font-mono">{member.name}</div>
                                            <div className="text-xs text-slate-300 font-light font-mono uppercase tracking-widest mt-1">{member.role}</div>
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="px-2 pb-2">
                                        <p className="text-sm text-slate-400 mb-8 leading-relaxed min-h-[60px] font-light">
                                            {member.bio}
                                        </p>

                                        {/* Skills Tags */}
                                        <div className="flex flex-wrap gap-2 mb-8">
                                            {member.skills?.map(skill => (
                                                <span key={skill} className="text-[10px] uppercase tracking-widest font-mono px-2 py-1 bg-slate-950 border border-slate-800 rounded-sm text-slate-500 group-hover:border-teal-500/30 group-hover:text-teal-400 transition-colors">
                                                    {skill}
                                                </span>
                                            ))}
                                        </div>

                                        {/* Social Actions */}
                                        <div className="flex gap-2 pt-6 border-t border-slate-800">
                                            {/* Aquí se pueden mapear las redes sociales usando member.socialLinks si están formateadas correctamente. Simplificado por ahora. */}
                                            <button className="p-2 rounded-sm hover:bg-slate-800 text-slate-500 hover:text-teal-400 transition-colors"><Linkedin size={16} strokeWidth={1.5} /></button>
                                            <button className="p-2 rounded-sm hover:bg-slate-800 text-slate-500 hover:text-teal-400 transition-colors"><Github size={16} strokeWidth={1.5} /></button>
                                            <button className="p-2 rounded-sm hover:bg-slate-800 text-slate-500 hover:text-teal-400 transition-colors ml-auto"><Mail size={16} strokeWidth={1.5} /></button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}

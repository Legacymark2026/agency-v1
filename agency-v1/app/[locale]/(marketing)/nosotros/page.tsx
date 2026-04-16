import { CorporateHero } from "@/components/sections/corporate-hero";
import { CorporatePhilosophy } from "@/components/sections/corporate-philosophy";
import { CorporateValues } from "@/components/sections/corporate-values";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { getExperts } from "@/actions/experts";
import { Linkedin, Twitter, Github, Globe, ArrowUpRight } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Metadata } from 'next';
import { siteConfig } from '@/lib/site-config';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'nosotrosPage.meta' });

    return {
        title: t('title'),
        description: t('description'),
        openGraph: {
            title: t('title'),
            description: t('description'),
            url: `${siteConfig.url}/${locale}/nosotros`,
            siteName: siteConfig.name,
            locale: locale === 'en' ? 'en_US' : 'es_ES',
            type: 'website',
        },
        alternates: {
            canonical: `${siteConfig.url}/${locale}/nosotros`,
            languages: {
                'es': `${siteConfig.url}/es/nosotros`,
                'en': `${siteConfig.url}/en/nosotros`,
            },
        },
    };
}

const socialIconMap: Record<string, any> = {
    linkedin: Linkedin,
    twitter: Twitter,
    github: Github,
    website: Globe,
};

export default async function AboutPage() {
    const experts = await getExperts();
    const t = await getTranslations('nosotrosPage.team');

    return (
        <main className="min-h-screen bg-white overflow-hidden">
            {/* 1. New Corporate Hero */}
            <CorporateHero />

            {/* 2. Philosophy (Mission/Vision/Personality) */}
            <CorporatePhilosophy />

            {/* 3. Values Bento Grid */}
            <CorporateValues />

            {/* 4. Team Section (Polished) */}
            <section className="py-24 bg-slate-900 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.05]" />
                <div className="container px-4 md:px-6 relative z-10">
                    <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
                        <div className="max-w-xl">
                            <h2 className="text-3xl md:text-5xl font-bold tracking-tighter mb-4">{t('title')}</h2>
                            <p className="text-slate-400 text-lg">{t('subtitle')}</p>
                        </div>
                        <Button variant="outline" className="border-slate-700 text-white hover:bg-white hover:text-slate-900 transition-all rounded-full px-8">
                            {t('btn')} <ArrowUpRight className="ml-2 w-4 h-4" />
                        </Button>
                    </div>

                    <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 justify-center">
                        {experts.length > 0 ? (
                            experts.map((expert) => {
                                const socialLinks = expert.socialLinks as any;
                                const links = Array.isArray(socialLinks) ? socialLinks : [];

                                return (
                                    <div key={expert.id} className="group relative overflow-hidden rounded-2xl bg-slate-800 shadow-2xl aspect-[3/4] border border-slate-700/50">
                                        <Image
                                            src={expert.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(expert.name)}&background=random`}
                                            alt={expert.name}
                                            fill
                                            className="object-cover transition-transform duration-700 group-hover:scale-110 saturate-0 group-hover:saturate-100"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-90" />

                                        <div className="absolute bottom-0 left-0 p-8 w-full translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                                            <div className="w-12 h-1 bg-teal-500 mb-4 rounded-full" />
                                            <h3 className="text-2xl font-bold text-white leading-tight mb-1">{expert.name}</h3>
                                            <p className="text-sm font-bold text-teal-400 uppercase tracking-widest mb-4">{expert.role}</p>

                                            {expert.bio && (
                                                <p className="text-slate-300 text-sm mb-6 line-clamp-3 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                                                    {expert.bio}
                                                </p>
                                            )}

                                            {links.length > 0 && (
                                                <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-200">
                                                    {links.map((link: any, idx: number) => {
                                                        const Icon = socialIconMap[link.platform] || Globe;
                                                        return (
                                                            <a
                                                                key={idx}
                                                                href={link.url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="p-2 bg-white/10 hover:bg-teal-500 hover:text-white rounded-full transition-colors backdrop-blur-sm"
                                                                aria-label={link.platform}
                                                            >
                                                                <Icon className="h-4 w-4 text-white" />
                                                            </a>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="group relative overflow-hidden rounded-2xl bg-slate-800 shadow-2xl aspect-[3/4] border border-slate-700/50">
                                <Image
                                    src="/images/team/heyber.png"
                                    alt="Heyber Enrique Bohorquez Florez"
                                    fill
                                    className="object-cover transition-transform duration-700 group-hover:scale-110 saturate-0 group-hover:saturate-100"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-90" />

                                <div className="absolute bottom-0 left-0 p-8 w-full translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                                    <div className="w-12 h-1 bg-teal-500 mb-4 rounded-full" />
                                    <h3 className="text-2xl font-bold text-white leading-tight mb-1">Heyber Enrique <br /> Bohorquez Florez</h3>
                                    <p className="text-sm font-bold text-teal-400 uppercase tracking-widest mb-4">Head of Strategy</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </main>
    );
}

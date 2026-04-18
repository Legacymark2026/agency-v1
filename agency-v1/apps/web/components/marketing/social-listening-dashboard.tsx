"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, TrendingUp, Rss, Hash, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Mock data for social listening
const mockHashtags = [
    { tag: '#MarketingDigital', volume: '124K', sentiment: 'Positive', trend: '+12%' },
    { tag: '#GrowthHacking', volume: '45K', sentiment: 'Neutral', trend: '+5%' },
    { tag: '#AI', volume: '2M', sentiment: 'Positive', trend: '+45%' },
];

const mockRSS = [
    { title: '10 Tendencias de Marketing 2026', source: 'HubSpot Blog', date: 'Hace 2 horas' },
    { title: 'Cómo optimizar campañas en TikTok', source: 'SocialMediaToday', date: 'Hace 5 horas' },
    { title: 'El futuro del UX Design', source: 'Smashing Magazine', date: 'Ayer' },
];

export function SocialListeningDashboard({ companyId }: { companyId: string }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'HASHTAGS' | 'COMPETITORS'>('HASHTAGS');

    return (
        <div className="space-y-6">
            <div className="flex gap-4 mb-6">
                <Button 
                    variant={activeTab === 'HASHTAGS' ? 'primary' : 'outline'}
                    onClick={() => setActiveTab('HASHTAGS')}
                    className={activeTab === 'HASHTAGS' ? 'bg-teal-600 hover:bg-teal-500 text-white' : 'border-slate-700 text-slate-300 hover:bg-slate-800'}
                >
                    <Hash className="w-4 h-4 mr-2" />
                    Hashtag Sentinel
                </Button>
                <Button 
                    variant={activeTab === 'COMPETITORS' ? 'primary' : 'outline'}
                    onClick={() => setActiveTab('COMPETITORS')}
                    className={activeTab === 'COMPETITORS' ? 'bg-indigo-600 hover:bg-indigo-500 text-white' : 'border-slate-700 text-slate-300 hover:bg-slate-800'}
                >
                    <Rss className="w-4 h-4 mr-2" />
                    Competitor RSS
                </Button>
            </div>

            <AnimatePresence mode="wait">
                {activeTab === 'HASHTAGS' ? (
                    <motion.div 
                        key="hashtags"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="grid grid-cols-1 md:grid-cols-3 gap-6"
                    >
                        <div className="md:col-span-2 space-y-4">
                            <Card className="bg-slate-900 border-slate-800 shadow-xl">
                                <CardHeader>
                                    <CardTitle className="text-slate-100 flex items-center justify-between">
                                        Monitor Global
                                        <div className="relative w-64">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                            <Input 
                                                placeholder="Rastrear hashtag..." 
                                                className="bg-slate-950 border-slate-800 pl-9 text-slate-200 focus-visible:ring-teal-500"
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                            />
                                        </div>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {mockHashtags.map((h, i) => (
                                            <div key={i} className="flex items-center justify-between p-4 bg-slate-950/50 rounded-lg border border-slate-800/50 hover:border-slate-700 transition-colors cursor-pointer group">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-teal-500/10 flex items-center justify-center text-teal-400">
                                                        <Activity className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <p className="text-slate-200 font-medium group-hover:text-teal-400 transition-colors">{h.tag}</p>
                                                        <p className="text-xs text-slate-500">Sentimiento: <span className={h.sentiment === 'Positive' ? 'text-teal-400' : 'text-slate-400'}>{h.sentiment}</span></p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-slate-200 font-mono">{h.volume} posts</p>
                                                    <p className="text-xs text-teal-400 flex items-center justify-end gap-1"><TrendingUp className="w-3 h-3"/> {h.trend}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                        <div className="space-y-6">
                            <Card className="bg-slate-900 border-slate-800 shadow-xl overflow-hidden relative">
                                <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-transparent z-0" />
                                <CardHeader className="relative z-10">
                                    <CardTitle className="text-slate-100 text-sm">Resumen de Impacto</CardTitle>
                                </CardHeader>
                                <CardContent className="relative z-10">
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-xs text-slate-500 uppercase">Share of Voice</p>
                                            <p className="text-2xl font-mono text-teal-400">42.8%</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 uppercase">Menciones Únicas Hoy</p>
                                            <p className="text-2xl font-mono text-slate-200">1,204</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div 
                        key="rss"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        {mockRSS.map((item, i) => (
                            <Card key={i} className="bg-slate-900 border-slate-800 shadow-xl hover:shadow-2xl hover:border-slate-700 transition-all cursor-pointer group">
                                <CardContent className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <span className="text-xs font-mono text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded">{item.source}</span>
                                        <span className="text-xs text-slate-500">{item.date}</span>
                                    </div>
                                    <h3 className="text-lg font-medium text-slate-200 group-hover:text-indigo-400 transition-colors line-clamp-2">{item.title}</h3>
                                    <p className="text-sm text-slate-400 mt-2 line-clamp-3">Resumen automático del artículo... El sector está experimentando cambios relevantes respecto a los temas abordados por este competidor en su último lanzamiento.</p>
                                </CardContent>
                            </Card>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

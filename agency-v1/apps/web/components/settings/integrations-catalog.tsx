'use client';

import React, { useState, useMemo } from 'react';
import { 
    Search, LayoutGrid, BarChart3, MessageSquare, Terminal, 
    Facebook, Linkedin, Globe, Activity, Flame, Bot, Play,
    SlidersHorizontal, Wifi, Megaphone, CheckCircle2, AlertCircle, Sparkles
} from "lucide-react";
import { IntegrationAppCard } from "./integration-app-card";
import { IntegrationConfigDialog } from "./integration-config-dialog";
import { MetaConnectButton } from "./meta-connect-button";
import { NewIntegrationCard } from "./new-integration-card";
import { EmailDomainCard } from "./email-domain-card";

interface IntegrationsCatalogClientProps {
    connectedProviders: string[];
    facebookConnected: boolean;
    computedRedirectUri?: string;
    activeAppId: string;
    configs: {
        facebook?: any;
        whatsapp?: any;
        pixel?: any;
        tiktokPixel?: any;
        tiktokMessages?: any;
        linkedinInsight?: any;
        linkedinWebhook?: any;
        googleAds?: any;
        googleAnalytics?: any;
        googleTagManager?: any;
        googleSearchConsole?: any;
        hotjar?: any;
        ahrefs?: any;
        payu?: any;
        aiModels?: any;
        videoAssets?: any;
    };
}

type CategoryType = 'ALL' | 'CRM_SALES' | 'MARKETING_ANALYTICS' | 'SUPPORT_BILLING' | 'AI_AUTOMATION';
type StatusFilterType = 'ALL' | 'CONNECTED' | 'DISCONNECTED';

export function IntegrationsCatalogClient({ 
    connectedProviders, 
    facebookConnected, 
    computedRedirectUri, 
    activeAppId, 
    configs 
}: IntegrationsCatalogClientProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<CategoryType>('ALL');
    const [statusFilter, setStatusFilter] = useState<StatusFilterType>('ALL');

    // 1. Configuration Check Helpers
    const isFacebookConnected = facebookConnected;
    const isFacebookConfigured = isFacebookConnected || (!!configs.facebook && !!configs.facebook.appId);
    const isWhatsappConfigured = !!configs.whatsapp?.phoneNumberId && !!configs.whatsapp?.accessToken;
    const isPixelConfigured = !!configs.pixel?.pixelId;
    const isTiktokPixelConfigured = !!configs.tiktokPixel?.tiktokPixelId;
    const isTiktokWebhookConfigured = !!configs.tiktokMessages?.tiktokWebhookSecret;
    const isLinkedinInsightConfigured = !!configs.linkedinInsight?.linkedinPartnerId;
    const isLinkedinWebhookConfigured = !!configs.linkedinWebhook?.linkedinWebhookSecret;
    const isGoogleAdsConfigured = !!configs.googleAds?.googleAdsId;
    const isGaConfigured = !!configs.googleAnalytics?.measurementId;
    const isGtmConfigured = !!configs.googleTagManager?.containerId;
    const isGscConfigured = !!configs.googleSearchConsole?.clientId && !!configs.googleSearchConsole?.refreshToken;
    const isHotjarConfigured = !!configs.hotjar?.siteId;
    const isAhrefsConfigured = !!configs.ahrefs?.dataKey;
    const isPayuConfigured = !!configs.payu?.merchantId;
    
    // AI config
    const aiMetrics: { label: string; value: string }[] = [];
    if (configs.aiModels?.openAiApiKey) aiMetrics.push({ label: "OpenAI", value: 'sk-... ' + configs.aiModels.openAiApiKey.slice(-4) });
    if (configs.aiModels?.anthropicApiKey) aiMetrics.push({ label: "Anthropic", value: 'sk-ant-... ' + configs.aiModels.anthropicApiKey.slice(-4) });
    if (configs.aiModels?.geminiApiKey) aiMetrics.push({ label: "Gemini", value: 'AIz... ' + configs.aiModels.geminiApiKey.slice(-4) });
    if (configs.aiModels?.deepseekApiKey) aiMetrics.push({ label: "DeepSeek", value: 'sk-... ' + configs.aiModels.deepseekApiKey.slice(-4) });
    if (configs.aiModels?.mistralApiKey) aiMetrics.push({ label: "Mistral", value: '... ' + configs.aiModels.mistralApiKey.slice(-4) });
    if (configs.aiModels?.xaiApiKey) aiMetrics.push({ label: "Grok", value: '... ' + configs.aiModels.xaiApiKey.slice(-4) });
    const isAiConfigured = aiMetrics.length > 0;

    // Video assets config
    const isVideoConfigured = !!configs.videoAssets?.provider || !!configs.videoAssets?.apiKey;

    // 2. Full Integrations List (Internal Data Catalog)
    const activeIntegrations = useMemo(() => [
        // Meta Family
        {
            id: "facebook",
            name: "Facebook & Instagram",
            description: "Conecta el Graph API para Páginas, Mensajes y Anuncios de forma unificada.",
            category: "MARKETING_ANALYTICS" as CategoryType,
            icon: <Facebook className="w-6 h-6 text-[#1877F2]" />,
            brandColor: "bg-gradient-to-r from-[#1877F2] to-blue-400",
            status: isFacebookConnected ? "connected" : "disconnected",
            providerLink: "https://developers.facebook.com/apps",
            customConnectButton: (
                <MetaConnectButton
                    provider="facebook"
                    appId={activeAppId}
                    redirectUri={computedRedirectUri}
                />
            ),
            customConfigureButton: <IntegrationConfigDialog provider="facebook" title="Meta" />,
            providerId: isFacebookConfigured ? "facebook" : undefined
        },
        {
            id: "whatsapp",
            name: "WhatsApp Business API",
            description: "Integración oficial Cloud API para mensajería a escala y automatización.",
            category: "SUPPORT_BILLING" as CategoryType,
            icon: <MessageSquare className="w-6 h-6 text-[#25D366]" />,
            brandColor: "bg-gradient-to-r from-[#25D366] to-emerald-400",
            status: isWhatsappConfigured ? "connected" : "disconnected",
            providerLink: "https://developers.facebook.com/docs/whatsapp/cloud-api",
            customConfigureButton: <IntegrationConfigDialog provider="whatsapp" title="WhatsApp Business" />,
            metrics: isWhatsappConfigured ? [{ label: "Envíos (Mes)", value: "0 / 1000" }] : undefined,
            providerId: isWhatsappConfigured ? "whatsapp" : undefined
        },
        {
            id: "facebook-pixel",
            name: "Meta Pixel",
            description: "Rastreador de conversiones para optimizar el rendimiento de la publicidad.",
            category: "MARKETING_ANALYTICS" as CategoryType,
            icon: <Activity className="w-6 h-6 text-indigo-600" />,
            brandColor: "bg-gradient-to-r from-blue-600 to-indigo-600",
            status: isPixelConfigured ? "connected" : "disconnected",
            providerLink: "https://business.facebook.com/events_manager2",
            customConfigureButton: <IntegrationConfigDialog provider="facebook-pixel" title="Meta Pixel" />,
            metrics: isPixelConfigured ? [{ label: "Pixel ID", value: String(configs.pixel.pixelId) }] : undefined,
            providerId: isPixelConfigured ? "facebook-pixel" : undefined
        },
        // TikTok Family
        {
            id: "tiktok-ads",
            name: "TikTok Pixel & Events API",
            description: "Rastrea eventos y maximiza el retorno de anuncios en la red de TikTok.",
            category: "MARKETING_ANALYTICS" as CategoryType,
            icon: <Globe className="w-6 h-6 text-pink-600" />,
            brandColor: "bg-gradient-to-r from-pink-600 to-rose-400",
            status: isTiktokPixelConfigured ? "connected" : "disconnected",
            providerLink: "https://ads.tiktok.com/i18n/events",
            customConfigureButton: <IntegrationConfigDialog provider="tiktok-ads" title="TikTok Ads" />,
            metrics: isTiktokPixelConfigured ? [{ label: "Pixel ID", value: String(configs.tiktokPixel.tiktokPixelId) }] : undefined,
            providerId: isTiktokPixelConfigured ? "tiktok-ads" : undefined
        },
        {
            id: "tiktok-messages",
            name: "TikTok Comments & Webhooks",
            description: "Recibe comentarios webhooks de TikTok para tu CRM.",
            category: "SUPPORT_BILLING" as CategoryType,
            icon: <Globe className="w-6 h-6 text-pink-500" />,
            brandColor: "bg-gradient-to-r from-pink-500 to-rose-500",
            status: isTiktokWebhookConfigured ? "connected" : "disconnected",
            providerLink: "https://developers.tiktok.com",
            customConfigureButton: <IntegrationConfigDialog provider="tiktok-messages" title="TikTok Webhooks" />,
            providerId: isTiktokWebhookConfigured ? "tiktok-messages" : undefined
        },
        // LinkedIn Family
        {
            id: "linkedin-ads",
            name: "LinkedIn Insight Tag & CAPI",
            description: "Sincroniza conversiones B2B de forma precisa con el servidor de LinkedIn.",
            category: "MARKETING_ANALYTICS" as CategoryType,
            icon: <Linkedin className="w-6 h-6 text-[#0A66C2]" />,
            brandColor: "bg-gradient-to-r from-[#0A66C2] to-blue-400",
            status: isLinkedinInsightConfigured ? "connected" : "disconnected",
            providerLink: "https://www.linkedin.com/campaignmanager",
            customConfigureButton: <IntegrationConfigDialog provider="linkedin-ads" title="LinkedIn Ads" />,
            metrics: isLinkedinInsightConfigured ? [{ label: "Partner ID", value: String(configs.linkedinInsight.linkedinPartnerId) }] : undefined,
            providerId: isLinkedinInsightConfigured ? "linkedin-ads" : undefined
        },
        {
            id: "linkedin-webhook",
            name: "LinkedIn Organization Webhooks",
            description: "Recibe webhooks de estado de organización y seguidores de LinkedIn.",
            category: "SUPPORT_BILLING" as CategoryType,
            icon: <Linkedin className="w-6 h-6 text-[#0A66C2]" />,
            brandColor: "bg-gradient-to-r from-[#0A66C2] to-cyan-400",
            status: isLinkedinWebhookConfigured ? "connected" : "disconnected",
            providerLink: "https://www.linkedin.com/feed",
            customConfigureButton: <IntegrationConfigDialog provider="linkedin-webhook" title="LinkedIn Webhooks" />,
            providerId: isLinkedinWebhookConfigured ? "linkedin-webhook" : undefined
        },
        // Google & Analytics Family
        {
            id: "google-analytics",
            name: "Google Analytics 4",
            description: "Analítica avanzada, seguimiento de eventos del lado del servidor y reportes.",
            category: "MARKETING_ANALYTICS" as CategoryType,
            icon: <BarChart3 className="w-6 h-6 text-[#F9AB00]" />,
            brandColor: "bg-gradient-to-r from-[#F9AB00] to-orange-400",
            status: isGaConfigured ? "connected" : "disconnected",
            providerLink: "https://analytics.google.com/",
            customConfigureButton: <IntegrationConfigDialog provider="google-analytics" title="Google Analytics 4" />,
            metrics: isGaConfigured ? [{ label: "Measurement ID", value: String(configs.googleAnalytics.measurementId) }] : undefined,
            providerId: isGaConfigured ? "google-analytics" : undefined
        },
        {
            id: "google-tag-manager",
            name: "Google Tag Manager",
            description: "Administra todas las etiquetas de tu sitio web de forma rápida y centralizada.",
            category: "MARKETING_ANALYTICS" as CategoryType,
            icon: <Activity className="w-6 h-6 text-blue-600" />,
            brandColor: "bg-gradient-to-r from-blue-500 to-teal-400",
            status: isGtmConfigured ? "connected" : "disconnected",
            providerLink: "https://tagmanager.google.com/",
            customConfigureButton: <IntegrationConfigDialog provider="google-tag-manager" title="Google Tag Manager" />,
            metrics: isGtmConfigured ? [{ label: "Container ID", value: String(configs.googleTagManager.containerId) }] : undefined,
            providerId: isGtmConfigured ? "google-tag-manager" : undefined
        },
        {
            id: "google-search-console",
            name: "Google Search Console",
            description: "Monitoreo de indexación de URLs del sitemap, rastreo en vivo de Googlebot y auditoría SEO en tiempo real.",
            category: "MARKETING_ANALYTICS" as CategoryType,
            icon: <Globe className="w-6 h-6 text-teal-500" />,
            brandColor: "bg-gradient-to-r from-teal-500 to-emerald-400",
            status: isGscConfigured ? "connected" : "disconnected",
            providerLink: "https://search.google.com/search-console",
            customConfigureButton: <IntegrationConfigDialog provider="google-search-console" title="Google Search Console" />,
            metrics: isGscConfigured ? [{ label: "Client ID", value: String(configs.googleSearchConsole.clientId).substring(0, 15) + "..." }] : undefined,
            providerId: "google-search-console"
        },
        {
            id: "google-ads",
            name: "Google & YouTube Ads",
            description: "Habilita conversiones mejoradas y remarketing en la red de búsqueda, display y video (YouTube).",
            category: "MARKETING_ANALYTICS" as CategoryType,
            icon: <Megaphone className="w-6 h-6 text-[#4285F4]" />,
            brandColor: "bg-gradient-to-r from-[#4285F4] to-blue-400",
            status: isGoogleAdsConfigured ? "connected" : "disconnected",
            providerLink: "https://ads.google.com",
            customConfigureButton: <IntegrationConfigDialog provider="google-ads" title="Google & YouTube Ads" />,
            metrics: isGoogleAdsConfigured ? [{ label: "AW Tag ID", value: String(configs.googleAds.googleAdsId) }] : undefined,
            providerId: isGoogleAdsConfigured ? "google-ads" : undefined
        },
        // Others
        {
            id: "hotjar",
            name: "Hotjar",
            description: "Software de mapas de calor, grabaciones de sesiones y encuestas en vivo.",
            category: "MARKETING_ANALYTICS" as CategoryType,
            icon: <Flame className="w-6 h-6 text-[#FD3259]" />,
            brandColor: "bg-gradient-to-r from-[#FD3259] to-rose-400",
            status: isHotjarConfigured ? "connected" : "disconnected",
            providerLink: "https://insights.hotjar.com/",
            customConfigureButton: <IntegrationConfigDialog provider="hotjar" title="Hotjar" />,
            metrics: isHotjarConfigured ? [{ label: "Site ID", value: String(configs.hotjar.siteId) }] : undefined,
            providerId: isHotjarConfigured ? "hotjar" : undefined
        },
        {
            id: "ahrefs",
            name: "Ahrefs",
            description: "Ahrefs Web Analytics (sin cookies) para analítica de visitantes.",
            category: "MARKETING_ANALYTICS" as CategoryType,
            icon: <Activity className="w-6 h-6 text-[#F97316]" />,
            brandColor: "bg-gradient-to-r from-[#F97316] to-orange-400",
            status: isAhrefsConfigured ? "connected" : "disconnected",
            providerLink: "https://ahrefs.com/webmaster-tools",
            customConfigureButton: <IntegrationConfigDialog provider="ahrefs" title="Ahrefs" />,
            metrics: isAhrefsConfigured ? [{ label: "Data Key", value: String(configs.ahrefs.dataKey).slice(0, 8) + '...' }] : undefined,
            providerId: isAhrefsConfigured ? "ahrefs" : undefined
        },
        // Support, Billing & Payments
        {
            id: "payu",
            name: "PayU Gateway Latam",
            description: "Pasarela de pagos líder en Latinoamérica: procesa tarjetas de crédito, PSE y pagos locales.",
            category: "SUPPORT_BILLING" as CategoryType,
            icon: <BarChart3 className="w-6 h-6 text-[#A5C31A]" />,
            brandColor: "bg-gradient-to-r from-[#A5C31A] to-lime-500",
            status: isPayuConfigured ? "connected" : "disconnected",
            providerLink: "https://www.payu.com",
            customConfigureButton: <IntegrationConfigDialog provider="payu" title="PayU" />,
            metrics: isPayuConfigured ? [{ label: "Merchant ID", value: String(configs.payu.merchantId) }] : undefined,
            providerId: isPayuConfigured ? "payu" : undefined
        },
        // AI & Automation
        {
            id: "ai-models",
            name: "Frontier AI Models & LLMs",
            description: "Motor cognitivo para los agentes autónomos. Soporta OpenAI, Anthropic (Claude), Google (Gemini), DeepSeek, Mistral y xAI (Grok).",
            category: "AI_AUTOMATION" as CategoryType,
            icon: <Bot className="w-6 h-6 text-white" />,
            brandColor: "bg-gradient-to-r from-violet-600 to-fuchsia-600",
            status: isAiConfigured ? "connected" : "disconnected",
            providerLink: "#",
            customConfigureButton: <IntegrationConfigDialog provider="ai-models" title="Modelos de Inteligencia Artificial" />,
            metrics: isAiConfigured ? aiMetrics.slice(0, 2) : undefined, // limit to 2 for preview
            providerId: isAiConfigured ? "ai-models" : undefined
        },
        {
            id: "video-assets",
            name: "Cloudinary Video Delivery",
            description: "Gestión avanzada de assets de video, optimizaciones sobre la marcha e integraciones de streaming.",
            category: "AI_AUTOMATION" as CategoryType,
            icon: <Play className="w-6 h-6 text-cyan-400" />,
            brandColor: "bg-gradient-to-r from-cyan-600 to-blue-600",
            status: isVideoConfigured ? "connected" : "disconnected",
            providerLink: "https://cloudinary.com",
            customConfigureButton: <IntegrationConfigDialog provider="video-assets" title="Cloudinary Video" />,
            metrics: isVideoConfigured ? [{ label: "Provider", value: String(configs.videoAssets?.provider || 'Cloudinary') }] : undefined,
            providerId: isVideoConfigured ? "video-assets" : undefined
        }
    ], [
        isFacebookConnected, isFacebookConfigured, activeAppId, computedRedirectUri,
        isWhatsappConfigured, isPixelConfigured, configs, isTiktokPixelConfigured,
        isTiktokWebhookConfigured, isLinkedinInsightConfigured, isLinkedinWebhookConfigured,
        isGoogleAdsConfigured, isGaConfigured, isGtmConfigured, isGscConfigured,
        isHotjarConfigured, isAhrefsConfigured, isPayuConfigured, isAiConfigured,
        aiMetrics, isVideoConfigured
    ]);

    // 3. New / Coming Soon Integrations catalog mapping
    const libraryAddons = useMemo(() => [
        // CRM
        { key: "HUBSPOT", name: "HubSpot CRM", desc: "Sincronización bidireccional de contactos y deals", logo: "🔶", category: "CRM_SALES" as CategoryType },
        { key: "DYNAMICS365", name: "Microsoft Dynamics 365", desc: "Integración con el ecosistema Microsoft", logo: "🪟", category: "CRM_SALES" as CategoryType },
        { key: "ZOHO", name: "Zoho CRM", desc: "Sincronización con Zoho CRM y módulos", logo: "🏢", category: "CRM_SALES" as CategoryType },
        { key: "GMAIL", name: "Gmail API", desc: "Envío y lectura automatizada de correos corporativos", logo: "📧", category: "CRM_SALES" as CategoryType },
        { key: "GOOGLE_MEET", name: "Google Meet", desc: "Creación automática de salas de reunión", logo: "📹", category: "CRM_SALES" as CategoryType },
        { key: "GOOGLE_DRIVE", name: "Google Drive", desc: "Almacenamiento y gestión de documentos automatizada", logo: "📂", category: "CRM_SALES" as CategoryType },
        // Marketing
        { key: "MAILCHIMP", name: "Mailchimp", desc: "Sincroniza listas de email marketing y audiencias", logo: "🐒", category: "MARKETING_ANALYTICS" as CategoryType },
        { key: "EVENTBRITE", name: "Eventbrite", desc: "Importa asistentes y gestiona eventos automáticamente", logo: "🎟️", category: "MARKETING_ANALYTICS" as CategoryType },
        { key: "GOTOWEBINAR", name: "GoToWebinar", desc: "Sincroniza registros y datos de asistentes a tus webinars", logo: "🌐", category: "MARKETING_ANALYTICS" as CategoryType },
        { key: "SURVEYMONKEY", name: "SurveyMonkey", desc: "Envía encuestas automatizadas y recopila feedback", logo: "🐵", category: "MARKETING_ANALYTICS" as CategoryType },
        // Support
        { key: "OPENCLAW", name: "OpenClaw Gateway", desc: "Gateway unificado omnicanal: Telegram, Discord, Slack y más de 20 canales.", logo: "🦀", category: "SUPPORT_BILLING" as CategoryType },
        { key: "TWILIO", name: "Twilio SMS/Voice", desc: "Mensajes SMS y llamadas de voz programáticas", logo: "📱", category: "SUPPORT_BILLING" as CategoryType },
        { key: "SLACK", name: "Slack Link", desc: "Notificaciones y alertas directamente a canales de Slack", logo: "💬", category: "SUPPORT_BILLING" as CategoryType },
        { key: "RESEND", name: "Resend Mail", desc: "Transactional email de alta entregabilidad", logo: "✉️", category: "SUPPORT_BILLING" as CategoryType },
        // AI
        { key: "ZAPIER", name: "Zapier Connect", desc: "Conecta con más de 6,000 aplicaciones vía Zapier", logo: "⚡", category: "AI_AUTOMATION" as CategoryType },
        { key: "AWS_S3", name: "AWS S3 Cloud", desc: "Almacenamiento de archivos y assets en la nube", logo: "☁️", category: "AI_AUTOMATION" as CategoryType },
        { key: "JIRA", name: "Jira Software", desc: "Creación y seguimiento de tickets automático", logo: "🔷", category: "AI_AUTOMATION" as CategoryType },
    ], []);

    // 4. Combined Filtering logic
    const filteredActive = useMemo(() => {
        return activeIntegrations.filter(item => {
            const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                  item.description.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
            const matchesStatus = statusFilter === 'ALL' || 
                                  (statusFilter === 'CONNECTED' && item.status === 'connected') ||
                                  (statusFilter === 'DISCONNECTED' && item.status === 'disconnected');
            return matchesSearch && matchesCategory && matchesStatus;
        });
    }, [activeIntegrations, searchQuery, selectedCategory, statusFilter]);

    const filteredAddons = useMemo(() => {
        // Addons are always disconnected/unconfigured in the DB for now
        if (statusFilter === 'CONNECTED') return [];
        return libraryAddons.filter(item => {
            const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                  item.desc.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
            
            // Only show if provider is not already configured in active integrations
            const isConfigured = connectedProviders.includes(item.key.toLowerCase());
            return matchesSearch && matchesCategory && !isConfigured;
        });
    }, [libraryAddons, searchQuery, selectedCategory, statusFilter, connectedProviders]);

    const categoriesList = [
        { id: 'ALL' as CategoryType, name: 'Todas', icon: <LayoutGrid size={13} />, count: activeIntegrations.length + libraryAddons.length },
        { id: 'CRM_SALES' as CategoryType, name: 'CRM & Ventas', icon: <SlidersHorizontal size={13} />, count: activeIntegrations.filter(i => i.category === 'CRM_SALES').length + libraryAddons.filter(i => i.category === 'CRM_SALES').length },
        { id: 'MARKETING_ANALYTICS' as CategoryType, name: 'Marketing & Analítica', icon: <BarChart3 size={13} />, count: activeIntegrations.filter(i => i.category === 'MARKETING_ANALYTICS').length + libraryAddons.filter(i => i.category === 'MARKETING_ANALYTICS').length },
        { id: 'SUPPORT_BILLING' as CategoryType, name: 'Soporte & Pagos', icon: <MessageSquare size={13} />, count: activeIntegrations.filter(i => i.category === 'SUPPORT_BILLING').length + libraryAddons.filter(i => i.category === 'SUPPORT_BILLING').length },
        { id: 'AI_AUTOMATION' as CategoryType, name: 'IA & Nube', icon: <Terminal size={13} />, count: activeIntegrations.filter(i => i.category === 'AI_AUTOMATION').length + libraryAddons.filter(i => i.category === 'AI_AUTOMATION').length }
    ];

    const hasResults = filteredActive.length > 0 || filteredAddons.length > 0;

    return (
        <div className="space-y-6 relative z-10">
            {/* Search & Filter Toolbar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
                
                {/* Search Bar */}
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Buscar herramienta de integración..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 hover:border-slate-800 focus:border-teal-500/50 text-white rounded-lg pl-9 pr-4 py-2 text-xs focus:outline-none transition-all"
                    />
                </div>

                {/* Status Quick Filters */}
                <div className="flex items-center gap-2 p-1 bg-slate-950 border border-slate-850 rounded-lg self-start md:self-auto shrink-0">
                    <button
                        onClick={() => setStatusFilter('ALL')}
                        className={`px-3 py-1 rounded text-xs font-mono transition-all ${statusFilter === 'ALL' ? 'bg-teal-500/20 text-teal-400 border border-teal-500/25' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        Todas
                    </button>
                    <button
                        onClick={() => setStatusFilter('CONNECTED')}
                        className={`px-3 py-1 rounded text-xs font-mono transition-all ${statusFilter === 'CONNECTED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/25' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        Conectadas
                    </button>
                    <button
                        onClick={() => setStatusFilter('DISCONNECTED')}
                        className={`px-3 py-1 rounded text-xs font-mono transition-all ${statusFilter === 'DISCONNECTED' ? 'bg-slate-800 text-slate-300' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        Desconectadas
                    </button>
                </div>
            </div>

            {/* Main Library Navigation & Grid */}
            <div className="flex flex-col lg:flex-row gap-6 items-start">
                
                {/* Left Category Menu */}
                <nav className="w-full lg:w-60 flex flex-row lg:flex-col gap-1.5 overflow-x-auto lg:overflow-x-visible shrink-0 pb-2 lg:pb-0 scrollbar-none">
                    {categoriesList.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.id)}
                            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-200 shrink-0 lg:w-full text-left justify-between ${
                                selectedCategory === cat.id
                                    ? "bg-teal-500/20 text-teal-400 border border-teal-500/20 shadow-md shadow-teal-500/5"
                                    : "text-slate-400 hover:text-slate-300 hover:bg-slate-800/40 border border-transparent"
                            }`}
                        >
                            <div className="flex items-center gap-2">
                                {cat.icon}
                                <span>{cat.name}</span>
                            </div>
                            <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full ${
                                selectedCategory === cat.id ? "bg-teal-500/30 text-teal-300" : "bg-slate-800/60 text-slate-500"
                            }`}>
                                {cat.count}
                            </span>
                        </button>
                    ))}
                </nav>

                {/* Grid Catalog Display */}
                <div className="flex-1 w-full space-y-8">
                    {hasResults ? (
                        <>
                            {/* Active Integrations Grid */}
                            {filteredActive.length > 0 && (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-slate-400 font-mono text-[10px] uppercase tracking-wider">
                                        <CheckCircle2 size={12} className="text-teal-400" />
                                        <span>Herramientas Centrales Disponibles ({filteredActive.length})</span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {filteredActive.map(item => (
                                            <IntegrationAppCard
                                                key={item.id}
                                                name={item.name}
                                                description={item.description}
                                                icon={item.icon}
                                                brandColor={item.brandColor}
                                                status={item.status as any}
                                                customConnectButton={item.customConnectButton}
                                                customConfigureButton={item.customConfigureButton}
                                                metrics={item.metrics}
                                                providerLink={item.providerLink}
                                                providerId={item.providerId}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Standard Email Domain Card (Only shows under All or Support category) */}
                            {(selectedCategory === 'ALL' || selectedCategory === 'SUPPORT_BILLING') && statusFilter !== 'CONNECTED' && !searchQuery && (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-slate-400 font-mono text-[10px] uppercase tracking-wider">
                                        <Sparkles size={12} className="text-teal-400" />
                                        <span>Servicios Adicionales (1)</span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <EmailDomainCard />
                                    </div>
                                </div>
                            )}

                            {/* Coming Soon/Unconfigured Addons Grid */}
                            {filteredAddons.length > 0 && (
                                <div className="space-y-4 pt-4">
                                    <div className="flex items-center gap-2 text-slate-400 font-mono text-[10px] uppercase tracking-wider">
                                        <AlertCircle size={12} className="text-violet-400" />
                                        <span>Módulos de Biblioteca & Addons ({filteredAddons.length})</span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {filteredAddons.map(addon => (
                                            <NewIntegrationCard
                                                key={addon.key}
                                                integration={{
                                                    key: addon.key,
                                                    name: addon.name,
                                                    desc: addon.desc,
                                                    logo: addon.logo
                                                }}
                                                status={{
                                                    status: connectedProviders.includes(addon.key.toLowerCase()) ? "OK" : "UNCONFIGURED"
                                                }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center text-center p-12 py-20 bg-slate-900/20 border border-slate-850 rounded-xl space-y-3">
                            <AlertCircle className="w-10 h-10 text-slate-600 animate-pulse" />
                            <h4 className="text-sm font-bold text-white uppercase tracking-wide">No se encontraron integraciones</h4>
                            <p className="text-slate-400 text-xs max-w-sm">
                                Ninguna herramienta coincide con el término de búsqueda o filtros seleccionados en este momento.
                            </p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}

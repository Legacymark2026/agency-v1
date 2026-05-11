import { Metadata } from 'next';
import Link from 'next/link';
import { siteConfig } from '@/lib/site-config';
import { PlanSelector } from '@/components/subscription/plan-selector';
import { ShieldCheck, Zap, BarChart3, CheckCircle2, Check, X, Minus, ArrowRight, Terminal, CreditCard, RefreshCw, Shield, Clock, HeadphonesIcon } from 'lucide-react';
import Script from 'next/script';

const SUBSCRIPTION_FAQS = [
    {
        id: "cambio",
        icon: RefreshCw,
        question: "¿Puedo cambiar de plan en cualquier momento?",
        answer: "Sí, puedes hacer upgrade o downgrade de tu plan cuando lo necesites. Los cambios se aplican de manera inmediata y la diferencia de precio se ajusta en tu próximo ciclo de facturación. Tus datos y configuraciones se mantienen intactos durante el cambio."
    },
    {
        id: "pagos",
        icon: CreditCard,
        question: "¿Qué métodos de pago aceptan?",
        answer: "Aceptamos tarjetas de crédito y débito (Visa, Mastercard, American Express) a través de Stripe, la pasarela de pagos más segura del mundo. También aceptamos PayPal y PSE para pagos desde Colombia. Todos los pagos están protegidos con encriptación de nivel bancario."
    },
    {
        id: "facturas",
        icon: Clock,
        question: "¿Cómo puedo ver mis facturas y facturación?",
        answer: "Tienes acceso completo a tu historial de facturación desde el panel de configuración. Puedes descargar facturas en PDF de todos tus pagos, ver el detalle de tus suscripciones y gestionar tus métodos de pago en cualquier momento."
    },
    {
        id: "seguridad",
        icon: Shield,
        question: "¿Qué pasa con mis datos si cancelo mi suscripción?",
        answer: "Tus datos permanecen seguros durante 30 días después de la cancelación. Durante este período puedes exportar toda tu información o reactivar tu suscripción. Pasado este tiempo, los datos se eliminan de forma permanente según nuestra política de privacidad."
    },
    {
        id: "soporte",
        icon: HeadphonesIcon,
        question: "¿Qué nivel de soporte incluye cada plan?",
        answer: "El plan Free incluye soporte por email con tiempo de respuesta de 48 horas. El plan Pro incluye soporte prioritario con respuesta en menos de 4 horas. El plan Agency incluye un Account Manager dedicado y soporte 24/7 con respuesta inmediata."
    }
];

const COMPARISON_DATA = {
  categories: [
    {
      name: 'Límites y Recursos',
      features: [
        { name: 'Leads por mes', free: '100', pro: '5,000', agency: 'Ilimitado' },
        { name: 'Usuarios', free: '1', pro: '5', agency: 'Ilimitado' },
        { name: 'Pipelines de ventas', free: '1', pro: '3', agency: 'Ilimitado' },
        { name: 'Emails por mes', free: '500', pro: '10,000', agency: '100,000' },
        { name: 'Campañas por mes', free: '1', pro: '10', agency: '999' },
        { name: 'AI Agents', free: '1', pro: '3', agency: '999' },
        { name: 'Interacciones AI/mes', free: '50', pro: '5,000', agency: 'Ilimitado' },
      ]
    },
    {
      name: 'CRM y Funciones',
      features: [
        { name: 'CRM completo', free: false, pro: true, agency: true },
        { name: 'Pipeline de ventas', free: false, pro: true, agency: true },
        { name: 'Gestión de contactos', free: false, pro: true, agency: true },
        { name: 'Seguimiento de deals', free: false, pro: true, agency: true },
        { name: 'Actividades y notas', free: false, pro: true, agency: true },
      ]
    },
    {
      name: 'Automatización',
      features: [
        { name: 'Workflows/Automatizaciones', free: false, pro: true, agency: true },
        { name: 'Mensajería entrante', free: false, pro: true, agency: true },
        { name: 'Secuencias de email', free: false, pro: true, agency: true },
        { name: 'Webhooks personalizados', free: false, pro: true, agency: true },
        { name: 'Zapier Integration', free: false, pro: true, agency: true },
      ]
    },
    {
      name: 'Integraciones',
      features: [
        { name: 'Instagram', free: true, pro: true, agency: true },
        { name: 'Facebook', free: true, pro: true, agency: true },
        { name: 'WhatsApp', free: false, pro: true, agency: true },
        { name: 'TikTok', free: false, pro: true, agency: true },
        { name: 'LinkedIn', free: false, pro: true, agency: true },
        { name: 'Google Ads', free: false, pro: true, agency: true },
        { name: 'Meta Pixel', free: false, pro: false, agency: true },
        { name: 'CAPI (Conversions API)', free: false, pro: false, agency: true },
      ]
    },
    {
      name: 'Analytics e Informes',
      features: [
        { name: 'Analytics básico', free: true, pro: false, agency: false },
        { name: 'Analytics avanzado', free: false, pro: true, agency: false },
        { name: 'Reportes avanzados', free: false, pro: true, agency: true },
        { name: 'Dashboard personalizado', free: false, pro: true, agency: true },
        { name: 'Exportación de datos', free: false, pro: true, agency: true },
      ]
    },
    {
      name: 'Equipo y Colaboración',
      features: [
        { name: 'Gestión de equipos', free: false, pro: false, agency: true },
        { name: 'Roles y permisos', free: false, pro: true, agency: true },
        { name: 'Comentarios en deals', free: false, pro: true, agency: true },
        { name: 'Actividad del equipo', free: false, pro: true, agency: true },
      ]
    },
    {
      name: 'Marca y Personalización',
      features: [
        { name: 'White-label', free: false, pro: false, agency: true },
        { name: 'Branding personalizado', free: false, pro: false, agency: true },
        { name: 'Dominio personalizado', free: false, pro: false, agency: true },
        { name: 'Logo y colores propios', free: false, pro: false, agency: true },
      ]
    },
    {
      name: 'Desarrollo y API',
      features: [
        { name: 'API Access', free: false, pro: false, agency: true },
        { name: 'Webhooks', free: false, pro: true, agency: true },
        { name: 'Integraciones personalizadas', free: false, pro: false, agency: true },
        { name: 'Documentación API', free: false, pro: false, agency: true },
      ]
    },
    {
      name: 'Soporte y Servicio',
      features: [
        { name: 'Soporte por email', free: true, pro: false, agency: false },
        { name: 'Soporte prioritario', free: false, pro: true, agency: false },
        { name: 'Account Manager dedicado', free: false, pro: false, agency: true },
        { name: 'Onboarding personalizado', free: false, pro: true, agency: true },
        { name: 'Capacitación del equipo', free: false, pro: true, agency: true },
      ]
    },
  ]
};

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Planes y Precios | LegacyMark OS',
    description:
      'Escala tu agencia con LegacyMark OS. Elige el plan perfecto con CRM predictivo, Automatización Omnicanal y AI Video Studio integrados. Sin compromisos a largo plazo.',
    openGraph: {
      title: 'Planes y Precios - Escala tu Agencia | LegacyMark OS',
      description:
        'Escala tu agencia con LegacyMark OS. Elige el plan perfecto con CRM predictivo, Automatización Omnicanal y AI Video Studio integrados.',
      url: `${siteConfig.url}/suscripcion`,
      siteName: siteConfig.name,
      images: [
        {
          url: siteConfig.ogImage,
          width: 1200,
          height: 630,
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Planes y Precios | LegacyMark OS',
      description: 'Automatiza tu agencia con IA. Cancela cuando quieras.',
      images: [siteConfig.ogImage],
    }
  };
}

export default function SubscriptionPage() {
  const currentPlanId = 'free';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'LegacyMark OS',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'COP',
      lowPrice: '0',
      highPrice: '299000',
      offerCount: '3',
      offers: [
        {
          '@type': 'Offer',
          name: 'Free',
          price: '0',
          priceCurrency: 'COP'
        },
        {
          '@type': 'Offer',
          name: 'Pro',
          price: '99000',
          priceCurrency: 'COP'
        },
        {
          '@type': 'Offer',
          name: 'Agency',
          price: '299000',
          priceCurrency: 'COP'
        }
      ]
    }
  };

  return (
    <main className="relative bg-slate-950 text-white min-h-screen overflow-hidden selection:bg-teal-500/30">
      <Script
        id="structured-data-software"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* HUD Glow Elements */}
      <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[120%] h-[800px] bg-[radial-gradient(ellipse_at_top,rgba(20,184,166,0.15)_0%,transparent_60%)] pointer-events-none" />
      <div className="absolute top-[40%] right-[-10%] w-[500px] h-[500px] bg-teal-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Hero Section */}
      <section className="relative pt-32 pb-16 px-6 z-10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-teal-500/30 bg-teal-500/10 text-teal-400 text-sm font-medium tracking-wide uppercase mb-4 shadow-[0_0_15px_rgba(20,184,166,0.2)]">
              <Zap className="w-4 h-4" />
              <span>Infraestructura para Agencias</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-black tracking-tight text-white drop-shadow-lg">
              Invierte en Escala. <br className="hidden md:block" />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-teal-400 via-teal-300 to-indigo-400 animate-gradient">
                Domina tu Mercado.
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-slate-400 max-w-3xl mx-auto font-light leading-relaxed">
              El único ecosistema operativo que unifica CRM Predictivo con Machine Learning, Automatización Omnicanal y un Video Studio potenciado por IA.
            </p>

            <div className="flex flex-wrap justify-center gap-6 text-sm text-slate-300 pt-4 font-medium">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-teal-500" /> Cancela en cualquier momento
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-teal-500" /> Soporte prioritario
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-teal-500" /> Actualizaciones IA semanales
              </div>
            </div>
          </div>

          {/* Pricing Component from Design System */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-b from-teal-500/5 to-transparent rounded-3xl -z-10" />
            <PlanSelector
              currentPlanId={currentPlanId as any}
              isAuthenticated={false}
            />
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-24 px-6 relative z-10 bg-slate-900/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Compara nuestros planes
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Elige el plan perfecto para tu agencia. Todos los planes incluyen soporte técnico y actualizaciones constantes.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left py-6 px-4 text-slate-400 font-medium text-sm">Características</th>
                  <th className="text-center py-6 px-4">
                    <div className="flex flex-col items-center">
                      <span className="text-lg font-bold text-white">Free</span>
                      <span className="text-slate-500 text-sm">$0/mes</span>
                    </div>
                  </th>
                  <th className="text-center py-6 px-4">
                    <div className="flex flex-col items-center">
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-teal-500/10 text-teal-400 text-xs font-medium mb-2">
                        Popular
                      </span>
                      <span className="text-lg font-bold text-white">Pro</span>
                      <span className="text-teal-400 text-sm font-medium">$99,000/mes</span>
                    </div>
                  </th>
                  <th className="text-center py-6 px-4">
                    <div className="flex flex-col items-center">
                      <span className="text-lg font-bold text-white">Agency</span>
                      <span className="text-slate-500 text-sm">$299,000/mes</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_DATA.categories.map((category, catIndex) => (
                  <>
                    <tr key={category.name} className="bg-slate-800/50">
                      <td colSpan={4} className="py-3 px-4">
                        <span className="text-teal-400 font-semibold text-sm uppercase tracking-wider">
                          {category.name}
                        </span>
                      </td>
                    </tr>
                    {category.features.map((feature, featIndex) => (
                      <tr 
                        key={`${category.name}-${feature.name}`} 
                        className={`border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors ${featIndex === 0 ? '' : ''}`}
                      >
                        <td className="py-4 px-4 text-slate-300 font-medium">{feature.name}</td>
                        <td className="py-4 px-4 text-center">
                          <FeatureCell value={feature.free} />
                        </td>
                        <td className="py-4 px-4 text-center">
                          <FeatureCell value={feature.pro} />
                        </td>
                        <td className="py-4 px-4 text-center">
                          <FeatureCell value={feature.agency} />
                        </td>
                      </tr>
                    ))}
                  </>
                ))}
              </tbody>
            </table>
          </div>

          {/* CTA Final */}
          <div className="mt-16 text-center">
            <p className="text-slate-400 mb-6">
              ¿Necesitas algo personalizado? Contáctanos para crear un plan a tu medida.
            </p>
            <a 
              href="/contacto" 
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white font-medium hover:bg-slate-700 hover:border-slate-600 transition-all"
            >
              Contactar ventas
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* Trust & Social Proof */}
      <section className="py-12 border-y border-slate-800 bg-slate-900/50 backdrop-blur-sm relative z-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-center items-center gap-12 opacity-70">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-teal-500" />
            <span className="font-mono text-lg tracking-wider text-slate-300 uppercase">Seguridad Nivel Bancario</span>
          </div>
          <div className="w-px h-12 bg-slate-800 hidden md:block" />
          <div className="flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-teal-500" />
            <span className="font-mono text-lg tracking-wider text-slate-300 uppercase">99.9% Uptime SLA</span>
          </div>
        </div>
      </section>

      {/* Redesigned FAQ - Terminal Style */}
      <section className="py-24 px-6 relative z-10 bg-transparent">
        <div className="mx-auto max-w-3xl px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-sm border border-teal-900/50 bg-slate-900/60 text-teal-400 text-xs font-mono mb-6 uppercase tracking-widest shadow-sm">
              <Terminal size={12} strokeWidth={1.5} />
              Preguntas Frecuentes
            </div>
            <h2 className="text-4xl font-black tracking-[-0.04em] text-white sm:text-5xl text-balance">
              Resuelve tus dudas
            </h2>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-sm rounded-sm border border-slate-800 shadow-xl hover:shadow-[0_20px_50px_-12px_rgba(13,148,136,0.15)] transition-shadow duration-500 overflow-hidden">
            <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
              </div>
              <div className="mx-auto text-xs font-mono text-slate-400">billing_protocol_v2.sh</div>
            </div>

            <div className="p-6 md:p-8">
              <div className="space-y-4">
                {SUBSCRIPTION_FAQS.map((faq) => (
                  <div 
                    key={faq.id}
                    className="group border border-slate-800 rounded-sm px-4 hover:border-teal-500/30 hover:bg-slate-900 transition-all duration-300"
                  >
                    <details className="group">
                      <summary className="flex items-center gap-3 py-4 cursor-pointer list-none">
                        <faq.icon size={16} strokeWidth={1.5} className="text-teal-500 shrink-0" />
                        <span className="text-white font-bold text-sm md:text-base group-hover:text-teal-400 transition-colors">
                          {faq.question}
                        </span>
                        <ArrowRight className="w-4 h-4 text-slate-500 ml-auto group-open:rotate-90 transition-transform" />
                      </summary>
                      <div className="text-slate-400 pl-7 pb-4 leading-relaxed font-light text-sm md:text-base">
                        {faq.answer}
                      </div>
                    </details>
                  </div>
                ))}
              </div>

              {/* CTA Final */}
              <div className="mt-8 pt-8 border-t border-slate-800 text-center">
                <Link href="/contacto" className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-500 text-white rounded-sm font-bold transition-colors">
                  ¿Necesitas más información? Contactar
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function FeatureCell({ value }: { value: boolean | string }) {
  if (typeof value === 'boolean') {
    if (value) {
      return (
        <div className="flex items-center justify-center">
          <div className="w-8 h-8 rounded-full bg-teal-500/20 flex items-center justify-center">
            <Check className="w-4 h-4 text-teal-400" />
          </div>
        </div>
      );
    }
    return (
      <div className="flex items-center justify-center">
        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center">
          <X className="w-4 h-4 text-slate-600" />
        </div>
      </div>
    );
  }
  return (
    <span className="text-white font-medium">{value}</span>
  );
}
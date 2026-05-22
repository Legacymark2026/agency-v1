import { Metadata } from 'next'
import { siteConfig } from '@/lib/site-config'
import { PlanSelector } from '@/components/subscription/plan-selector'

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Elige tu Plan - Suscripción',
    description:
      'Selecciona el plan perfecto para tu negocio. Planes para freelancers, equipos y agencias.',
    openGraph: {
      title: 'Elige tu Plan - Suscripción',
      description:
        'Selecciona el plan perfecto para tu negocio. Planes para freelancers, equipos y agencias.',
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
  }
}

export default function SubscriptionPage() {
  const currentPlanId = 'free'

  return (
    <main className="relative bg-slate-950 text-white min-h-screen overflow-hidden scroll-smooth">
      {/* Global Background Decorations */}
      <div className="bg-noise fixed inset-0 z-50 pointer-events-none mix-blend-multiply opacity-[0.015]" />
      
      {/* Global Spotlight Glow for "Wow Factor" */}
      <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[120%] h-[800px] bg-[radial-gradient(ellipse_at_top,rgba(20,184,166,0.08)_0%,transparent_60%)] pointer-events-none -z-10" />
      
      {/* Grid Background Pattern */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.02] pointer-events-none -z-10" />

      {/* Hero Section with Enhanced Styling */}
      <section className="relative py-24 px-6 text-center">
        <div className="max-w-6xl mx-auto">
          {/* Premium Badge */}
          <div className="inline-block mb-6 px-3 py-1 rounded-full bg-teal-500/10 text-teal-400 text-xs font-bold border border-teal-500/20">
            ✨ PLANES FLEXIBLES
          </div>
          
          <div className="text-center mb-16">
            {/* Ambient Glow behind text */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-teal-400/10 blur-[100px] rounded-full pointer-events-none" />
            
            <h1 className="text-5xl md:text-6xl font-black mb-6 relative z-10">
              Elige el Plan Perfecto
            </h1>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto relative z-10 leading-relaxed">
              Escalable según tus necesidades. Cambia o cancela en cualquier momento sin complicaciones.
            </p>
          </div>

          <div className="relative z-10">
            <PlanSelector
              currentPlanId={currentPlanId as any}
              isAuthenticated={false}
            />
          </div>
        </div>
      </section>

      {/* Separator with gradient */}
      <div className="relative h-px bg-gradient-to-r from-transparent via-teal-500/30 to-transparent" />

      {/* FAQ Section with Enhanced Styling */}
      <section className="relative py-20 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Section Badge */}
          <div className="inline-block mb-6 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20 mx-auto block">
            ❓ PREGUNTAS FRECUENTES
          </div>
          
          <h2 className="text-3xl md:text-4xl font-black text-center mb-12 relative z-10">
            Respuestas a tus Dudas
          </h2>
          
          <div className="space-y-4">
            <FaqItem
              question="¿Puedo cambiar de plan en cualquier momento?"
              answer="Sí, puedes upgrade o downgrade de plan en cualquier momento. Los cambios se aplicarán en el siguiente ciclo de facturación."
            />
            <FaqItem
              question="¿Qué métodos de pago aceptan?"
              answer="Aceptamos tarjetas de crédito/débito (Visa, Mastercard, American Express) a través de Stripe, y PSE para pagos en Colombia."
            />
            <FaqItem
              question="¿Hay período de prueba gratuita?"
              answer="Sí, el plan Free no tiene costo y puedes usarlo indefinidamente para probar la plataforma."
            />
            <FaqItem
              question="¿Qué pasa si excedo los límites de mi plan?"
              answer="Te notificaremos cuando alcances el 80% de tu límite. Puedes upgrade a un plan superior en cualquier momento."
            />
            <FaqItem
              question="¿Puedo cancelar mi suscripción?"
              answer="Sí, puedes cancelar en cualquier momento. Tu plan seguirá activo hasta el final del período pagado."
            />
          </div>
        </div>
      </section>

      {/* Bottom Haze (Dark) */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent z-20 pointer-events-none" />
    </main>
  )
}

function FaqItem({
  question,
  answer,
}: {
  question: string
  answer: string
}) {
  return (
    <div className="rounded-lg border border-teal-500/20 bg-teal-950/10 p-4">
      <h3 className="font-semibold mb-2">{question}</h3>
      <p className="text-muted-foreground text-sm">{answer}</p>
    </div>
  )
}

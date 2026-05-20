import { Metadata } from 'next';
import { siteConfig } from '@/lib/site-config';
import { PlanSelector } from '@/components/subscription/plan-selector';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `Suscripción | ${siteConfig.name}`,
    description: 'Elige el plan que mejor se adapta a tu negocio y crece con nosotros.',
    openGraph: {
      title: 'Suscripción',
      description: 'Planes flexibles para freelancers, equipos y agencias.',
      url: `${siteConfig.url}/suscripcion`,
      siteName: siteConfig.name,
      images: [{ url: siteConfig.ogImage, width: 1200, height: 630 }],
      type: 'website',
    },
  };
}

export default function SubscriptionPage() {
  const currentPlanId = 'free';

  return (
    <main className="relative bg-slate-950 text-white min-h-screen overflow-hidden scroll-smooth">
      {/* Background decorations */}
      <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[120%] h-[800px] bg-[radial-gradient(ellipse_at_top,rgba(20,184,166,0.08)_0%,transparent_60%)] pointer-events-none -z-10" />
      <div className="bg-noise fixed inset-0 z-50 pointer-events-none mix-blend-multiply opacity-[0.015]" />

      {/* Hero section */}
      <section className="py-24 px-6 text-center">
        <h1 className="text-5xl md:text-6xl font-black mb-6">Elige el Plan Perfecto</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          Escalable según tus necesidades. Cambia o cancela en cualquier momento.
        </p>
        <PlanSelector currentPlanId={currentPlanId as any} isAuthenticated={false} />
      </section>

      {/* FAQ */}
      <section className="py-16 px-6 border-t border-teal-500/20">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Preguntas Frecuentes</h2>
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
    </main>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <div className="rounded-lg border border-teal-500/20 bg-teal-950/10 p-4">
      <h3 className="font-semibold mb-2">{question}</h3>
      <p className="text-muted-foreground text-sm">{answer}</p>
    </div>
  );
}

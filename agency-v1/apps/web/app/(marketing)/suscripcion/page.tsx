import { Metadata } from 'next'
import { siteConfig } from '@/lib/site-config'
import { PlanSelector } from '@/components/subscription/plan-selector'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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

export default async function SubscriptionPage() {
  const session = await auth()
  let currentPlanId = 'free'

  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { companies: { include: { company: true } } },
    })

    if (user?.companies?.[0]?.company?.subscriptionTier) {
      currentPlanId = user.companies[0].company.subscriptionTier
    }
  }

  return (
    <main className="relative bg-slate-950 text-white min-h-screen">
      <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[120%] h-[600px] bg-[radial-gradient(ellipse_at_top,rgba(20,184,166,0.08)_0%,transparent_60%)] pointer-events-none" />

      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-black mb-4">
              Elige el Plan Perfecto
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Escalable según tus necesidades. Cambia o cancela en cualquier
              momento.
            </p>
          </div>

          <PlanSelector
            currentPlanId={currentPlanId as any}
            isAuthenticated={!!user}
          />
        </div>
      </section>

      <section className="py-16 px-6 border-t border-teal-500/20">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">
            Preguntas Frecuentes
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
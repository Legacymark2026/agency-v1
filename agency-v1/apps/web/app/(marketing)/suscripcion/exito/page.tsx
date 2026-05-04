import { Metadata } from 'next'
import { siteConfig } from '@/lib/site-config'
import { Button } from '@/components/ui/button'
import { CheckCircle } from 'lucide-react'
import Link from 'next/link'

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Suscripción Exitosa',
    description: 'Tu suscripción ha sido activada correctamente.',
  }
}

export default async function SubscriptionSuccessPage() {
  return (
    <main className="relative bg-slate-950 text-white min-h-screen flex items-center justify-center">
      <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[120%] h-[600px] bg-[radial-gradient(ellipse_at_top,rgba(20,184,166,0.08)_0%,transparent_60%)] pointer-events-none" />

      <div className="max-w-md w-full mx-auto px-6 py-16 text-center">
        <div className="mb-8">
          <CheckCircle className="w-20 h-20 text-green-500 mx-auto" />
        </div>

        <h1 className="text-3xl font-bold mb-4">
          ¡Suscripción Activada!
        </h1>

        <p className="text-muted-foreground mb-8">
          Tu plan ha sido activado correctamente. Ya puedes acceder a todas las funcionalidades de tu plan.
        </p>

        <div className="space-y-4">
          <Link href="/dashboard">
            <Button className="w-full size-lg">
              Ir al Dashboard
            </Button>
          </Link>

          <Link href="/suscripcion">
            <Button variant="outline" className="w-full">
              Ver Mis Planes
            </Button>
          </Link>
        </div>
      </div>
    </main>
  )
}
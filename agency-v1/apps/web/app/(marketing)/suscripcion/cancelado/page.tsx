import { Metadata } from 'next'
import { siteConfig } from '@/lib/site-config'
import { Button } from '@/components/ui/button'
import { XCircle } from 'lucide-react'
import Link from 'next/link'

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Suscripción Cancelada',
    description: 'El proceso de suscripción fue cancelado.',
  }
}

export default async function SubscriptionCanceledPage() {
  return (
    <main className="relative bg-slate-950 text-white min-h-screen flex items-center justify-center">
      <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[120%] h-[600px] bg-[radial-gradient(ellipse_at_top,rgba(20,184,166,0.08)_0%,transparent_60%)] pointer-events-none" />

      <div className="max-w-md w-full mx-auto px-6 py-16 text-center">
        <div className="mb-8">
          <XCircle className="w-20 h-20 text-red-500 mx-auto" />
        </div>

        <h1 className="text-3xl font-bold mb-4">
          Pago Cancelado
        </h1>

        <p className="text-muted-foreground mb-8">
          El proceso de suscripción fue cancelado. No se ha realizado ningún cargo a tu método de pago.
        </p>

        <div className="space-y-4">
          <Link href="/suscripcion">
            <Button className="w-full size-lg">
              Intentar de Nuevo
            </Button>
          </Link>

          <Link href="/contacto">
            <Button variant="outline" className="w-full">
              Contactar Soporte
            </Button>
          </Link>
        </div>
      </div>
    </main>
  )
}
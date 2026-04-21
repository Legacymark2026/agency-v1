"use client";

import { useState } from "react";
import { createCheckoutSession, createPortalSession } from "@/actions/billing";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CreditCard, ExternalLink, Zap } from "lucide-react";
import { toast } from "sonner";

interface BillingCardProps {
  subscriptionTier: string;
  subscriptionStatus: string;
  leadsUsed?: number;
  leadsLimit?: number;
}

export function BillingCard({ subscriptionTier, subscriptionStatus, leadsUsed = 0, leadsLimit = 100 }: BillingCardProps) {
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [loadingPortal, setLoadingPortal] = useState(false);

  const isFree = subscriptionTier === "free";
  const percentage = Math.min(100, Math.round((leadsUsed / (leadsLimit || 1)) * 100));

  async function handleUpgrade() {
    setLoadingCheckout(true);
    try {
      // Usar priceId real aquí (reemplaza 'price_xxxx' con tu Price ID de Stripe)
      const res = await createCheckoutSession("price_faketest123", "pro");
      if (res.success && typeof res.data !== 'string') {
        window.location.href = res.data.url;
      } else {
        toast.error(typeof (res as any).error === 'string' ? (res as any).error : "Failed to initiate payment");
      }
    } finally {
      setLoadingCheckout(false);
    }
  }

  async function handlePortal() {
    setLoadingPortal(true);
    try {
      const res = await createPortalSession();
      if (res.success && typeof res.data !== 'string') {
         window.location.href = res.data.url;
      } else {
         toast.error(typeof (res as any).error === 'string' ? (res as any).error : "Could not open billing portal");
      }
    } finally {
      setLoadingPortal(false);
    }
  }

  return (
    <Card className="bg-slate-900 border-slate-800 mb-6">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2 text-slate-100">
          <CreditCard className="h-5 w-5 text-teal-500" />
          Plan y Facturación (SaaS)
        </CardTitle>
        <CardDescription className="text-slate-400">
          Administra tus límites de uso, método de pago e historial de facturación.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Tier Info */}
        <div className="flex items-center justify-between p-4 bg-slate-950/50 rounded-xl border border-slate-800">
          <div>
            <h4 className="text-sm font-medium text-slate-400 mb-1">Plan Actual</h4>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold text-slate-100 capitalize">{subscriptionTier}</span>
              {subscriptionStatus === "active" && (
                <span className="px-2.5 py-0.5 rounded-full bg-teal-500/10 text-teal-400 text-xs font-medium border border-teal-500/20">
                  Activo
                </span>
              )}
            </div>
          </div>
          
          <div className="flex gap-3">
             {!isFree && (
                 <Button variant="outline" onClick={handlePortal} disabled={loadingPortal} className="border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700">
                    {loadingPortal ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ExternalLink className="mr-2 h-4 w-4" />}
                    Administrar Pagos
                 </Button>
             )}
             {isFree && (
                 <Button onClick={handleUpgrade} disabled={loadingCheckout} className="bg-teal-600 hover:bg-teal-500 text-white shadow-lg shadow-teal-500/20 transition-all font-medium">
                    {loadingCheckout ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
                    Mejorar a Pro
                 </Button>
             )}
          </div>
        </div>

        {/* Quota Progress */}
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
             <span className="text-slate-300 font-medium">Límite de Leads (Mes actual)</span>
             <span className="font-mono text-slate-400">{leadsUsed} / {leadsLimit}</span>
          </div>
          <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden">
             <div 
               className={`h-full rounded-full transition-all duration-500 ease-out ${percentage > 90 ? 'bg-red-500' : 'bg-teal-500'}`}
               style={{ width: `${percentage}%` }}
             />
          </div>
          <p className="text-xs text-slate-500">
             {percentage >= 100 
                ? "Has alcanzado tu límite de Leads. Tus prospectos no podrán ser guardados."
                : `Te quedan ${leadsLimit - leadsUsed} leads este mes antes de requerir un upgrade.`}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

"use client";

import { useState } from "react";
import { createPaymentSessionWithGateway, getPSEBanks, createBillingPortalSession as createBillingPortalSessionFn, getAvailableGateways } from "@/actions/billing";
import { isSuccess as isSuccessResult } from "@/types/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CreditCard, ExternalLink, Zap, Wallet, Building2 } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface BillingCardProps {
  subscriptionTier: string;
  subscriptionStatus: string;
  leadsUsed?: number;
  leadsLimit?: number;
}

type Gateway = "stripe" | "paypal" | "pse";

export function BillingCard({ subscriptionTier, subscriptionStatus, leadsUsed = 0, leadsLimit = 100 }: BillingCardProps) {
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [loadingPortal, setLoadingPortal] = useState(false);
  const [selectedGateway, setSelectedGateway] = useState<Gateway>("stripe");
  const [selectedBank, setSelectedBank] = useState<string>("");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [availableGateways, setAvailableGateways] = useState<Gateway[]>(["stripe"]);
  const [bankList, setBankList] = useState<Array<{ code: string; name: string }>>([]);

  const isFree = subscriptionTier === "free";
  const percentage = Math.min(100, Math.round((leadsUsed / (leadsLimit || 1)) * 100));

  async function loadGateways() {
    try {
      const gateways = await getAvailableGateways();
      setAvailableGateways(gateways as Gateway[]);
      
      if (gateways.includes("pse")) {
        const bankRes = await getPSEBanks();
        if (bankRes.success) {
          setBankList(bankRes.data);
        }
      }
    } catch (error) {
      console.error("Error loading gateways:", error);
    }
  }

  if (isFree && availableGateways.length === 1) {
    loadGateways();
  }

  async function handleUpgrade() {
    setLoadingCheckout(true);
    try {
      const res = await createPaymentSessionWithGateway(
        selectedGateway,
        "pro",
        billingCycle,
        selectedGateway === "pse" ? selectedBank : undefined
      );
      
      if (!isSuccessResult(res)) {
        const errorMsg = res.error || "Failed to initiate payment";
        toast.error(errorMsg);
      } else if (res.data.url) {
        window.location.href = res.data.url;
      }
    } finally {
      setLoadingCheckout(false);
    }
  }

  async function handlePortal() {
    setLoadingPortal(true);
    try {
      const res = await createBillingPortalSessionFn();
      if (isSuccessResult(res)) {
        window.location.href = res.data.url;
      } else {
        toast.error(res.error || "Could not open billing portal");
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

        {isFree && (
          <div className="space-y-4 p-4 bg-slate-950/30 rounded-xl border border-slate-800">
            <h4 className="text-sm font-medium text-slate-300">Selecciona tu método de pago</h4>
            
            {/* Gateway Selection */}
            <div className="grid grid-cols-3 gap-3">
              {availableGateways.includes("stripe") && (
                <button
                  onClick={() => setSelectedGateway("stripe")}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    selectedGateway === "stripe" 
                      ? "border-teal-500 bg-teal-500/10" 
                      : "border-slate-700 hover:border-slate-600"
                  }`}
                >
                  <CreditCard className="h-5 w-5 text-slate-400 mb-1" />
                  <span className="text-sm font-medium text-slate-200">Tarjeta</span>
                  <p className="text-xs text-slate-500">Stripe</p>
                </button>
              )}
              
              {availableGateways.includes("paypal") && (
                <button
                  onClick={() => setSelectedGateway("paypal")}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    selectedGateway === "paypal" 
                      ? "border-teal-500 bg-teal-500/10" 
                      : "border-slate-700 hover:border-slate-600"
                  }`}
                >
                  <Wallet className="h-5 w-5 text-slate-400 mb-1" />
                  <span className="text-sm font-medium text-slate-200">PayPal</span>
                  <p className="text-xs text-slate-500">One-click</p>
                </button>
              )}
              
              {availableGateways.includes("pse") && (
                <button
                  onClick={() => setSelectedGateway("pse")}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    selectedGateway === "pse" 
                      ? "border-teal-500 bg-teal-500/10" 
                      : "border-slate-700 hover:border-slate-600"
                  }`}
                >
                  <Building2 className="h-5 w-5 text-slate-400 mb-1" />
                  <span className="text-sm font-medium text-slate-200">PSE</span>
                  <p className="text-xs text-slate-500">Colombia</p>
                </button>
              )}
            </div>

            {/* Billing Cycle */}
            <div className="flex gap-2">
              <button
                onClick={() => setBillingCycle("monthly")}
                className={`flex-1 p-2 rounded-lg border text-sm transition-all ${
                   billingCycle === "monthly"
                     ? "border-teal-500 bg-teal-500/10 text-teal-400"
                     : "border-slate-700 text-slate-400 hover:border-slate-600"
                }`}
              >
                Mensual
              </button>
              <button
                onClick={() => setBillingCycle("yearly")}
                className={`flex-1 p-2 rounded-lg border text-sm transition-all ${
                   billingCycle === "yearly"
                     ? "border-teal-500 bg-teal-500/10 text-teal-400"
                     : "border-slate-700 text-slate-400 hover:border-slate-600"
                }`}
              >
                Anual (20% dto)
              </button>
            </div>

            {/* Bank Selection for PSE */}
            {selectedGateway === "pse" && bankList.length > 0 && (
              <Select value={selectedBank} onValueChange={setSelectedBank}>
                <SelectTrigger className="bg-slate-800 border-slate-700">
                  <SelectValue placeholder="Selecciona tu banco" />
                </SelectTrigger>
                <SelectContent>
                  {bankList.map((bank) => (
                    <SelectItem key={bank.code} value={bank.code}>
                      {bank.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        )}

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

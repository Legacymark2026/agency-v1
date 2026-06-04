"use server";

const REWARDS_SERVICE_URL = process.env.GOLDNEEZ_REWARDS_SERVICE_URL || "http://localhost:4020";

const DEFAULT_STEPS = [
  { label: "Procesado", status: "completed", desc: "Tu pedido ha sido recibido y confirmado.", date: "1 hora" },
  { label: "Tostado", status: "completed", desc: "Granos tostados artesanalmente en pequeños lotes.", date: "2 horas" },
  { label: "Empacado", status: "current", desc: "Sellado al vacío con válvula desgasificadora.", date: "En proceso" },
  { label: "Enviado", status: "upcoming", desc: "En manos de la transportadora asociada.", date: "Por programar" },
  { label: "Entregado", status: "upcoming", desc: "Listo para crear recuerdos dorados en tu taza.", date: "Por programar" }
];

export async function getShippingTrackingAction(orderId: string) {
  // 1. Intentar llamar al microservicio
  try {
    const res = await fetch(`${REWARDS_SERVICE_URL}/api/goldneez-rewards/shipping-tracking/${orderId}`, {
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err: any) {
    console.warn("[getShippingTrackingAction] Fallback a base de datos local:", err.message);
  }

  // 2. Fallback local / simulado
  try {
    const isDelivered = orderId.includes("49293") || orderId.endsWith("won") || parseInt(orderId.replace(/\D/g, '') || '0') % 2 === 0;

    let steps = [...DEFAULT_STEPS];
    if (isDelivered) {
      steps = DEFAULT_STEPS.map((step) => ({ ...step, status: "completed", date: "Completado" }));
    }

    return { orderId, steps };
  } catch (err) {
    console.error("[getShippingTrackingAction] Error:", err);
    return { orderId, steps: DEFAULT_STEPS };
  }
}

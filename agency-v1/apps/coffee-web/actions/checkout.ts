"use server";

import prismaGoldneez from "../lib/prisma";
const prisma = prismaGoldneez;
import { getMeAction } from "./auth";

/**
 * Procesa la compra del carrito registrando un Deal, un Invoice y otorgando puntos de lealtad
 */
export async function checkoutAction(
  cart: Array<{ productId: string; grind: string; size: string; quantity: number; price: number }>,
  total: number,
  userDetails: { name: string; email: string; address: string; city: string }
) {
  try {
    if (!cart || cart.length === 0) {
      return { error: "El carrito está vacío." };
    }

    const emailLower = userDetails.email.toLowerCase().trim();

    // 1. Obtener el usuario logueado o crear/buscar un usuario invitado (guest)
    const loggedInUser = await getMeAction();
    let userId = loggedInUser?.id;

    if (!userId) {
      // Buscar o crear usuario invitado
      let guestUser = await prisma.user.findUnique({
        where: { email: emailLower }
      });

      if (!guestUser) {
        const parts = userDetails.name.trim().split(/\s+/);
        const firstName = parts[0] || "";
        const lastName = parts.slice(1).join(" ") || "";

        guestUser = await prisma.user.create({
          data: {
            email: emailLower,
            name: userDetails.name.trim(),
            firstName,
            lastName,
            role: "guest",
            globalRole: "client_user"
          }
        });

        // Crear perfil inicial de invitado
        await prisma.userProfile.create({
          data: {
            userId: guestUser.id,
            preferences: JSON.stringify({}),
            metadata: JSON.stringify({
              points: 0,
              registeredAt: new Date().toLocaleDateString()
            })
          }
        });
      }

      userId = guestUser.id;
    }

    // 2. Buscar o crear la compañía para Goldneez Coffee
    let company = await prisma.company.findUnique({
      where: { slug: "goldneez" }
    });

    if (!company) {
      company = await prisma.company.create({
        data: {
          name: "Goldneez Coffee",
          slug: "goldneez",
          industry: "Food & Beverage",
          subscriptionTier: "enterprise",
          subscriptionStatus: "active"
        }
      });
    }

    // Asegurar que el usuario pertenezca a la compañía de Goldneez
    const companyUser = await prisma.companyUser.findUnique({
      where: {
        userId_companyId: {
          userId,
          companyId: company.id
        }
      }
    });

    if (!companyUser) {
      await prisma.companyUser.create({
        data: {
          userId,
          companyId: company.id,
          roleName: "member",
          permissions: JSON.stringify([])
        }
      });
    }

    // 3. Crear el Deal (Negocio Ganado)
    const deal = await prisma.deal.create({
      data: {
        companyId: company.id,
        name: `Pedido de Café - ${userDetails.name}`,
        value: total,
        stage: "won",
        assignedToUserId: userId,
      }
    });

    // 4. Crear el Invoice (Factura Pagada)
    await prisma.invoice.create({
      data: {
        companyId: company.id,
        amount: total,
        status: "paid",
        dueDate: new Date(),
      }
    });

    // 5. Otorgar puntos de lealtad (10 puntos por cada $1 gastado)
    const pointsAwarded = Math.round(total * 10);
    let newTotalPoints = pointsAwarded;

    let microserviceSuccess = false;
    try {
      const REWARDS_SERVICE_URL = process.env.GOLDNEEZ_REWARDS_SERVICE_URL || "http://localhost:4020";
      const res = await fetch(`${REWARDS_SERVICE_URL}/api/goldneez-rewards/points/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, puntos: pointsAwarded, concepto: "Compra de café en tienda" }),
        signal: AbortSignal.timeout(3000),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          newTotalPoints = data.points;
          microserviceSuccess = true;
        }
      }
    } catch (err: any) {
      console.warn("[checkoutAction] Fallback a base de datos local para otorgar puntos:", err.message);
    }

    if (!microserviceSuccess) {
      const userProfile = await prisma.userProfile.findUnique({
        where: { userId }
      });

      if (userProfile) {
        let currentMetadata: any = {};
        try {
          currentMetadata = typeof userProfile.metadata === "string"
            ? JSON.parse(userProfile.metadata)
            : userProfile.metadata || {};
        } catch {}

        const currentPoints = currentMetadata.points ?? 0;
        newTotalPoints = currentPoints + pointsAwarded;

        await prisma.userProfile.update({
          where: { userId },
          data: {
            metadata: JSON.stringify({
              ...currentMetadata,
              points: newTotalPoints,
              city: userDetails.city.trim()
            })
          }
        });

        // Registrar en historial localmente
        await prisma.goldneezPointsHistory.create({
          data: {
            userId,
            puntos: pointsAwarded,
            tipo: "earned",
            concepto: "Compra de café en tienda"
          }
        });
      }
    }


    // 6. Registrar log de actividad con los detalles de los productos
    await prisma.userActivityLog.create({
      data: {
        userId,
        action: "CHECKOUT_SUCCESS",
        details: JSON.stringify({
          source: "coffee-web",
          dealId: deal.id,
          total,
          pointsAwarded,
          newTotalPoints,
          shipping: {
            address: userDetails.address,
            city: userDetails.city,
          },
          items: cart.map(item => ({
            productId: item.productId,
            grind: item.grind,
            size: item.size,
            quantity: item.quantity,
            price: item.price
          }))
        })
      }
    });

    return {
      success: true,
      pointsAwarded,
      newTotalPoints,
      dealId: deal.id
    };

  } catch (err: any) {
    console.error("[checkoutAction] Error:", err);
    return { error: `Error al procesar el pago: ${err.message}` };
  }
}

/**
 * Obtiene el historial de pedidos del usuario conectado desde la base de datos
 */
export async function getUserOrdersAction() {
  try {
    const me = await getMeAction();
    if (!me) return [];

    // Buscar todos los Deals ganados por el usuario
    const deals = await prisma.deal.findMany({
      where: {
        assignedToUserId: me.id,
        stage: "won"
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    // Buscar logs de actividad para extraer los detalles del producto de cada Deal
    const logs = await prisma.userActivityLog.findMany({
      where: {
        userId: me.id,
        action: "CHECKOUT_SUCCESS"
      }
    });

    // Mapear los Deals al formato de pedidos requerido por el dashboard
    return deals.map(deal => {
      // Intentar encontrar el log de actividad correspondiente para recuperar detalles
      const matchingLog = logs.find(log => {
        try {
          const details = typeof log.details === "string" ? JSON.parse(log.details) : log.details;
          return details.dealId === deal.id;
        } catch {
          return false;
        }
      });

      let coffeeName = "Café de Especialidad";
      let size = "250g";
      let grind = "Grano Entero";

      if (matchingLog) {
        try {
          const details = typeof matchingLog.details === "string" ? JSON.parse(matchingLog.details) : matchingLog.details;
          if (details.items && details.items.length > 0) {
            const firstItem = details.items[0];
            // Formatear nombre del café (de "ethiopia-yirgacheffe" a "Ethiopia Yirgacheffe")
            coffeeName = firstItem.productId
              .replace(/-/g, " ")
              .replace(/\b\w/g, (c: string) => c.toUpperCase());
            size = firstItem.size;
            grind = firstItem.grind === "whole" ? "Grano Entero" : firstItem.grind;

            if (details.items.length > 1) {
              coffeeName += ` y ${details.items.length - 1} más`;
            }
          }
        } catch {}
      }

      return {
        id: `GDN-${deal.id.slice(0, 5).toUpperCase()}`,
        date: deal.createdAt.toLocaleDateString(),
        coffeeId: matchingLog ? JSON.parse(typeof matchingLog.details === "string" ? matchingLog.details : JSON.stringify(matchingLog.details))?.items[0]?.productId || "unknown" : "unknown",
        coffeeName,
        grind,
        size,
        total: deal.value,
        status: "delivered", // Por defecto entregados ya que el deal es 'won'
        tracking: `TRK-${deal.id.slice(0, 8).toUpperCase()}`
      };
    });

  } catch (err) {
    console.error("[getUserOrdersAction] Error:", err);
    return [];
  }
}

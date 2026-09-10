/**
 * Payment Service — Express Inbound Router (Driving Adapter)
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { Router, Request, Response } from "express";
import { z } from "zod";
import { IPaymentUseCases } from "../core/ports/payment.ports";

const checkoutSessionSchema = z.object({
  companyId: z.string().min(1),
  amount: z.number().positive(),
  currency: z.enum(["COP", "USD", "EUR"]).default("USD"),
  title: z.string().optional(),
  customerEmail: z.string().email().optional(),
  invoiceId: z.string().optional(),
  orderId: z.string().optional(),
  preferredProvider: z.enum(["STRIPE", "WOMPI", "PAYPAL", "MERCADOPAGO", "BOLD", "TRANSFER"]).optional(),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

const posPaymentSchema = z.object({
  companyId: z.string().min(1),
  amount: z.number().positive(),
  orderId: z.string().optional(),
  provider: z.enum(["BOLD", "REDEBAN", "WOMPI", "CREDIBANCO"]).default("BOLD"),
  cardBrand: z.string().optional(),
  cardLast4: z.string().optional(),
  terminalId: z.string().optional(),
});

export function createPaymentRouter(useCases: IPaymentUseCases): Router {
  const router = Router();

  router.get("/gateways", (_req: Request, res: Response) => {
    const gateways = useCases.getAvailableGateways();
    res.json({ success: true, gateways });
  });

  router.post("/checkout-session", async (req: Request, res: Response) => {
    try {
      const parsed = checkoutSessionSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ success: false, errors: parsed.error.errors });
      }

      const result = await useCases.createCheckoutSession(parsed.data as any);
      res.json({ success: true, ...result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  router.post("/pos/create", async (req: Request, res: Response) => {
    try {
      const parsed = posPaymentSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ success: false, errors: parsed.error.errors });
      }

      const tx = await useCases.processPOSPayment(parsed.data as any);
      res.status(201).json({ success: true, transaction: tx.toJSON() });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  router.post("/webhooks/:provider", async (req: Request, res: Response) => {
    try {
      const { provider } = req.params;
      const signature = (req.headers["stripe-signature"] || req.headers["x-signature"] || "") as string;
      const result = await useCases.handleWebhook(provider, req.body, signature);
      res.json({ success: true, ...result });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  return router;
}

import { z } from 'zod';
export const createInvoiceSchema = z.object({
  amount: z.number().positive(),
  clientId: z.string(),
  dueDate: z.string(),
  items: z.array(z.object({ name: z.string(), price: z.number() })).min(1)
});
export type CreateInvoiceDTO = z.infer<typeof createInvoiceSchema>;

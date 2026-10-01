
import { z } from 'zod';

export const createWarehouseSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    location: z.string().optional(),
    companyId: z.string().optional(), // Injected by tenantContextMiddleware
  })
});


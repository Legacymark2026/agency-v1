import { z } from 'zod';
export const createClientSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  company: z.string().optional()
});
export type CreateClientDTO = z.infer<typeof createClientSchema>;

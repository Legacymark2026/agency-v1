import { z } from 'zod';
export const createCampaignSchema = z.object({
  name: z.string().min(1),
  subject: z.string().min(1),
  audienceId: z.string(),
  content: z.string()
});
export type CreateCampaignDTO = z.infer<typeof createCampaignSchema>;

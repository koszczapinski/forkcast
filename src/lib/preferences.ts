import { z } from "zod";

// Stub so tests can import preferencesSchema. Validation rules are not implemented.
export const preferencesSchema = z.object({
  diet: z.string(),
  allergies: z.array(z.string()),
  servings: z.number(),
  budget: z.number().nullable(),
});

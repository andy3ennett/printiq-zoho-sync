import { z } from "zod";
import { EventMetaSchema } from "./common.js";

export const QuoteSchema = z
  .object({
    eventId: z.string().optional(),
    lastModified: z.string().optional(),

    quoteNo: z.string().min(1),
    status: z.string().min(1),

    customerCode: z.string().min(1),

    contactId: z.string().optional(),
    contactEmail: z.string().email().optional(),

    // Optional fields we may map later
    total: z.number().optional(),
    currency: z.string().optional()
  })
  .merge(EventMetaSchema)
  .passthrough();

export type QuotePayload = z.infer<typeof QuoteSchema>;
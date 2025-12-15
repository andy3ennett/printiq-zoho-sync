import { z } from "zod";
import { EventMetaSchema } from "./common.js";

export const InvoiceSchema = z
  .object({
    eventId: z.string().optional(),
    lastModified: z.string().optional(),

    invoiceNo: z.string().min(1),
    customerCode: z.string().min(1),

    jobReference: z.string().optional(),
    total: z.number().optional(),
    currency: z.string().optional()
  })
  .merge(EventMetaSchema)
  .passthrough();

export type InvoicePayload = z.infer<typeof InvoiceSchema>;
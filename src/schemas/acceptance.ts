import { z } from "zod";
import { EventMetaSchema } from "./common.js";

export const AcceptanceSchema = z
  .object({
    eventId: z.string().optional(),
    lastModified: z.string().optional(),

    quoteNo: z.string().min(1),
    status: z.string().min(1), // e.g. "Accepted" etc (PrintIQ-defined)
    customerCode: z.string().min(1),

    jobReference: z.string().optional() // for Sales Orders external id if present
  })
  .merge(EventMetaSchema)
  .passthrough();

export type AcceptancePayload = z.infer<typeof AcceptanceSchema>;
import { z } from "zod";
import { EventMetaSchema } from "./common.js";

export const ProductSchema = z
  .object({
    eventId: z.string().optional(),
    lastModified: z.string().optional(),

    productCode: z.string().min(1),
    name: z.string().min(1),
    unitPrice: z.number().optional(),
    active: z.boolean().optional()
  })
  .merge(EventMetaSchema)
  .passthrough();

export type ProductPayload = z.infer<typeof ProductSchema>;
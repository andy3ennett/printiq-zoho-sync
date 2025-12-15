import { z } from "zod";

/**
 * Many PrintIQ webhook payloads include event metadata.
 * Keep permissive for Phase 0 and only validate what we actually use.
 */
export const EventMetaSchema = z
  .object({
    eventId: z.string().min(1).optional(),
    lastModified: z.string().min(1).optional() // TODO: make ISO datetime if confirmed
  })
  .passthrough();

export function deriveEventKey(input: {
  eventId?: string;
  stableParts: (string | number | undefined | null)[];
}) {
  if (input.eventId) return `event:${input.eventId}`;
  const joined = input.stableParts.map((p) => String(p ?? "")).join("|");
  return `derived:${joined}`;
}
import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const EnvSchema = z.object({
  PORT: z.coerce.number().default(3000),

  ZOHO_CLIENT_ID: z.string().min(1),
  ZOHO_CLIENT_SECRET: z.string().min(1),
  ZOHO_REFRESH_TOKEN: z.string().min(1),

  ZOHO_API_BASE: z.string().url().default("https://www.zohoapis.eu/crm/v2"),
  ZOHO_ACCOUNTS_BASE: z.string().url().default("https://accounts.zoho.eu"),

  ZOHO_ORG_ID: z.string().optional(),

  PRINTIQ_BASE_URL: z.string().url().optional(),
  PRINTIQ_API_NAME: z.string().min(1).optional(),
  PRINTIQ_API_KEY: z.string().min(1).optional(),

  DEDUPE_TTL_MS: z.coerce.number().default(24 * 60 * 60 * 1000)
});

export type Env = z.infer<typeof EnvSchema>;

export function loadEnv(): Env {
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    // keep it blunt for Phase 0
    throw new Error(`Invalid env: ${parsed.error.message}`);
  }
  return parsed.data;
}

export function assertZohoEnv(env: {
  ZOHO_CLIENT_ID?: string;
  ZOHO_CLIENT_SECRET?: string;
  ZOHO_REFRESH_TOKEN?: string;
  ZOHO_API_BASE: string;
  ZOHO_ACCOUNTS_BASE: string;
  ZOHO_ORG_ID?: string;
}) {
  if (!env.ZOHO_CLIENT_ID) throw new Error("Missing ZOHO_CLIENT_ID");
  if (!env.ZOHO_CLIENT_SECRET) throw new Error("Missing ZOHO_CLIENT_SECRET");
  if (!env.ZOHO_REFRESH_TOKEN) throw new Error("Missing ZOHO_REFRESH_TOKEN");
}
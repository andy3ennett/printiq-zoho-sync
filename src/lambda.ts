import serverless from "serverless-http";
import { createApp } from "./app.js";
import { createLogger } from "./logging/logger.js";
import { InMemoryDedupeStore } from "./dedupe/InMemoryDedupeStore.js";
import { ZohoClient } from "./zoho/ZohoClient.js";
import { SyncService } from "./services/syncService.js";
import { loadEnv, assertZohoEnv } from "./config/env.js";
import { PrintIQClient } from "./printiq/PrintIQClient.js";

const env = loadEnv();
const logger = createLogger();

// Keep dedupe in-memory (Phase 0). Lambda containers may be reused; this is fine.
const dedupe = new InMemoryDedupeStore();
const dedupeTtlMs = env.DEDUPE_TTL_MS;

const maskKeyLast4 = (k?: string) => (k && k.length >= 4 ? `****${k.slice(-4)}` : "unset");

logger.info(
  {
    printiqBaseUrl: env.PRINTIQ_BASE_URL ?? "unset",
    printiqApiName: env.PRINTIQ_API_NAME ?? "unset",
    printiqApiKey: maskKeyLast4(env.PRINTIQ_API_KEY)
  },
  "PrintIQ env loaded"
);

// PrintIQ client optional (diagnostics only); webhooks don’t require it.
const printiq =
  env.PRINTIQ_BASE_URL && env.PRINTIQ_API_NAME && env.PRINTIQ_API_KEY
    ? new PrintIQClient(
        { baseUrl: env.PRINTIQ_BASE_URL, apiName: env.PRINTIQ_API_NAME, apiKey: env.PRINTIQ_API_KEY },
        logger
      )
    : undefined;

// Lazily create Zoho client so cold start doesn’t explode if env missing (but prod should have it).
const zoho = (() => {
  assertZohoEnv(env);
  return new ZohoClient(
    {
      clientId: env.ZOHO_CLIENT_ID!,
      clientSecret: env.ZOHO_CLIENT_SECRET!,
      refreshToken: env.ZOHO_REFRESH_TOKEN!,
      apiBase: env.ZOHO_API_BASE,
      accountsBase: env.ZOHO_ACCOUNTS_BASE,
      orgId: env.ZOHO_ORG_ID
    },
    logger
  );
})();

const sync = new SyncService(zoho, logger);

const app = createApp({ logger, dedupe, dedupeTtlMs, sync, printiq });

// Export Lambda handler
export const handler = serverless(app);
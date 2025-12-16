import { loadEnv, assertZohoEnv } from "./config/env.js";
import { createLogger } from "./logging/logger.js";
import { InMemoryDedupeStore } from "./dedupe/InMemoryDedupeStore.js";
import { ZohoClient } from "./zoho/ZohoClient.js";
import { SyncService } from "./services/syncService.js";
import { createApp } from "./app.js";
import { PrintIQClient } from "./printiq/PrintIQClient.js";

const env = loadEnv();
const logger = createLogger();

const dedupe = new InMemoryDedupeStore();

// lightweight periodic cleanup for local dev
setInterval(() => dedupe.cleanup(), 60_000).unref();

const printiq =
  env.PRINTIQ_BASE_URL && env.PRINTIQ_API_NAME && env.PRINTIQ_API_KEY
    ? new PrintIQClient(
        {
          baseUrl: env.PRINTIQ_BASE_URL,
          apiName: env.PRINTIQ_API_NAME,
          apiKey: env.PRINTIQ_API_KEY
        },
        logger
      )
    : undefined;

// Lazily create Zoho client so the server can boot even if Zoho env is incomplete
// (useful for /health, PrintIQ diagnostics, and local dev).
const zoho = (() => {
  try {
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
  } catch (e) {
    logger.warn({ err: e }, "Zoho env missing; webhook sync will fail until configured");
    return {
      upsert: async () => {
        throw e;
      },
      upsertReturnId: async () => {
        throw e;
      },
      findProductIdByExternalId: async () => {
        throw e;
      }
    } as any;
  }
})();

const sync = new SyncService(zoho, logger);

const app = createApp({ logger, dedupe, dedupeTtlMs: env.DEDUPE_TTL_MS, sync, printiq });

app.listen(env.PORT, () => {
  logger.info({ port: env.PORT }, "PrintIQ → Zoho sync (Phase 0) listening");
});
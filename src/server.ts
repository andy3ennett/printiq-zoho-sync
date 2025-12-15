import { loadEnv } from "./config/env.js";
import { createLogger } from "./logging/logger.js";
import { InMemoryDedupeStore } from "./dedupe/InMemoryDedupeStore.js";
import { ZohoClient } from "./zoho/ZohoClient.js";
import { SyncService } from "./services/syncService.js";
import { createApp } from "./app.js";

const env = loadEnv();
const logger = createLogger();

const dedupe = new InMemoryDedupeStore();

// lightweight periodic cleanup for local dev
setInterval(() => dedupe.cleanup(), 60_000).unref();

const zoho = new ZohoClient(
  {
    clientId: env.ZOHO_CLIENT_ID,
    clientSecret: env.ZOHO_CLIENT_SECRET,
    refreshToken: env.ZOHO_REFRESH_TOKEN,
    apiBase: env.ZOHO_API_BASE,
    accountsBase: env.ZOHO_ACCOUNTS_BASE,
    orgId: env.ZOHO_ORG_ID
  },
  logger
);

const sync = new SyncService(zoho, logger);

const app = createApp({ logger, dedupe, dedupeTtlMs: env.DEDUPE_TTL_MS, sync });

app.listen(env.PORT, () => {
  logger.info({ port: env.PORT }, "PrintIQ → Zoho sync (Phase 0) listening");
});
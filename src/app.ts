import express from "express";
import type { Logger } from "pino";
import pinoHttp from "pino-http";
import { healthRouter } from "./routes/health.js";
import { webhooksRouter } from "./routes/webhooks.js";
import type { DedupeStore } from "./dedupe/DedupeStore.js";
import type { SyncService } from "./services/syncService.js";
import { requestId } from "./middleware/requestId.js";
import { errorHandler } from "./middleware/errorHandler.js";

export function createApp(deps: {
  logger: Logger;
  dedupe: DedupeStore;
  dedupeTtlMs: number;
  sync: SyncService;
}) {
  const app = express();

  app.use(express.json({ limit: "1mb" }));
  app.use(requestId);

  app.use(
    pinoHttp({
      logger: deps.logger,
      customProps: (req) => ({ requestId: (req as any).requestId })
    })
  );

  app.use(healthRouter());
  app.use(webhooksRouter(deps));

  app.use(errorHandler(deps.logger));

  return app;
}
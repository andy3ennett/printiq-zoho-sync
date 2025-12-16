import type { Router } from "express";
import { Router as createRouter } from "express";
import type { Logger } from "pino";
import { QuoteSchema } from "../schemas/quote.js";
import { AcceptanceSchema } from "../schemas/acceptance.js";
import { ProductSchema } from "../schemas/product.js";
import { InvoiceSchema } from "../schemas/invoice.js";
import { deriveEventKey } from "../schemas/common.js";
import type { DedupeStore } from "../dedupe/DedupeStore.js";
import type { SyncService } from "../services/syncService.js";
import { capturePayload } from "../utils/payloadCapture.js";

function isQuoteGated(status: string) {
  // Non-negotiable: ignore “In Process”, only sync when “Awaiting Acceptance” or later.
  // Phase 0 simplification: treat only exact "In Process" as gated.
  // TODO: confirm full PrintIQ status taxonomy + ordering for Phase 1.
  return status === "In Process";
}

function classifyZohoError(err: any): "4xx" | "retryable" {
  // If our Zoho client parsed a per-record rejection from a 200 response,
  // treat it as non-retryable (retrying won't help without data/layout changes).
  if (err?.zohoRejected) return "4xx";

  const status = err?.response?.status as number | undefined;
  if (status && status >= 400 && status < 500) return "4xx";
  return "retryable"; // 5xx, network, timeout, unknown
}

export function webhooksRouter(deps: {
  logger: Logger;
  dedupe: DedupeStore;
  dedupeTtlMs: number;
  sync: SyncService;
}): Router {
  const r = createRouter();

  r.post("/webhooks/printiq/quote", async (req, res) => {
    void capturePayload("quote", req.body).catch((e) => deps.logger.warn({ err: e }, "Payload capture failed"));

    const parsed = QuoteSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ ok: false, error: "Invalid payload" });

    const payload = parsed.data;

    deps.logger.info(
      { eventType: "quote", quoteNo: payload.quoteNo, status: payload.status },
      "Webhook received"
    );

    if (isQuoteGated(payload.status)) {
      deps.logger.info({ quoteNo: payload.quoteNo, status: payload.status }, "Quote gated (ignored)");
      return res.status(200).json({ ok: true, ignored: true });
    }

    const key = deriveEventKey({
      eventId: payload.eventId,
      stableParts: [payload.quoteNo, payload.status, payload.lastModified]
    });

    if (!deps.dedupe.recordOnce(`quote:${key}`, deps.dedupeTtlMs)) {
      deps.logger.info({ key }, "Duplicate quote event (ignored)");
      return res.status(200).json({ ok: true, duplicate: true });
    }

    try {
      await deps.sync.syncQuote(payload);
      return res.status(200).json({ ok: true });
    } catch (err) {
      const cls = classifyZohoError(err);
      deps.logger.error({ err, cls, key }, "Quote sync failed");
      if (cls === "4xx") return res.status(200).json({ ok: true, failed: "non-retryable" });
      return res.status(202).json({ ok: true, retryNeeded: true });
    }
  });

  r.post("/webhooks/printiq/acceptance", async (req, res) => {
    void capturePayload("acceptance", req.body).catch((e) =>
      deps.logger.warn({ err: e }, "Payload capture failed")
    );

    const parsed = AcceptanceSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ ok: false, error: "Invalid payload" });

    const payload = parsed.data;

    deps.logger.info(
      { eventType: "acceptance", quoteNo: payload.quoteNo, status: payload.status, jobReference: payload.jobReference },
      "Webhook received"
    );

    const key = deriveEventKey({
      eventId: payload.eventId,
      stableParts: [payload.quoteNo, payload.status, payload.lastModified]
    });

    if (!deps.dedupe.recordOnce(`acceptance:${key}`, deps.dedupeTtlMs)) {
      deps.logger.info({ key }, "Duplicate acceptance event (ignored)");
      return res.status(200).json({ ok: true, duplicate: true });
    }

    try {
      await deps.sync.syncAcceptance(payload);
      return res.status(200).json({ ok: true });
    } catch (err) {
      const cls = classifyZohoError(err);
      deps.logger.error({ err, cls, key }, "Acceptance sync failed");
      if (cls === "4xx") return res.status(200).json({ ok: true, failed: "non-retryable" });
      return res.status(202).json({ ok: true, retryNeeded: true });
    }
  });

  r.post("/webhooks/printiq/product", async (req, res) => {
    void capturePayload("product", req.body).catch((e) => deps.logger.warn({ err: e }, "Payload capture failed"));

    const parsed = ProductSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ ok: false, error: "Invalid payload" });

    const payload = parsed.data;

    deps.logger.info(
      { eventType: "product", productCode: payload.productCode },
      "Webhook received"
    );

    const key = deriveEventKey({
      eventId: payload.eventId,
      stableParts: [payload.productCode, payload.lastModified]
    });

    if (!deps.dedupe.recordOnce(`product:${key}`, deps.dedupeTtlMs)) {
      deps.logger.info({ key }, "Duplicate product event (ignored)");
      return res.status(200).json({ ok: true, duplicate: true });
    }

    try {
      await deps.sync.syncProduct(payload);
      return res.status(200).json({ ok: true });
    } catch (err) {
      const cls = classifyZohoError(err);
      deps.logger.error({ err, cls, key }, "Product sync failed");
      if (cls === "4xx") return res.status(200).json({ ok: true, failed: "non-retryable" });
      return res.status(202).json({ ok: true, retryNeeded: true });
    }
  });

  r.post("/webhooks/printiq/invoice", async (req, res) => {
    void capturePayload("invoice", req.body).catch((e) => deps.logger.warn({ err: e }, "Payload capture failed"));

    const parsed = InvoiceSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ ok: false, error: "Invalid payload" });

    const payload = parsed.data;

    deps.logger.info(
      { eventType: "invoice", invoiceNo: payload.invoiceNo, jobReference: payload.jobReference },
      "Webhook received"
    );

    const key = deriveEventKey({
      eventId: payload.eventId,
      stableParts: [payload.invoiceNo, payload.lastModified]
    });

    if (!deps.dedupe.recordOnce(`invoice:${key}`, deps.dedupeTtlMs)) {
      deps.logger.info({ key }, "Duplicate invoice event (ignored)");
      return res.status(200).json({ ok: true, duplicate: true });
    }

    try {
      await deps.sync.syncInvoice(payload);
      return res.status(200).json({ ok: true });
    } catch (err) {
      const cls = classifyZohoError(err);
      deps.logger.error({ err, cls, key }, "Invoice sync failed");
      if (cls === "4xx") return res.status(200).json({ ok: true, failed: "non-retryable" });
      return res.status(202).json({ ok: true, retryNeeded: true });
    }
  });

  return r;
}
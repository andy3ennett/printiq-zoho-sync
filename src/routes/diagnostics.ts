import type { Router } from "express";
import { Router as createRouter } from "express";
import type { Logger } from "pino";
import { z } from "zod";
import { PrintIQClient } from "../printiq/PrintIQClient.js";

const CodeSchema = z.string().min(1);

function safeCustomerSummary(data: any) {
  // PII-safe summary only (no names, addresses, emails, phone, etc.)
  const code = data?.Code ?? data?.code ?? data?.CustomerCode ?? data?.customerCode ?? undefined;
  const id = data?.Id ?? data?.id ?? undefined;

  const billingAddressIntegrationId =
    data?.BillingAddressIntegrationID ??
    data?.billingAddressIntegrationId ??
    data?.BillingAddressIntegrationId ??
    undefined;

  const deliveryAddressIntegrationId =
    data?.DeliveryAddressIntegrationID ??
    data?.deliveryAddressIntegrationId ??
    data?.DeliveryAddressIntegrationId ??
    undefined;

  return { code, id, billingAddressIntegrationId, deliveryAddressIntegrationId };
}

export function diagnosticsRouter(deps: {
  logger: Logger;
  printiq?: PrintIQClient;
}): Router {
  const r = createRouter();

  r.get("/diagnostics/printiq/customer/:code", async (req, res) => {
    // local/dev guardrail (Phase 0): do not expose in production
    const env = process.env.NODE_ENV ?? "development";
    if (env === "production") return res.status(404).json({ ok: false });

    const code = CodeSchema.safeParse(req.params.code);
    if (!code.success) return res.status(400).json({ ok: false });

    if (!deps.printiq) {
      deps.logger.warn("PrintIQ diagnostics called but PrintIQ env not configured");
      return res.status(500).json({ ok: false, error: "PrintIQ not configured" });
    }

    try {
      const matches = await deps.printiq.getCustomerByCode(code.data);

      if (!Array.isArray(matches) || matches.length === 0) {
        deps.logger.info({ code: code.data }, "PrintIQ customer lookup OK (not found)");
        return res.status(200).json({ ok: true, found: false, code: code.data });
      }

      const summary = safeCustomerSummary(matches[0]);

      deps.logger.info({ code: summary.code ?? code.data }, "PrintIQ customer lookup OK");
      return res.status(200).json({ ok: true, found: true, ...summary });
    } catch (err: any) {
      const status = err?.response?.status as number | undefined;
      deps.logger.error(
        { code: code.data, status, message: err?.message },
        "PrintIQ customer lookup FAILED"
      );
      return res.status(502).json({ ok: false, status });
    }
  });

  return r;
}
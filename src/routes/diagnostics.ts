import type { Router } from "express";
import { Router as createRouter } from "express";
import type { Logger } from "pino";
import { z } from "zod";
import { PrintIQClient } from "../printiq/PrintIQClient.js";

const CodeSchema = z.string().min(1);

function safeCustomerSummary(data: any) {
  // Keep this permissive: PrintIQ response shape may vary.
  // Only return safe summary.
  const customerCode =
    data?.CustomerCode ?? data?.customerCode ?? data?.Code ?? data?.code ?? undefined;
  const customerName =
    data?.CustomerName ?? data?.customerName ?? data?.Name ?? data?.name ?? undefined;

  return { customerCode, customerName };
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
      const data = await deps.printiq.getCustomerByCode(code.data);
      const summary = safeCustomerSummary(data);
      deps.logger.info({ customerCode: summary.customerCode }, "PrintIQ connectivity OK");
      return res.status(200).json(summary);
    } catch (err: any) {
      const status = err?.response?.status as number | undefined;
      deps.logger.error(
        { code: code.data, status, message: err?.message },
        "PrintIQ connectivity FAILED"
      );
      return res.status(502).json({ ok: false });
    }
  });

  return r;
}
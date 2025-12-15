import type { Router } from "express";
import { Router as createRouter } from "express";

export function healthRouter(): Router {
  const r = createRouter();
  r.get("/health", (_req, res) => res.status(200).json({ ok: true }));
  return r;
}
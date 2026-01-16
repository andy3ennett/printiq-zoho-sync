import request from "supertest";
import { describe, it, expect } from "vitest";
import pino from "pino";
import { createApp } from "../src/app.js";
import { InMemoryDedupeStore } from "../src/dedupe/InMemoryDedupeStore.js";


function mkApp() {
  const logger = pino({ level: "silent" });
  const dedupe = new InMemoryDedupeStore();
  const sync = {
    syncQuote: async () => {},
    syncAcceptance: async () => {},
    syncProduct: async () => {},
    syncInvoice: async () => {}
  } as any;

  return createApp({ logger, dedupe, dedupeTtlMs: 1000, sync });
}

describe("GET /health", () => {
  it("returns ok", async () => {
    const app = mkApp();
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });
});
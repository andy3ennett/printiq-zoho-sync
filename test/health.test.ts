import request from "supertest";
import { describe, it, expect } from "vitest";
import { createApp } from "../src/app.js";
import { InMemoryDedupeStore } from "../src/dedupe/InMemoryDedupeStore.js";

function mkApp() {
  const logger = { info: () => {}, error: () => {} } as any;
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
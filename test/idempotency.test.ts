import request from "supertest";
import { describe, it, expect, vi } from "vitest";
import { createApp } from "../src/app.js";
import { InMemoryDedupeStore } from "../src/dedupe/InMemoryDedupeStore.js";

describe("Idempotency", () => {
  it("same payload twice only triggers one sync", async () => {
    const logger = { info: vi.fn(), error: vi.fn() } as any;
    const dedupe = new InMemoryDedupeStore();
    const sync = { syncQuote: vi.fn(async () => {}) } as any;

    const app = createApp({ logger, dedupe, dedupeTtlMs: 24 * 60 * 60 * 1000, sync });

    const payload = {
      quoteNo: "Q-200",
      status: "Awaiting Acceptance",
      customerCode: "CUST1",
      lastModified: "2025-12-15T10:00:00Z"
    };

    const r1 = await request(app).post("/webhooks/printiq/quote").send(payload);
    const r2 = await request(app).post("/webhooks/printiq/quote").send(payload);

    expect(r1.status).toBe(200);
    expect(r2.status).toBe(200);
    expect(sync.syncQuote).toHaveBeenCalledTimes(1);
    expect(r2.body.duplicate).toBe(true);
  });
});
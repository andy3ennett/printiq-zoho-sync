import request from "supertest";
import { describe, it, expect, vi } from "vitest";
import { createApp } from "../src/app.js";
import { InMemoryDedupeStore } from "../src/dedupe/InMemoryDedupeStore.js";

describe("Quote gating", () => {
  it("ignores status=In Process", async () => {
    const logger = { info: vi.fn(), error: vi.fn() } as any;
    const dedupe = new InMemoryDedupeStore();
    const sync = { syncQuote: vi.fn(async () => {}) } as any;

    const app = createApp({ logger, dedupe, dedupeTtlMs: 1000, sync });

    const res = await request(app).post("/webhooks/printiq/quote").send({
      quoteNo: "Q-100",
      status: "In Process",
      customerCode: "CUST1"
    });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.ignored).toBe(true);
    expect(sync.syncQuote).not.toHaveBeenCalled();
  });

  it("syncs status=Awaiting Acceptance", async () => {
    const logger = { info: vi.fn(), error: vi.fn() } as any;
    const dedupe = new InMemoryDedupeStore();
    const sync = { syncQuote: vi.fn(async () => {}) } as any;

    const app = createApp({ logger, dedupe, dedupeTtlMs: 1000, sync });

    const res = await request(app).post("/webhooks/printiq/quote").send({
      quoteNo: "Q-101",
      status: "Awaiting Acceptance",
      customerCode: "CUST1",
      lastModified: "2025-12-15T10:00:00Z"
    });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(sync.syncQuote).toHaveBeenCalledTimes(1);
  });
});
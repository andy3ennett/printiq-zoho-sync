import type { DedupeStore } from "./DedupeStore.js";

type Entry = { expiresAt: number };

export class InMemoryDedupeStore implements DedupeStore {
  private readonly map = new Map<string, Entry>();

  recordOnce(key: string, ttlMs: number): boolean {
    const now = Date.now();
    const existing = this.map.get(key);
    if (existing && existing.expiresAt > now) return false;

    this.map.set(key, { expiresAt: now + ttlMs });
    return true;
  }

  cleanup(): void {
    const now = Date.now();
    for (const [k, v] of this.map.entries()) {
      if (v.expiresAt <= now) this.map.delete(k);
    }
  }
}
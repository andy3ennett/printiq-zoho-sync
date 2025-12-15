export interface DedupeStore {
  /**
   * Returns true if key was newly recorded, false if it already exists (duplicate).
   */
  recordOnce(key: string, ttlMs: number): boolean;

  /**
   * Optional cleanup (no-op for some implementations).
   */
  cleanup(): void;
}
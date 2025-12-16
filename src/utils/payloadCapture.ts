import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

function tsSafe() {
  // 2025-12-16T12:34:56.789Z -> 20251216T123456789Z
  return new Date().toISOString().replace(/[-:]/g, "").replace(".", "").replace("Z", "Z");
}

export async function capturePayload(eventType: string, payload: unknown) {
  if ((process.env.NODE_ENV ?? "development") !== "development") return;

  const dir = join(process.cwd(), "samples", "incoming");
  await mkdir(dir, { recursive: true });

  const filename = `${eventType}-${tsSafe()}.json`;
  const path = join(dir, filename);

  await writeFile(path, JSON.stringify(payload, null, 2), "utf-8");
  return path;
}
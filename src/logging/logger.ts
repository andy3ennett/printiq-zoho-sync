import pino from "pino";

export function createLogger() {
  return pino({
    level: process.env.LOG_LEVEL ?? "info",
    base: undefined // omit pid/hostname for cleaner local logs
  });
}
import type { Request, Response, NextFunction } from "express";
import { randomUUID } from "node:crypto";

export function requestId(req: Request, _res: Response, next: NextFunction) {
  const incoming = req.header("x-request-id");
  (req as any).requestId = incoming ?? randomUUID();
  next();
}
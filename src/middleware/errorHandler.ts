import type { Request, Response, NextFunction } from "express";
import type { Logger } from "pino";

export function errorHandler(logger: Logger) {
  return (err: any, req: Request, res: Response, _next: NextFunction) => {
    logger.error(
      { err, requestId: (req as any).requestId, path: req.path },
      "Unhandled error"
    );
    res.status(500).json({ ok: false });
  };
}
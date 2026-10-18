import { NextFunction, Request, Response } from "express";
import { HttpError } from "../utils/httpError";

// Must be registered last in app.ts — Express only routes to error
// middleware (4-arg signature) when something calls next(err), which is
// exactly what asyncHandler does. If a route handler forgets asyncHandler,
// its errors will NOT reach this file — that's the first thing to check
// if you see a hung request instead of a clean JSON error.
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message });
  }
  console.error("[unhandled error]", err);
  return res.status(500).json({ error: "Internal server error" });
}

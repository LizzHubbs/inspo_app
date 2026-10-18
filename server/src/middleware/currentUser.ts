import { NextFunction, Request, Response } from "express";
import { HttpError } from "../utils/httpError";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

// Placeholder auth: real auth isn't built yet. Callers pass the acting user
// via an x-user-id header for now. Swap this middleware for real
// session/JWT auth later — every controller below only ever reads
// req.userId, never the header directly, so that's the only file to change.
export function currentUser(req: Request, _res: Response, next: NextFunction) {
  const userId = req.header("x-user-id");
  if (!userId) {
    return next(new HttpError(401, "Missing x-user-id header"));
  }
  req.userId = userId;
  next();
}

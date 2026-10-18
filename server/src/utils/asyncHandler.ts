import { NextFunction, Request, Response } from "express";

type Handler = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

// Express doesn't catch rejected promises from async route handlers on its
// own — without this, a thrown error in an async controller hangs the
// request instead of reaching errorHandler.ts. Wrap every async route with
// this so failures always produce a response.
export function asyncHandler(fn: Handler) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

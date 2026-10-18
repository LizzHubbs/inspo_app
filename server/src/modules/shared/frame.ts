import { HttpError } from "../../utils/httpError";

// null is a valid, meaningful value here — it means "not placed on the
// wall yet, auto-layout it" (see layoutWall in MuseumWall.jsx). Only
// reject values that are neither a finite number nor null/undefined.
export function validateWallCoord(value?: unknown): number | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const n = Number(value);
  if (!Number.isFinite(n)) {
    throw new HttpError(400, `Wall position must be a number`);
  }
  return Math.round(n);
}

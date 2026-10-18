import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import * as photoController from "./photo.controller";

// Mounted at /ideas/:id/photos in app.ts — every photo taken in response to
// one idea. Separate from photo.routes.ts (the top-level /photos list) for
// the same reason art has routes.byId/byUser: different scope, same
// controller underneath.
const router = Router({ mergeParams: true });
router.get("/", asyncHandler(photoController.listForIdea));
export default router;

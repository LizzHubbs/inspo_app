import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import * as artController from "./art.controller";

// Mounted at /users/:id/art in app.ts — the "my art across all photos" read
// the README flagged as unbuilt. Separate from art.routes.ts (nested under
// one photo) and art.routes.byId.ts (a single art piece) for the same
// reason those are split: each scopes art differently.
const router = Router({ mergeParams: true });
router.get("/", asyncHandler(artController.listForUser));
export default router;

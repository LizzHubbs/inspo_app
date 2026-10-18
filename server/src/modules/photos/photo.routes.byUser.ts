import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import * as photoController from "./photo.controller";

// Mounted at /users/:id/photos in app.ts — a user's public "Inspiration"
// grid, for viewing someone else's profile. Same pattern as
// art.routes.byUser.ts and photo.routes.byIdea.ts: different scope over
// the same controller/service.
const router = Router({ mergeParams: true });
router.get("/", asyncHandler(photoController.listForUser));
export default router;

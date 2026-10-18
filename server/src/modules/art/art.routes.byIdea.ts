import { Router } from "express";
import multer from "multer";
import { env } from "../../config/env";
import { asyncHandler } from "../../utils/asyncHandler";
import { currentUser } from "../../middleware/currentUser";
import * as artController from "./art.controller";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.maxUploadMb * 1024 * 1024 },
});

// Mounted at /ideas/:id/art in app.ts — art submitted straight for an idea,
// same as photo.routes.byIdea.ts does for photos. mergeParams so
// req.params.id (the idea) is visible here.
const router = Router({ mergeParams: true });
router.get("/", asyncHandler(artController.listForIdea));
router.post("/", currentUser, upload.single("image"), asyncHandler(artController.createForIdea));
export default router;

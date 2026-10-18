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

// Separate from art.routes.ts on purpose: that router only makes sense
// nested under a photo (mergeParams reads :photoId from the parent). This
// one is mounted top-level as /art in app.ts — GET / is the art half of
// the feed, POST / is for art posted on its own (not inspired by
// anything); the rest are for fetching/editing/loving/deleting a single
// art piece directly (e.g. an art detail screen).
const router = Router();
router.get("/", asyncHandler(artController.list));
router.post("/", currentUser, upload.single("image"), asyncHandler(artController.createStandalone));
router.get("/:id", asyncHandler(artController.getById));
router.patch("/:id", currentUser, asyncHandler(artController.update));
router.patch("/:id/position", currentUser, asyncHandler(artController.updatePosition));
router.delete("/:id", currentUser, asyncHandler(artController.remove));
router.post("/:id/love", currentUser, asyncHandler(artController.love));
router.delete("/:id/love", currentUser, asyncHandler(artController.unlove));
export default router;

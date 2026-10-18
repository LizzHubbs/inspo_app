import { Router } from "express";
import multer from "multer";
import { env } from "../../config/env";
import { asyncHandler } from "../../utils/asyncHandler";
import { currentUser } from "../../middleware/currentUser";
import * as photoController from "./photo.controller";
import artForPhotoRoutes from "../art/art.routes";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.maxUploadMb * 1024 * 1024 },
});

const router = Router();

// /working must be registered before /:id, or Express would swallow it as
// if "working" were an id (same pitfall as /challenges/current before it —
// see the git history on that module for the fuller explanation).
router.get("/working", currentUser, asyncHandler(photoController.listWorking));

router.get("/", asyncHandler(photoController.list));
router.get("/:id", asyncHandler(photoController.getById));
router.post("/", currentUser, upload.single("image"), asyncHandler(photoController.create));
router.patch("/:id", currentUser, asyncHandler(photoController.update));
router.patch("/:id/position", currentUser, asyncHandler(photoController.updatePosition));
router.delete("/:id", currentUser, asyncHandler(photoController.remove));
router.post("/:id/love", currentUser, asyncHandler(photoController.love));
router.delete("/:id/love", currentUser, asyncHandler(photoController.unlove));
router.post("/:id/working", currentUser, asyncHandler(photoController.startWorking));
router.delete("/:id/working", currentUser, asyncHandler(photoController.stopWorking));

// GET /photos/:id/art and POST /photos/:id/art — the inspiration-graph
// endpoints live here (nested), not as a top-level /art listing, because
// they only make sense in the context of one photo.
router.use("/:photoId/art", artForPhotoRoutes);

export default router;

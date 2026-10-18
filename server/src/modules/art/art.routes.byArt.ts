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

// Mounted at /art/:artId/art in app.ts — the other half of the
// art-can-inspire-art chain: GET lists what's been made in response to
// this piece, POST adds another link. mergeParams so req.params.artId
// (the parent) is visible here even though it's from the parent path.
const router = Router({ mergeParams: true });
router.get("/", asyncHandler(artController.listForArt));
router.post("/", currentUser, upload.single("image"), asyncHandler(artController.createForArt));
export default router;

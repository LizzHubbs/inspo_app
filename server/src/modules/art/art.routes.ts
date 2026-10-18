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

// mergeParams: true — this router is mounted at /photos/:photoId/art in
// photo.routes.ts, and without mergeParams, req.params.photoId would be
// undefined here even though it's in the URL. This is the #1 thing to
// check if listForPhoto/create suddenly can't find the photo id.
const router = Router({ mergeParams: true });

router.get("/", asyncHandler(artController.listForPhoto));
router.post("/", currentUser, upload.single("image"), asyncHandler(artController.create));

export default router;

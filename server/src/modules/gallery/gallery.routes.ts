import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { currentUser } from "../../middleware/currentUser";
import * as galleryController from "./gallery.controller";

const router = Router();

// Public — anyone viewing a profile needs its wall/frame colors to render
// the gallery correctly, same reasoning as photo/art detail reads.
router.get("/:id", asyncHandler(galleryController.getForUser));

// Always sets the requester's own settings — there's no "customize someone
// else's gallery," so this doesn't take an id (same pattern as goals).
router.put("/", currentUser, asyncHandler(galleryController.setMine));

export default router;

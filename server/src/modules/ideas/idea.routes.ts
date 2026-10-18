import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { currentUser } from "../../middleware/currentUser";
import * as ideaController from "./idea.controller";

// No multer here — ideas are plain JSON (just text), unlike photos/art.
const router = Router();

router.get("/", asyncHandler(ideaController.list));
router.get("/:id", asyncHandler(ideaController.getById));
router.post("/", currentUser, asyncHandler(ideaController.create));
router.delete("/:id", currentUser, asyncHandler(ideaController.remove));

export default router;

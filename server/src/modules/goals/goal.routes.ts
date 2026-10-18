import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { currentUser } from "../../middleware/currentUser";
import * as goalController from "./goal.controller";

const router = Router();

// Public — reading someone's goal progress doesn't need to know who's
// asking, same as photo/art detail reads.
router.get("/:id", asyncHandler(goalController.getForUser));

// Always sets the requester's own goal — there's no "set someone else's
// goal" concept, so this doesn't take an id.
router.put("/", currentUser, asyncHandler(goalController.setMine));

export default router;

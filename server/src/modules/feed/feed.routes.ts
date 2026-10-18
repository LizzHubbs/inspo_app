import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { currentUser } from "../../middleware/currentUser";
import * as feedController from "./feed.controller";

// Personal — who your friends are and what you've loved both feed into
// the ranking, so this always needs to know who's asking.
const router = Router();
router.get("/", currentUser, asyncHandler(feedController.get));
export default router;

import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { currentUser } from "../../middleware/currentUser";
import * as userController from "./user.controller";

const router = Router();

// Search always needs to know who's asking (to exclude yourself and flag
// isFriend/isBlockedByMe), so — unusually for a GET in this app — it
// requires currentUser too.
router.get("/", currentUser, asyncHandler(userController.search));

// Single segment ("/:id") never matches the two-segment routes below it
// (e.g. "/:id/friends"), so registration order here doesn't matter — but
// this also needs currentUser, for the same reason search does.
router.get("/:id", currentUser, asyncHandler(userController.getById));

router.get("/:id/friends", asyncHandler(userController.listFriends));
router.post("/:id/friends", currentUser, asyncHandler(userController.addFriend));
router.delete("/:id/friends", currentUser, asyncHandler(userController.removeFriend));

export default router;

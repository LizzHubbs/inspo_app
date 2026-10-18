import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { currentUser } from "../../middleware/currentUser";
import * as userController from "./user.controller";

// Separate top-level resource (mounted at /blocks, not nested under
// /users/:id) — a block list is always "my own"; there's no public
// "view someone else's blocks" the way there's a public friends list.
const router = Router();
router.get("/", currentUser, asyncHandler(userController.listBlocked));
router.post("/:id", currentUser, asyncHandler(userController.blockUser));
router.delete("/:id", currentUser, asyncHandler(userController.unblockUser));
export default router;

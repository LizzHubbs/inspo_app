import { HttpError } from "../../utils/httpError";
import * as userRepo from "./user.repository";
import { User, UserWithRelation } from "./user.types";

export async function searchUsers(query: string, viewerId: string, limit = 20): Promise<UserWithRelation[]> {
  const q = query?.trim();
  if (!q) return []; // no query, no results — never dump the whole user table
  return userRepo.searchUsers(q, viewerId, Math.min(limit, 50));
}

export async function getUser(id: string, viewerId: string): Promise<UserWithRelation> {
  const user = await userRepo.findUserWithRelation(id, viewerId);
  if (!user) throw new HttpError(404, "User not found");
  return user;
}

export async function getFriends(userId: string): Promise<User[]> {
  return userRepo.listFriends(userId);
}

export async function addFriend(userId: string, friendId: string): Promise<void> {
  if (friendId === userId) {
    throw new HttpError(400, "Can't add yourself as a friend");
  }
  const friend = await userRepo.findUserById(friendId);
  if (!friend) throw new HttpError(404, "User not found");

  if (await userRepo.isBlocked(userId, friendId)) {
    throw new HttpError(403, "Unable to add this friend");
  }
  await userRepo.addFriendship(userId, friendId);
}

export async function removeFriend(userId: string, friendId: string): Promise<void> {
  await userRepo.removeFriendship(userId, friendId);
}

export async function getBlocked(userId: string): Promise<User[]> {
  return userRepo.listBlocked(userId);
}

export async function blockUser(userId: string, blockedId: string): Promise<void> {
  if (blockedId === userId) {
    throw new HttpError(400, "Can't block yourself");
  }
  const target = await userRepo.findUserById(blockedId);
  if (!target) throw new HttpError(404, "User not found");

  await userRepo.addBlock(userId, blockedId);
  // A block and a friendship can't coexist — drop any existing one.
  await userRepo.removeFriendship(userId, blockedId);
}

export async function unblockUser(userId: string, blockedId: string): Promise<void> {
  await userRepo.removeBlock(userId, blockedId);
}

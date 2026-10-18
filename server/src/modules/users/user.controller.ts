import { Request, Response } from "express";
import * as userService from "./user.service";

export async function search(req: Request, res: Response) {
  const q = typeof req.query.q === "string" ? req.query.q : "";
  const users = await userService.searchUsers(q, req.userId!);
  res.json({ users });
}

export async function getById(req: Request, res: Response) {
  const user = await userService.getUser(req.params.id, req.userId!);
  res.json(user);
}

export async function listFriends(req: Request, res: Response) {
  const friends = await userService.getFriends(req.params.id);
  res.json({ friends });
}

export async function addFriend(req: Request, res: Response) {
  await userService.addFriend(req.userId!, req.params.id);
  res.status(204).send();
}

export async function removeFriend(req: Request, res: Response) {
  await userService.removeFriend(req.userId!, req.params.id);
  res.status(204).send();
}

export async function listBlocked(req: Request, res: Response) {
  const blocked = await userService.getBlocked(req.userId!);
  res.json({ blocked });
}

export async function blockUser(req: Request, res: Response) {
  await userService.blockUser(req.userId!, req.params.id);
  res.status(204).send();
}

export async function unblockUser(req: Request, res: Response) {
  await userService.unblockUser(req.userId!, req.params.id);
  res.status(204).send();
}

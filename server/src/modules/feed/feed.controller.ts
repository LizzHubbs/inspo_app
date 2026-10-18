import { Request, Response } from "express";
import * as feedService from "./feed.service";

export async function get(req: Request, res: Response) {
  const limit = Number(req.query.limit ?? 30);
  const items = await feedService.getFeed(req.userId!, limit);
  res.json({ items });
}

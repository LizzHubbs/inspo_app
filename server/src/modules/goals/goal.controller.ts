import { Request, Response } from "express";
import * as goalService from "./goal.service";

export async function getForUser(req: Request, res: Response) {
  const progress = await goalService.getProgress(req.params.id);
  res.json(progress);
}

export async function setMine(req: Request, res: Response) {
  const progress = await goalService.setGoal(req.userId!, {
    photoGoal: req.body.photoGoal,
    artGoal: req.body.artGoal,
  });
  res.json(progress);
}

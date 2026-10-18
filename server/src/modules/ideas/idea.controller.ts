import { Request, Response } from "express";
import * as ideaService from "./idea.service";

export async function create(req: Request, res: Response) {
  const idea = await ideaService.createIdea({ ownerId: req.userId!, text: req.body.text });
  res.status(201).json(idea);
}

export async function list(req: Request, res: Response) {
  const limit = Number(req.query.limit ?? 20);
  const before = typeof req.query.before === "string" ? req.query.before : undefined;
  const ideas = await ideaService.listIdeas(limit, before);
  res.json({ ideas });
}

export async function getById(req: Request, res: Response) {
  const idea = await ideaService.getIdea(req.params.id);
  res.json(idea);
}

export async function remove(req: Request, res: Response) {
  await ideaService.deleteIdea(req.params.id, req.userId!);
  res.status(204).send();
}

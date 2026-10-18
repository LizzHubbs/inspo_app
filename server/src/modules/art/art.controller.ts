import { Request, Response } from "express";
import { HttpError } from "../../utils/httpError";
import * as artService from "./art.service";

function uploadedFile(req: Request) {
  if (!req.file) throw new HttpError(400, "Missing image file (field name: image)");
  return { buffer: req.file.buffer, mimetype: req.file.mimetype, originalname: req.file.originalname };
}

export async function create(req: Request, res: Response) {
  const inspiredByPhoto = req.params.photoId;
  if (!inspiredByPhoto) throw new HttpError(400, "Missing photo id in route");

  const art = await artService.uploadArt({
    ownerId: req.userId!,
    inspiredByPhoto,
    title: req.body.title,
    description: req.body.description,
    medium: req.body.medium,
    file: uploadedFile(req),
  });

  res.status(201).json(art);
}

// Art inspired by another piece of art — mounted at /art/:artId/art (see
// art.routes.byArt.ts).
export async function createForArt(req: Request, res: Response) {
  const inspiredByArt = req.params.artId;
  if (!inspiredByArt) throw new HttpError(400, "Missing art id in route");

  const art = await artService.uploadArt({
    ownerId: req.userId!,
    inspiredByArt,
    title: req.body.title,
    description: req.body.description,
    medium: req.body.medium,
    file: uploadedFile(req),
  });

  res.status(201).json(art);
}

// Art submitted straight for an idea — mounted at /ideas/:id/art (see
// art.routes.byIdea.ts).
export async function createForIdea(req: Request, res: Response) {
  const inspiredByIdea = req.params.id;
  if (!inspiredByIdea) throw new HttpError(400, "Missing idea id in route");

  const art = await artService.uploadArt({
    ownerId: req.userId!,
    inspiredByIdea,
    title: req.body.title,
    description: req.body.description,
    medium: req.body.medium,
    file: uploadedFile(req),
  });

  res.status(201).json(art);
}

// Art posted on its own, not tied to anything — mounted at the top-level
// POST /art (see art.routes.byId.ts).
export async function createStandalone(req: Request, res: Response) {
  const art = await artService.uploadArt({
    ownerId: req.userId!,
    title: req.body.title,
    description: req.body.description,
    medium: req.body.medium,
    file: uploadedFile(req),
  });

  res.status(201).json(art);
}

// The art half of the feed (see art.routes.byId.ts, mirrors photo list).
export async function list(req: Request, res: Response) {
  const limit = Number(req.query.limit ?? 20);
  const before = typeof req.query.before === "string" ? req.query.before : undefined;
  const art = await artService.listFeedArt(limit, before);
  res.json({ art });
}

export async function listForPhoto(req: Request, res: Response) {
  const art = await artService.listArtForPhoto(req.params.photoId, Number(req.query.limit ?? 30));
  res.json({ art });
}

export async function listForArt(req: Request, res: Response) {
  const art = await artService.listArtForArt(req.params.artId, Number(req.query.limit ?? 30));
  res.json({ art });
}

export async function listForIdea(req: Request, res: Response) {
  const art = await artService.listArtForIdea(req.params.id, Number(req.query.limit ?? 50));
  res.json({ art });
}

export async function getById(req: Request, res: Response) {
  // Optional — public route, just read directly so "lovedByMe" can reflect
  // whoever's asking, same pattern as photo.controller.getById.
  const viewerId = req.header("x-user-id") || undefined;
  const art = await artService.getArt(req.params.id, viewerId);
  res.json(art);
}

export async function listForUser(req: Request, res: Response) {
  const art = await artService.listArtForUser(req.params.id, Number(req.query.limit ?? 50));
  res.json({ art });
}

export async function update(req: Request, res: Response) {
  const art = await artService.updateArt(req.params.id, req.userId!, {
    title: req.body.title,
    description: req.body.description,
    medium: req.body.medium,
  });
  res.json(art);
}

export async function updatePosition(req: Request, res: Response) {
  const art = await artService.updateArtPlacement(req.params.id, req.userId!, {
    wallX: req.body.wallX,
    wallY: req.body.wallY,
  });
  res.json(art);
}

export async function remove(req: Request, res: Response) {
  await artService.deleteArt(req.params.id, req.userId!);
  res.status(204).send();
}

export async function love(req: Request, res: Response) {
  const art = await artService.loveArt(req.params.id, req.userId!);
  res.json(art);
}

export async function unlove(req: Request, res: Response) {
  const art = await artService.unloveArt(req.params.id, req.userId!);
  res.json(art);
}

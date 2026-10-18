import { Request, Response } from "express";
import { HttpError } from "../../utils/httpError";
import * as photoService from "./photo.service";

export async function create(req: Request, res: Response) {
  if (!req.file) throw new HttpError(400, "Missing image file (field name: image)");

  const photo = await photoService.uploadPhoto({
    ownerId: req.userId!,
    title: req.body.title,
    description: req.body.description,
    ideaId: req.body.ideaId || undefined,
    file: { buffer: req.file.buffer, mimetype: req.file.mimetype, originalname: req.file.originalname },
  });

  res.status(201).json(photo);
}

export async function getById(req: Request, res: Response) {
  // Optional — not gated behind currentUser (this route is public), just
  // read directly so "lovedByMe" can reflect whoever's asking, if anyone.
  const viewerId = req.header("x-user-id") || undefined;
  const photo = await photoService.getPhoto(req.params.id, viewerId);
  res.json(photo);
}

export async function list(req: Request, res: Response) {
  const limit = Number(req.query.limit ?? 20);
  const viewerId = req.header("x-user-id") || undefined;

  // A search query takes over entirely — it's a different shape of read
  // (match relevance, not a cursor-paginated timeline), so before/after
  // don't apply once q is present.
  if (typeof req.query.q === "string" && req.query.q.trim()) {
    const photos = await photoService.searchPhotos(req.query.q, limit, viewerId);
    res.json({ photos });
    return;
  }

  const before = typeof req.query.before === "string" ? req.query.before : undefined;
  const photos = await photoService.listFeedPhotos(limit, before, viewerId);
  res.json({ photos });
}

export async function listForIdea(req: Request, res: Response) {
  const viewerId = req.header("x-user-id") || undefined;
  const photos = await photoService.listPhotosForIdea(req.params.id, Number(req.query.limit ?? 50), viewerId);
  res.json({ photos });
}

export async function listForUser(req: Request, res: Response) {
  const viewerId = req.header("x-user-id") || undefined;
  const photos = await photoService.listPhotosForUser(req.params.id, viewerId, Number(req.query.limit ?? 50));
  res.json({ photos });
}

export async function update(req: Request, res: Response) {
  const photo = await photoService.updatePhoto(req.params.id, req.userId!, {
    title: req.body.title,
    description: req.body.description,
  });
  res.json(photo);
}

export async function updatePosition(req: Request, res: Response) {
  const photo = await photoService.updatePhotoPlacement(req.params.id, req.userId!, {
    wallX: req.body.wallX,
    wallY: req.body.wallY,
  });
  res.json(photo);
}

export async function remove(req: Request, res: Response) {
  await photoService.deletePhoto(req.params.id, req.userId!);
  res.status(204).send();
}

export async function startWorking(req: Request, res: Response) {
  await photoService.startWorkingOn(req.params.id, req.userId!);
  res.status(204).send();
}

export async function stopWorking(req: Request, res: Response) {
  await photoService.stopWorkingOn(req.params.id, req.userId!);
  res.status(204).send();
}

export async function listWorking(req: Request, res: Response) {
  const photos = await photoService.listWorkingPhotos(req.userId!);
  res.json({ photos });
}

export async function love(req: Request, res: Response) {
  const photo = await photoService.lovePhoto(req.params.id, req.userId!);
  res.json(photo);
}

export async function unlove(req: Request, res: Response) {
  const photo = await photoService.unlovePhoto(req.params.id, req.userId!);
  res.json(photo);
}

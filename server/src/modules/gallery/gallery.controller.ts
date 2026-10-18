import { Request, Response } from "express";
import * as galleryService from "./gallery.service";

export async function getForUser(req: Request, res: Response) {
  const settings = await galleryService.getGallerySettings(req.params.id);
  res.json(settings);
}

export async function setMine(req: Request, res: Response) {
  const settings = await galleryService.setGallerySettings(req.userId!, {
    roomTheme: req.body.roomTheme,
    maxPieces: req.body.maxPieces,
  });
  res.json(settings);
}

import { HttpError } from "../../utils/httpError";
import { moderate } from "../../utils/moderation";
import { storage } from "../../lib/storage/localStorage";
import * as artRepo from "./art.repository";
import * as photoService from "../photos/photo.service";
import * as ideaService from "../ideas/idea.service";
import { validateWallCoord } from "../shared/frame";
import { Art, ALLOWED_MEDIUMS } from "./art.types";

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);

function validateMedium(medium?: string): string | null {
  if (!medium) return null;
  if (!(ALLOWED_MEDIUMS as readonly string[]).includes(medium)) {
    throw new HttpError(400, `Unknown medium: ${medium}`);
  }
  return medium;
}

export async function uploadArt(input: {
  ownerId: string;
  // At most one of these — all omitted means art posted on its own, not a
  // response to anything.
  inspiredByPhoto?: string;
  inspiredByArt?: string;
  inspiredByIdea?: string;
  title?: string;
  description?: string;
  medium?: string;
  file: { buffer: Buffer; mimetype: string; originalname: string };
}): Promise<Art> {
  if (!ALLOWED_MIME.has(input.file.mimetype)) {
    throw new HttpError(400, `Unsupported image type: ${input.file.mimetype}`);
  }
  const medium = validateMedium(input.medium);

  // Fails loudly (404) if the referenced parent doesn't exist — or has
  // been removed — instead of letting a dangling reference land in the
  // database. Each *Service is the single source of truth for "does this
  // exist" — reused here rather than re-querying those tables directly.
  if (input.inspiredByPhoto) {
    const photo = await photoService.getPhoto(input.inspiredByPhoto);
    if (photo.status === "deleted") throw new HttpError(404, "This photo has been removed");
  }
  if (input.inspiredByArt) {
    const art = await getArt(input.inspiredByArt);
    if (art.status === "deleted") throw new HttpError(404, "This art has been removed");
  }
  if (input.inspiredByIdea) {
    const idea = await ideaService.getIdea(input.inspiredByIdea);
    if (idea.status === "deleted") throw new HttpError(404, "This idea has been removed");
  }

  const moderation = await moderate(input.file.buffer, input.file.mimetype);
  if (moderation.status === "rejected") {
    throw new HttpError(422, `Art rejected: ${moderation.reason}`);
  }

  const stored = await storage.save(input.file.buffer, input.file.originalname, input.file.mimetype);

  return artRepo.insertArt({
    ownerId: input.ownerId,
    inspiredByPhoto: input.inspiredByPhoto ?? null,
    inspiredByArt: input.inspiredByArt ?? null,
    inspiredByIdea: input.inspiredByIdea ?? null,
    title: input.title ?? null,
    description: input.description ?? null,
    medium,
    storageKey: stored.key,
    status: "live",
  });
}

export async function getArt(id: string, viewerId?: string): Promise<Art> {
  const art = await artRepo.findArtById(id, viewerId);
  if (!art) throw new HttpError(404, "Art not found");
  return art;
}

export async function listArtForPhoto(photoId: string, limit = 30): Promise<Art[]> {
  await photoService.getPhoto(photoId); // 404s clearly if the photo id is wrong
  return artRepo.listArtByPhoto(photoId, limit);
}

export async function listArtForArt(artId: string, limit = 30): Promise<Art[]> {
  await getArt(artId); // 404s clearly if the art id is wrong
  return artRepo.listArtByArt(artId, limit);
}

export async function listArtForIdea(ideaId: string, limit = 50): Promise<Art[]> {
  await ideaService.getIdea(ideaId); // 404s clearly if the idea id is wrong
  return artRepo.listArtByIdea(ideaId, limit);
}

export async function listArtForUser(ownerId: string, limit = 50): Promise<Art[]> {
  return artRepo.listArtByOwner(ownerId, Math.min(limit, 50));
}

export async function listFeedArt(limit: number, before?: string): Promise<Art[]> {
  return artRepo.listLiveArt(Math.min(limit, 50), before);
}

export async function deleteArt(id: string, requesterId: string): Promise<void> {
  const art = await getArt(id); // 404s if missing
  if (art.ownerId !== requesterId) {
    throw new HttpError(403, "Only the owner can delete this art");
  }
  await artRepo.softDeleteArt(id);
}

export async function updateArt(
  id: string,
  requesterId: string,
  input: { title?: string | null; description?: string | null; medium?: string | null }
): Promise<Art> {
  const art = await getArt(id); // 404s if missing
  if (art.ownerId !== requesterId) {
    throw new HttpError(403, "Only the owner can edit this art");
  }
  await artRepo.updateArt(id, {
    title: input.title?.trim() || null,
    description: input.description?.trim() || null,
    medium: validateMedium(input.medium ?? undefined),
  });
  return getArt(id);
}

// Partial on purpose — see photo.service.ts's updatePhotoPlacement for the
// full reasoning (wallX/wallY can each be omitted, cleared, or moved
// independently).
export async function updateArtPlacement(id: string, requesterId: string, input: { wallX?: unknown; wallY?: unknown }): Promise<Art> {
  const art = await getArt(id); // 404s if missing
  if (art.ownerId !== requesterId) {
    throw new HttpError(403, "Only the owner can move this art");
  }
  const wallX = input.wallX !== undefined ? validateWallCoord(input.wallX) ?? null : art.wallX;
  const wallY = input.wallY !== undefined ? validateWallCoord(input.wallY) ?? null : art.wallY;
  await artRepo.updateArtPlacement(id, { wallX, wallY });
  return getArt(id);
}

export async function loveArt(id: string, userId: string): Promise<Art> {
  await getArt(id); // 404s if missing
  await artRepo.addLove(id, userId);
  return getArt(id, userId);
}

export async function unloveArt(id: string, userId: string): Promise<Art> {
  await getArt(id); // 404s if missing
  await artRepo.removeLove(id, userId);
  return getArt(id, userId);
}

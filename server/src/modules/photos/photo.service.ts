import { HttpError } from "../../utils/httpError";
import { moderate } from "../../utils/moderation";
import { storage } from "../../lib/storage/localStorage";
import * as photoRepo from "./photo.repository";
import * as ideaService from "../ideas/idea.service";
import { validateWallCoord } from "../shared/frame";
import { Photo } from "./photo.types";

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function uploadPhoto(input: {
  ownerId: string;
  title?: string;
  description?: string;
  ideaId?: string;
  file: { buffer: Buffer; mimetype: string; originalname: string };
}): Promise<Photo> {
  if (!ALLOWED_MIME.has(input.file.mimetype)) {
    throw new HttpError(400, `Unsupported image type: ${input.file.mimetype}`);
  }

  if (input.ideaId) {
    const idea = await ideaService.getIdea(input.ideaId); // 404s clearly if the idea id is wrong
    if (idea.status === "deleted") {
      throw new HttpError(404, "This idea has been removed");
    }
  }

  const moderation = await moderate(input.file.buffer, input.file.mimetype);
  if (moderation.status === "rejected") {
    // Matches the moderation design: a rejected upload is never stored or
    // posted — no row is written, nothing goes live even briefly.
    throw new HttpError(422, `Photo rejected: ${moderation.reason}`);
  }

  const stored = await storage.save(input.file.buffer, input.file.originalname, input.file.mimetype);

  return photoRepo.insertPhoto({
    ownerId: input.ownerId,
    title: input.title ?? null,
    description: input.description ?? null,
    storageKey: stored.key,
    status: "live",
    inspiredByIdea: input.ideaId ?? null,
  });
}

export async function getPhoto(id: string, viewerId?: string): Promise<Photo> {
  const photo = await photoRepo.findPhotoById(id, viewerId);
  if (!photo) throw new HttpError(404, "Photo not found");
  return photo;
}

export async function listFeedPhotos(limit: number, before?: string, viewerId?: string): Promise<Photo[]> {
  return photoRepo.listLivePhotos(Math.min(limit, 50), before, viewerId);
}

// Backend search over title + description — see SearchView.jsx. Tags used
// to be what this matched against; title/description replaced them.
export async function searchPhotos(query: string, limit = 30, viewerId?: string): Promise<Photo[]> {
  const q = query.trim();
  if (!q) return [];
  return photoRepo.searchPhotos(q, Math.min(limit, 50), viewerId);
}

export async function listPhotosForIdea(ideaId: string, limit = 50, viewerId?: string): Promise<Photo[]> {
  return photoRepo.listPhotosByIdea(ideaId, Math.min(limit, 50), viewerId);
}

export async function listPhotosForUser(ownerId: string, viewerId?: string, limit = 50): Promise<Photo[]> {
  return photoRepo.listPhotosByOwner(ownerId, Math.min(limit, 50), viewerId);
}

export async function updatePhoto(
  id: string,
  requesterId: string,
  input: { title?: string | null; description?: string | null }
): Promise<Photo> {
  const photo = await getPhoto(id); // 404s if missing
  if (photo.ownerId !== requesterId) {
    throw new HttpError(403, "Only the owner can edit this photo");
  }
  await photoRepo.updatePhoto(id, {
    title: input.title?.trim() || null,
    description: input.description?.trim() || null,
  });
  return getPhoto(id);
}

// Partial on purpose — wallX and wallY can each be omitted (unchanged),
// explicit null (un-place, back to auto-layout), or a coordinate.
export async function updatePhotoPlacement(
  id: string,
  requesterId: string,
  input: { wallX?: unknown; wallY?: unknown }
): Promise<Photo> {
  const photo = await getPhoto(id); // 404s if missing
  if (photo.ownerId !== requesterId) {
    throw new HttpError(403, "Only the owner can move this photo");
  }
  const wallX = input.wallX !== undefined ? validateWallCoord(input.wallX) ?? null : photo.wallX;
  const wallY = input.wallY !== undefined ? validateWallCoord(input.wallY) ?? null : photo.wallY;
  await photoRepo.updatePhotoPlacement(id, { wallX, wallY });
  return getPhoto(id);
}

export async function deletePhoto(id: string, requesterId: string): Promise<void> {
  const photo = await getPhoto(id); // 404s if missing
  if (photo.ownerId !== requesterId) {
    throw new HttpError(403, "Only the owner can delete this photo");
  }
  // Soft delete: art inspired by this photo, and the idea/photo graph
  // around it, must keep working — see the comment above the status check
  // constraints in db/schema.sql.
  await photoRepo.softDeletePhoto(id);
}

export async function startWorkingOn(id: string, userId: string): Promise<void> {
  await getPhoto(id); // 404s if missing
  await photoRepo.addWorkingPhoto(userId, id);
}

export async function stopWorkingOn(id: string, userId: string): Promise<void> {
  await photoRepo.removeWorkingPhoto(userId, id);
}

export async function listWorkingPhotos(userId: string): Promise<Photo[]> {
  return photoRepo.listWorkingPhotos(userId);
}

export async function lovePhoto(id: string, userId: string): Promise<Photo> {
  await getPhoto(id); // 404s if missing
  await photoRepo.addLove(id, userId);
  return getPhoto(id, userId);
}

export async function unlovePhoto(id: string, userId: string): Promise<Photo> {
  await getPhoto(id); // 404s if missing
  await photoRepo.removeLove(id, userId);
  return getPhoto(id, userId);
}

import { HttpError } from "../../utils/httpError";
import * as galleryRepo from "./gallery.repository";
import { GallerySettings, ALLOWED_ROOM_THEMES, RoomTheme } from "./gallery.types";

function validateRoomTheme(value: unknown): RoomTheme {
  if (typeof value !== "string" || !(ALLOWED_ROOM_THEMES as readonly string[]).includes(value)) {
    throw new HttpError(400, `Room theme must be one of: ${ALLOWED_ROOM_THEMES.join(", ")}`);
  }
  return value as RoomTheme;
}

// null clears the cap (show every piece); anything else must be a whole
// number greater than zero.
function validateMaxPieces(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) {
    throw new HttpError(400, "Max pieces must be a whole number greater than zero");
  }
  return n;
}

export async function getGallerySettings(userId: string): Promise<GallerySettings> {
  return galleryRepo.getGallerySettings(userId);
}

export async function setGallerySettings(userId: string, input: { roomTheme?: unknown; maxPieces?: unknown }): Promise<GallerySettings> {
  const settings: GallerySettings = {
    roomTheme: validateRoomTheme(input.roomTheme),
    maxPieces: validateMaxPieces(input.maxPieces),
  };
  await galleryRepo.setGallerySettings(userId, settings);
  return settings;
}

import { pool } from "../../config/db";
import { GallerySettings } from "./gallery.types";

const DEFAULT_SETTINGS: GallerySettings = { roomTheme: "midnight-gallery", maxPieces: null };

export async function getGallerySettings(userId: string): Promise<GallerySettings> {
  const { rows } = await pool.query(
    `select room_theme as "roomTheme", max_pieces as "maxPieces" from gallery_settings where user_id = $1`,
    [userId]
  );
  return rows[0] ?? DEFAULT_SETTINGS;
}

export async function setGallerySettings(userId: string, input: GallerySettings): Promise<void> {
  await pool.query(
    `insert into gallery_settings (user_id, room_theme, max_pieces, updated_at)
     values ($1, $2, $3, now())
     on conflict (user_id) do update set room_theme = $2, max_pieces = $3, updated_at = now()`,
    [userId, input.roomTheme, input.maxPieces]
  );
}

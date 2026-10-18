// Keep in sync with ROOM_THEMES in the client's roomThemes.js and the
// room_theme check constraint in db/schema.sql.
export const ALLOWED_ROOM_THEMES = ["midnight-gallery", "sunlit-atelier", "white-cube", "salon-rouge"] as const;
export type RoomTheme = (typeof ALLOWED_ROOM_THEMES)[number];

// The whole "vibe" of a user's profile museum room is one curated theme —
// wall, floor, frame look, and plaque all bundled together — rather than
// separate color pickers. maxPieces caps how many of the owner's pieces
// show on the wall at once (most recent first); null means show everything.
export interface GallerySettings {
  roomTheme: RoomTheme;
  maxPieces: number | null;
}

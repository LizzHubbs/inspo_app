// Mirrors the art_medium_check constraint in server/db/schema.sql — keep
// both in sync. "Photograph" is the one choice that routes an upload to a
// Photo instead of an Art record (see UploadModal.jsx callers); every other
// medium becomes a piece of art.
export const MEDIUMS = [
  "Photograph",
  "Acrylic Paint",
  "Oil Paint",
  "Watercolor",
  "Graphite Pencil",
  "Charcoal",
  "Ink",
  "Pastel",
  "Digital Art",
  "Mixed Media",
  "Other",
];

// Frame style/size are no longer a per-piece choice — see roomThemes.js.
// Classic portrait frame proportion — height is always this multiple of
// the room theme's frame width, kept as one shared constant since every
// theme uses the same proportion.
export const FRAME_ASPECT = 1.2;

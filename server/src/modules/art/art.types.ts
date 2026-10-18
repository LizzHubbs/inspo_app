// Mirrors the check constraint on art.medium in db/schema.sql and the
// dropdown in the client's UploadModal.jsx — keep all three in sync.
export const ALLOWED_MEDIUMS = [
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
] as const;

export interface Art {
  id: string;
  ownerId: string;
  ownerUsername: string;
  // At most one of these three is set — art's parent is a photo, another
  // piece of art, an idea, or (all null) nothing at all.
  inspiredByPhoto: string | null;
  inspiredByArt: string | null;
  inspiredByIdea: string | null;
  title: string | null;
  description: string | null;
  // One of the fixed list in db/schema.sql (art_medium_check) — "Photograph"
  // included, since art can be a photographic response to a photo/art/idea
  // just as easily as a painted one.
  medium: string | null;
  // Where this piece hangs on its owner's profile museum wall — null until
  // dragged into a spot. Frame look, plaque, and room colors come from the
  // owner's chosen room theme (see gallery.types.ts), not per-piece.
  wallX: number | null;
  wallY: number | null;
  storageKey: string;
  status: "live" | "rejected" | "pending" | "deleted";
  createdAt: string;
  loveCount: number;
  lovedByMe?: boolean;
}

export interface Photo {
  id: string;
  ownerId: string;
  ownerUsername: string;
  title: string | null;
  description: string | null;
  storageKey: string;
  status: "live" | "rejected" | "pending" | "deleted";
  createdAt: string;
  inspiredByIdea: string | null;
  // Where this piece hangs on its owner's profile museum wall — null until
  // the owner drags it into a specific spot, at which point the client
  // auto-lays out anything still null. Frame look, plaque, and room colors
  // come from the owner's chosen room theme (see gallery.types.ts), not
  // per-piece — every piece in a room matches.
  wallX: number | null;
  wallY: number | null;
  loveCount: number;
  artCount: number;
  lovedByMe?: boolean;
}

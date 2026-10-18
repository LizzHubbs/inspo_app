import * as feedRepo from "./feed.repository";
import * as photoRepo from "../photos/photo.repository";
import * as artRepo from "../art/art.repository";
import { Photo } from "../photos/photo.types";
import { Art } from "../art/art.types";

export type FeedItem = (Photo & { kind: "photo" }) | (Art & { kind: "art" });

// getRankedFriendFeed only returns ids in ranked order — batch-fetch the
// full rows for each kind, then walk the ranked order again to reassemble
// full objects in that same order (the batch fetches don't preserve it).
export async function getFeed(userId: string, limit = 30): Promise<FeedItem[]> {
  const ranked = await feedRepo.getRankedFriendFeed(userId, limit);

  const photoIds = ranked.filter((r) => r.kind === "photo").map((r) => r.id);
  const artIds = ranked.filter((r) => r.kind === "art").map((r) => r.id);

  const [photos, art] = await Promise.all([
    photoRepo.findPhotosByIds(photoIds, userId),
    artRepo.findArtByIds(artIds, userId),
  ]);

  const photoById = new Map(photos.map((p) => [p.id, p]));
  const artById = new Map(art.map((a) => [a.id, a]));

  const items: FeedItem[] = [];
  for (const entry of ranked) {
    if (entry.kind === "photo") {
      const p = photoById.get(entry.id);
      if (p) items.push({ ...p, kind: "photo" });
    } else {
      const a = artById.get(entry.id);
      if (a) items.push({ ...a, kind: "art" });
    }
  }
  return items;
}

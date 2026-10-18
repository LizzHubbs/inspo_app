import { request } from "./client";

// Friends' photos and art, ranked server-side by a blend of what you've
// loved before and recency (see feed.repository.ts) — not a plain
// chronological list.
export function getFeed({ limit = 30 } = {}) {
  const params = new URLSearchParams({ limit: String(limit) });
  return request(`/feed?${params}`);
}

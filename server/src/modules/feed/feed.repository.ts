import { pool } from "../../config/db";

export interface RankedFeedEntry {
  id: string;
  kind: "photo" | "art";
}

// Ranks friends' recent photos/art by a blend of "how much you've loved
// this medium before" (affinity) and recency, so the feed leans toward
// what this user actually likes rather than being purely chronological.
// Photos have no medium of their own to score against (every photo is
// implicitly "Photograph" — see art.types.ts), so they rank by recency
// only (affinity 0); art scores against the medium of art this user has
// loved in the past.
export async function getRankedFriendFeed(userId: string, limit: number): Promise<RankedFeedEntry[]> {
  const { rows } = await pool.query(
    `with loved_mediums as (
       select a.medium, count(*)::int as cnt
       from art_loves al
       join art a on a.id = al.art_id
       where al.user_id = $1 and a.medium is not null
       group by a.medium
     ),
     friend_ids as (
       select friend_id from friendships where user_id = $1
     ),
     ranked_photos as (
       select p.id, 'photo' as kind, p.created_at, 0 as affinity
       from photos p
       where p.status = 'live' and p.owner_id in (select friend_id from friend_ids)
     ),
     ranked_art as (
       select a.id, 'art' as kind, a.created_at,
         coalesce((select lm.cnt from loved_mediums lm where lm.medium = a.medium), 0) as affinity
       from art a
       where a.status = 'live' and a.owner_id in (select friend_id from friend_ids)
     )
     select id, kind, created_at, affinity from ranked_photos
     union all
     select id, kind, created_at, affinity from ranked_art
     order by affinity desc, created_at desc
     limit $2`,
    [userId, limit]
  );
  return rows;
}

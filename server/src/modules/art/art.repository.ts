import { pool } from "../../config/db";
import { Art } from "./art.types";

const LOVE_COUNT_SQL = `(select count(*)::int from art_loves al where al.art_id = a.id) as "loveCount"`;
const SELECT_COLUMNS = `
  a.id, a.owner_id as "ownerId", a.inspired_by as "inspiredByPhoto",
  a.inspired_by_art_id as "inspiredByArt", a.inspired_by_idea_id as "inspiredByIdea", a.title,
  a.description, a.medium, a.wall_x as "wallX", a.wall_y as "wallY",
  a.storage_key as "storageKey", a.status, a.created_at as "createdAt", ${LOVE_COUNT_SQL}
`;

export async function insertArt(input: {
  ownerId: string;
  inspiredByPhoto: string | null;
  inspiredByArt: string | null;
  inspiredByIdea: string | null;
  title: string | null;
  description: string | null;
  medium: string | null;
  storageKey: string;
  status: string;
}): Promise<Art> {
  const { rows } = await pool.query(
    `insert into art (owner_id, inspired_by, inspired_by_art_id, inspired_by_idea_id, title, description, medium, storage_key, status)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     returning id, owner_id as "ownerId", inspired_by as "inspiredByPhoto",
               inspired_by_art_id as "inspiredByArt", inspired_by_idea_id as "inspiredByIdea", title,
               description, medium, wall_x as "wallX", wall_y as "wallY",
               storage_key as "storageKey", status, created_at as "createdAt", 0 as "loveCount",
               (select username from users where id = $1) as "ownerUsername"`,
    [
      input.ownerId,
      input.inspiredByPhoto,
      input.inspiredByArt,
      input.inspiredByIdea,
      input.title,
      input.description,
      input.medium,
      input.storageKey,
      input.status,
    ]
  );
  return rows[0];
}

// viewerId is optional and only used for "lovedByMe" — same reasoning as
// photo.repository.ts: only the single-piece detail fetch passes it.
export async function findArtById(id: string, viewerId?: string): Promise<Art | null> {
  const { rows } = await pool.query(
    `select ${SELECT_COLUMNS},
            exists(select 1 from art_loves al2 where al2.art_id = a.id and al2.user_id = $2) as "lovedByMe",
            u.username as "ownerUsername"
     from art a
     join users u on u.id = a.owner_id
     where a.id = $1`,
    [id, viewerId ?? null]
  );
  return rows[0] ?? null;
}

// This is THE inspiration-graph read: all art for one photo. It's fast
// because of idx_art_inspired_by in db/schema.sql (inspired_by, created_at) —
// if this query ever shows up slow in logs, check that index exists before
// looking anywhere else.
export async function listArtByPhoto(photoId: string, limit: number): Promise<Art[]> {
  const { rows } = await pool.query(
    `select ${SELECT_COLUMNS}, u.username as "ownerUsername"
     from art a
     join users u on u.id = a.owner_id
     where a.inspired_by = $1 and a.status = 'live'
     order by a.created_at desc
     limit $2`,
    [photoId, limit]
  );
  return rows;
}

// Art inspired by another piece of art — the chain-continuation read,
// mirrors listArtByPhoto exactly but keyed off inspired_by_art_id.
export async function listArtByArt(artId: string, limit: number): Promise<Art[]> {
  const { rows } = await pool.query(
    `select ${SELECT_COLUMNS}, u.username as "ownerUsername"
     from art a
     join users u on u.id = a.owner_id
     where a.inspired_by_art_id = $1 and a.status = 'live'
     order by a.created_at desc
     limit $2`,
    [artId, limit]
  );
  return rows;
}

// Art submitted directly for an idea (not routed through a photo first).
export async function listArtByIdea(ideaId: string, limit: number): Promise<Art[]> {
  const { rows } = await pool.query(
    `select ${SELECT_COLUMNS}, u.username as "ownerUsername"
     from art a
     join users u on u.id = a.owner_id
     where a.inspired_by_idea_id = $1 and a.status = 'live'
     order by a.created_at desc
     limit $2`,
    [ideaId, limit]
  );
  return rows;
}

// Batch fetch for the ranked friend feed (feed.service.ts) — same reasoning
// as photo.repository.ts's findPhotosByIds.
export async function findArtByIds(ids: string[], viewerId?: string): Promise<Art[]> {
  if (ids.length === 0) return [];
  const { rows } = await pool.query(
    `select ${SELECT_COLUMNS},
            exists(select 1 from art_loves al2 where al2.art_id = a.id and al2.user_id = $2) as "lovedByMe",
            u.username as "ownerUsername"
     from art a
     join users u on u.id = a.owner_id
     where a.id = any($1::uuid[])`,
    [ids, viewerId ?? null]
  );
  return rows;
}

export async function softDeleteArt(id: string): Promise<void> {
  await pool.query(`update art set status = 'deleted' where id = $1`, [id]);
}

// The "my art across all photos" read — every art.routes.ts query so far
// filters by inspired_by (one photo); this is the only one filtered by
// owner_id instead, for the profile page's Art tab.
export async function listArtByOwner(ownerId: string, limit: number): Promise<Art[]> {
  const { rows } = await pool.query(
    `select ${SELECT_COLUMNS}, u.username as "ownerUsername"
     from art a
     join users u on u.id = a.owner_id
     where a.owner_id = $1 and a.status = 'live'
     order by a.created_at desc
     limit $2`,
    [ownerId, limit]
  );
  return rows;
}

// The art half of the feed — same cursor pattern as listLivePhotos, so
// Feed.jsx can merge-sort the two lists by createdAt.
export async function listLiveArt(limit: number, before?: string): Promise<Art[]> {
  const { rows } = await pool.query(
    `select ${SELECT_COLUMNS}, u.username as "ownerUsername"
     from art a
     join users u on u.id = a.owner_id
     where a.status = 'live' and ($2::timestamptz is null or a.created_at < $2)
     order by a.created_at desc
     limit $1`,
    [limit, before ?? null]
  );
  return rows;
}

export async function updateArt(
  id: string,
  input: { title: string | null; description: string | null; medium: string | null }
): Promise<void> {
  await pool.query(`update art set title = $2, description = $3, medium = $4 where id = $1`, [
    id,
    input.title,
    input.description,
    input.medium,
  ]);
}

// Separate from updateArt (title/description/medium) — set from dragging
// on the museum wall (see MuseumWall.jsx), not the edit form.
export async function updateArtPlacement(id: string, input: { wallX: number | null; wallY: number | null }): Promise<void> {
  await pool.query(`update art set wall_x = $2, wall_y = $3 where id = $1`, [id, input.wallX, input.wallY]);
}

export async function addLove(artId: string, userId: string): Promise<void> {
  await pool.query(`insert into art_loves (art_id, user_id) values ($1, $2) on conflict do nothing`, [artId, userId]);
}

export async function removeLove(artId: string, userId: string): Promise<void> {
  await pool.query(`delete from art_loves where art_id = $1 and user_id = $2`, [artId, userId]);
}

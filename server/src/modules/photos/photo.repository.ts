import { pool } from "../../config/db";
import { Photo } from "./photo.types";

// Raw SQL on purpose, not an ORM: the schema is small (two tables, one
// foreign key) and every function here maps 1:1 to a single readable
// statement. If a query is slow or wrong, you're looking straight at the
// SQL that ran — no query-builder translation layer in between.

// loveCount/artCount are computed with correlated subqueries rather than a
// denormalized counter column — simpler to keep correct (no increment/
// decrement bugs), and this app's read volume doesn't need the counter.
const LOVE_COUNT_SQL = `(select count(*)::int from photo_loves pl where pl.photo_id = p.id) as "loveCount"`;
const ART_COUNT_SQL = `(select count(*)::int from art a2 where a2.inspired_by = p.id and a2.status = 'live') as "artCount"`;
const SELECT_COLUMNS = `
  p.id, p.owner_id as "ownerId", p.title, p.description, p.storage_key as "storageKey",
  p.status, p.created_at as "createdAt", p.inspired_by_idea as "inspiredByIdea",
  p.wall_x as "wallX", p.wall_y as "wallY",
  ${LOVE_COUNT_SQL}, ${ART_COUNT_SQL}
`;

// Hides a row when the viewer and the owner have blocked each other in
// either direction. viewerIndex is the $N position of the viewerId param
// in each query below — when it's null (no one asking, or a write path
// that doesn't care), the check is skipped and nothing is hidden.
function notBlockedSql(viewerIndex: number) {
  return `($${viewerIndex}::uuid is null or not exists (
    select 1 from blocks b
    where (b.user_id = $${viewerIndex} and b.blocked_id = p.owner_id)
       or (b.user_id = p.owner_id and b.blocked_id = $${viewerIndex})
  ))`;
}

export async function insertPhoto(input: {
  ownerId: string;
  title: string | null;
  description: string | null;
  storageKey: string;
  status: string;
  inspiredByIdea?: string | null;
}): Promise<Photo> {
  const { rows } = await pool.query(
    `insert into photos (owner_id, title, description, storage_key, status, inspired_by_idea)
     values ($1, $2, $3, $4, $5, $6)
     returning id, owner_id as "ownerId", title, description, storage_key as "storageKey",
               status, created_at as "createdAt", inspired_by_idea as "inspiredByIdea",
               wall_x as "wallX", wall_y as "wallY",
               0 as "loveCount", 0 as "artCount",
               (select username from users where id = $1) as "ownerUsername"`,
    [input.ownerId, input.title, input.description, input.storageKey, input.status, input.inspiredByIdea ?? null]
  );
  return rows[0];
}

// viewerId is optional and only used for "lovedByMe" — list reads don't
// pass it (badges just show counts), only the single-photo detail fetch
// does, so it can render a filled vs outline heart for whoever's looking.
export async function findPhotoById(id: string, viewerId?: string): Promise<Photo | null> {
  const { rows } = await pool.query(
    `select ${SELECT_COLUMNS},
            exists(select 1 from photo_loves pl2 where pl2.photo_id = p.id and pl2.user_id = $2) as "lovedByMe",
            u.username as "ownerUsername"
     from photos p
     join users u on u.id = p.owner_id
     where p.id = $1`,
    [id, viewerId ?? null]
  );
  return rows[0] ?? null;
}

// Batch fetch for the ranked friend feed (feed.service.ts) — order isn't
// guaranteed by this query, the feed re-sorts by the ranking it already
// computed once it has the full rows.
export async function findPhotosByIds(ids: string[], viewerId?: string): Promise<Photo[]> {
  if (ids.length === 0) return [];
  const { rows } = await pool.query(
    `select ${SELECT_COLUMNS},
            exists(select 1 from photo_loves pl2 where pl2.photo_id = p.id and pl2.user_id = $2) as "lovedByMe",
            u.username as "ownerUsername"
     from photos p
     join users u on u.id = p.owner_id
     where p.id = any($1::uuid[])`,
    [ids, viewerId ?? null]
  );
  return rows;
}

// Cursor-based pagination (by created_at), not offset — matches the design
// call to avoid offset pagination breaking under concurrent inserts.
// viewerId (optional) hides photos from anyone blocked in either direction.
export async function listLivePhotos(limit: number, before?: string, viewerId?: string): Promise<Photo[]> {
  const { rows } = await pool.query(
    `select ${SELECT_COLUMNS}, u.username as "ownerUsername"
     from photos p
     join users u on u.id = p.owner_id
     where p.status = 'live' and ($2::timestamptz is null or p.created_at < $2)
       and ${notBlockedSql(3)}
     order by p.created_at desc
     limit $1`,
    [limit, before ?? null, viewerId ?? null]
  );
  return rows;
}

export async function softDeletePhoto(id: string): Promise<void> {
  await pool.query(`update photos set status = 'deleted' where id = $1`, [id]);
}

// Every photo taken in response to one idea — the idea's "photos" tab.
export async function listPhotosByIdea(ideaId: string, limit: number, viewerId?: string): Promise<Photo[]> {
  const { rows } = await pool.query(
    `select ${SELECT_COLUMNS}, u.username as "ownerUsername"
     from photos p
     join users u on u.id = p.owner_id
     where p.inspired_by_idea = $1 and p.status = 'live'
       and ${notBlockedSql(3)}
     order by p.created_at desc
     limit $2`,
    [ideaId, limit, viewerId ?? null]
  );
  return rows;
}

// A user's own public "Inspiration" grid — used by the profile page for
// someone other than the viewer. Same block check: if either side has
// blocked the other, this comes back empty rather than erroring, so the
// profile page still loads (just with nothing to show).
export async function listPhotosByOwner(ownerId: string, limit: number, viewerId?: string): Promise<Photo[]> {
  const { rows } = await pool.query(
    `select ${SELECT_COLUMNS}, u.username as "ownerUsername"
     from photos p
     join users u on u.id = p.owner_id
     where p.owner_id = $1 and p.status = 'live'
       and ${notBlockedSql(3)}
     order by p.created_at desc
     limit $2`,
    [ownerId, limit, viewerId ?? null]
  );
  return rows;
}

export async function updatePhoto(id: string, input: { title: string | null; description: string | null }): Promise<void> {
  await pool.query(`update photos set title = $2, description = $3 where id = $1`, [id, input.title, input.description]);
}

// Separate from updatePhoto (title/description) since this is set from a
// completely different UI — dragging on the museum wall (see MuseumWall.jsx),
// not the edit form.
export async function updatePhotoPlacement(id: string, input: { wallX: number | null; wallY: number | null }): Promise<void> {
  await pool.query(`update photos set wall_x = $2, wall_y = $3 where id = $1`, [id, input.wallX, input.wallY]);
}

// Backend search over title + description (see photo.service.ts) — tags
// are gone, this is what replaced them.
export async function searchPhotos(query: string, limit: number, viewerId?: string): Promise<Photo[]> {
  const { rows } = await pool.query(
    `select ${SELECT_COLUMNS}, u.username as "ownerUsername"
     from photos p
     join users u on u.id = p.owner_id
     where p.status = 'live'
       and (p.title ilike $1 or p.description ilike $1)
       and ${notBlockedSql(3)}
     order by p.created_at desc
     limit $2`,
    [`%${query}%`, limit, viewerId ?? null]
  );
  return rows;
}

// "Inzzpired" mode — photos a user has saved to work from. Own-eyes-only
// (see photo.routes.ts: no :id in the GET route, always the requester's
// own list), so there's no viewerId/block check here like the public reads
// above.
export async function addWorkingPhoto(userId: string, photoId: string): Promise<void> {
  await pool.query(
    `insert into working_photos (user_id, photo_id) values ($1, $2) on conflict do nothing`,
    [userId, photoId]
  );
}

export async function removeWorkingPhoto(userId: string, photoId: string): Promise<void> {
  await pool.query(`delete from working_photos where user_id = $1 and photo_id = $2`, [userId, photoId]);
}

export async function listWorkingPhotos(userId: string): Promise<Photo[]> {
  const { rows } = await pool.query(
    `select ${SELECT_COLUMNS}, u.username as "ownerUsername"
     from working_photos w
     join photos p on p.id = w.photo_id
     join users u on u.id = p.owner_id
     where w.user_id = $1
     order by w.created_at desc`,
    [userId]
  );
  return rows;
}

export async function addLove(photoId: string, userId: string): Promise<void> {
  await pool.query(
    `insert into photo_loves (photo_id, user_id) values ($1, $2) on conflict do nothing`,
    [photoId, userId]
  );
}

export async function removeLove(photoId: string, userId: string): Promise<void> {
  await pool.query(`delete from photo_loves where photo_id = $1 and user_id = $2`, [photoId, userId]);
}

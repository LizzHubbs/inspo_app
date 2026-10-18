import { pool } from "../../config/db";
import { Idea } from "./idea.types";

// Raw SQL on purpose, same reasoning as photo.repository.ts — small schema,
// every function maps 1:1 to one readable statement.

export async function insertIdea(input: { ownerId: string; text: string }): Promise<Idea> {
  const { rows } = await pool.query(
    `insert into ideas (owner_id, text, status)
     values ($1, $2, 'live')
     returning id, owner_id as "ownerId", text, status, created_at as "createdAt",
               (select username from users where id = $1) as "ownerUsername"`,
    [input.ownerId, input.text]
  );
  return rows[0];
}

export async function findIdeaById(id: string): Promise<Idea | null> {
  const { rows } = await pool.query(
    `select i.id, i.owner_id as "ownerId", i.text, i.status, i.created_at as "createdAt",
            u.username as "ownerUsername"
     from ideas i
     join users u on u.id = i.owner_id
     where i.id = $1`,
    [id]
  );
  return rows[0] ?? null;
}

export async function softDeleteIdea(id: string): Promise<void> {
  await pool.query(`update ideas set status = 'deleted' where id = $1`, [id]);
}

// Cursor-based pagination (by created_at), same as listLivePhotos.
export async function listLiveIdeas(limit: number, before?: string): Promise<Idea[]> {
  const { rows } = await pool.query(
    `select i.id, i.owner_id as "ownerId", i.text, i.status, i.created_at as "createdAt",
            u.username as "ownerUsername"
     from ideas i
     join users u on u.id = i.owner_id
     where i.status = 'live' and ($2::timestamptz is null or i.created_at < $2)
     order by i.created_at desc
     limit $1`,
    [limit, before ?? null]
  );
  return rows;
}

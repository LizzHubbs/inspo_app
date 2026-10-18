import { pool } from "../../config/db";
import { User, UserWithRelation } from "./user.types";

export async function findUserById(id: string): Promise<User | null> {
  const { rows } = await pool.query(`select id, username from users where id = $1`, [id]);
  return rows[0] ?? null;
}

// Single-user version of searchUsers — same isFriend/isBlockedByMe flags,
// used by the public profile page so it can show the right action button.
export async function findUserWithRelation(id: string, viewerId: string): Promise<UserWithRelation | null> {
  const { rows } = await pool.query(
    `select u.id, u.username,
            exists(select 1 from friendships f where f.user_id = $2 and f.friend_id = u.id) as "isFriend",
            exists(select 1 from blocks b where b.user_id = $2 and b.blocked_id = u.id) as "isBlockedByMe"
     from users u
     where u.id = $1`,
    [id, viewerId]
  );
  return rows[0] ?? null;
}

// Excludes the viewer themselves — searching never needs to find yourself.
export async function searchUsers(query: string, viewerId: string, limit: number): Promise<UserWithRelation[]> {
  const { rows } = await pool.query(
    `select u.id, u.username,
            exists(select 1 from friendships f where f.user_id = $2 and f.friend_id = u.id) as "isFriend",
            exists(select 1 from blocks b where b.user_id = $2 and b.blocked_id = u.id) as "isBlockedByMe"
     from users u
     where u.username ilike $1 and u.id <> $2
     order by u.username
     limit $3`,
    [`%${query}%`, viewerId, limit]
  );
  return rows;
}

export async function listFriends(userId: string): Promise<User[]> {
  const { rows } = await pool.query(
    `select u.id, u.username
     from friendships f
     join users u on u.id = f.friend_id
     where f.user_id = $1
     order by u.username`,
    [userId]
  );
  return rows;
}

export async function areFriends(userId: string, otherId: string): Promise<boolean> {
  const { rows } = await pool.query(
    `select 1 from friendships where user_id = $1 and friend_id = $2`,
    [userId, otherId]
  );
  return rows.length > 0;
}

// Both directions in one statement — friendship is symmetric, so it's
// always exactly two rows or none.
export async function addFriendship(userId: string, friendId: string): Promise<void> {
  await pool.query(
    `insert into friendships (user_id, friend_id) values ($1, $2), ($2, $1) on conflict do nothing`,
    [userId, friendId]
  );
}

export async function removeFriendship(userId: string, friendId: string): Promise<void> {
  await pool.query(
    `delete from friendships where (user_id = $1 and friend_id = $2) or (user_id = $2 and friend_id = $1)`,
    [userId, friendId]
  );
}

export async function isBlocked(userId: string, otherId: string): Promise<boolean> {
  const { rows } = await pool.query(
    `select 1 from blocks where (user_id = $1 and blocked_id = $2) or (user_id = $2 and blocked_id = $1)`,
    [userId, otherId]
  );
  return rows.length > 0;
}

export async function listBlocked(userId: string): Promise<User[]> {
  const { rows } = await pool.query(
    `select u.id, u.username
     from blocks b
     join users u on u.id = b.blocked_id
     where b.user_id = $1
     order by u.username`,
    [userId]
  );
  return rows;
}

export async function addBlock(userId: string, blockedId: string): Promise<void> {
  await pool.query(
    `insert into blocks (user_id, blocked_id) values ($1, $2) on conflict do nothing`,
    [userId, blockedId]
  );
}

export async function removeBlock(userId: string, blockedId: string): Promise<void> {
  await pool.query(`delete from blocks where user_id = $1 and blocked_id = $2`, [userId, blockedId]);
}

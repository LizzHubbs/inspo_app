import { pool } from "../../config/db";

export async function getGoal(userId: string): Promise<{ photoGoal: number | null; artGoal: number | null }> {
  const { rows } = await pool.query(
    `select photo_goal as "photoGoal", art_goal as "artGoal" from goals where user_id = $1`,
    [userId]
  );
  return rows[0] ?? { photoGoal: null, artGoal: null };
}

export async function setGoal(
  userId: string,
  input: { photoGoal: number | null; artGoal: number | null }
): Promise<void> {
  await pool.query(
    `insert into goals (user_id, photo_goal, art_goal, updated_at)
     values ($1, $2, $3, now())
     on conflict (user_id) do update set photo_goal = $2, art_goal = $3, updated_at = now()`,
    [userId, input.photoGoal, input.artGoal]
  );
}

// Progress is counted live, never stored — filtering to the current
// calendar year on every read means it can't drift out of sync with what a
// user has actually posted (same reasoning as loveCount/artCount being
// correlated subqueries elsewhere in this app).
export async function countPhotosThisYear(userId: string): Promise<number> {
  const { rows } = await pool.query(
    `select count(*)::int as count from photos
     where owner_id = $1 and status = 'live'
       and date_part('year', created_at) = date_part('year', now())`,
    [userId]
  );
  return rows[0].count;
}

export async function countArtThisYear(userId: string): Promise<number> {
  const { rows } = await pool.query(
    `select count(*)::int as count from art
     where owner_id = $1 and status = 'live'
       and date_part('year', created_at) = date_part('year', now())`,
    [userId]
  );
  return rows[0].count;
}

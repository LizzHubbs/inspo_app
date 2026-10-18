import { Pool } from "pg";
import { env } from "./env";

export const pool = new Pool({ connectionString: env.databaseUrl });

pool.on("error", (err) => {
  // A connection dying in the pool shouldn't crash the process, but it
  // should be loud in the logs — this is usually the first sign of a
  // Postgres restart or a maxed-out connection limit.
  console.error("[db] unexpected error on idle client", err);
});

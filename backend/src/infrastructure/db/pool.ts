import { Pool, type QueryResultRow } from "pg";

import { config } from "../../config/index.js";

let pool: Pool | undefined;

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({ connectionString: config.databaseUrl, max: 10 });
    // Without this, a dropped backend connection surfaces as an uncaught
    // 'error' event and takes the whole process down.
    pool.on("error", (err) => console.error("[db] idle client error", err));
  }
  return pool;
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[],
): Promise<T[]> {
  const result = await getPool().query<T>(text, params);
  return result.rows;
}

export async function queryOne<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[],
): Promise<T | undefined> {
  const rows = await query<T>(text, params);
  return rows[0];
}

export async function closePool(): Promise<void> {
  await pool?.end();
  pool = undefined;
}

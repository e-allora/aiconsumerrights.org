import { neon } from "@neondatabase/serverless";

type Sql = ReturnType<typeof neon>;

let sql: Sql | null = null;

/**
 * The Neon query function, created on first use. `next build` imports route
 * files before DATABASE_URL exists, so nothing connects at import time.
 *
 * Neon queries travel over fetch, and Next.js 14 caches fetch in server
 * code, POST included. Without no-store, a GET route kept answering with
 * the first result it ever saw.
 */
export function getSql(): Sql {
  if (!sql) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set");
    sql = neon(url, { fetchOptions: { cache: "no-store" } });
  }
  return sql;
}

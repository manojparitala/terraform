import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { MIGRATIONS } from "./schema";
import { seedDemoData } from "./seed";

export type DB = Database.Database;

export function migrate(db: DB): void {
  const applied = db.pragma("user_version", { simple: true }) as number;
  for (let version = applied; version < MIGRATIONS.length; version++) {
    db.transaction(() => {
      db.exec(MIGRATIONS[version]);
      db.pragma(`user_version = ${version + 1}`);
    })();
  }
}

/** Opens (creating if needed) a database and brings its schema up to date. */
export function openDatabase(filename: string, options: { seed?: boolean } = {}): DB {
  if (filename !== ":memory:") fs.mkdirSync(path.dirname(filename), { recursive: true });

  const db = new Database(filename);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.pragma("busy_timeout = 5000");
  migrate(db);

  if (options.seed) {
    const { count } = db.prepare("SELECT COUNT(*) AS count FROM users").get() as { count: number };
    if (count === 0) seedDemoData(db, new Date());
  }
  return db;
}

const globalForDb = globalThis as typeof globalThis & { prepchefDb?: DB };

/** The app's shared connection, reused across hot reloads in development. */
export function getDb(): DB {
  if (!globalForDb.prepchefDb) {
    const filename = process.env.DATABASE_PATH ?? path.join(process.cwd(), "data", "prepchef.db");
    globalForDb.prepchefDb = openDatabase(filename, {
      seed: process.env.SEED_DEMO_DATA !== "false",
    });
  }
  return globalForDb.prepchefDb;
}

import Database from "better-sqlite3";
import { readdirSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const DB_PATH = join(__dirname, "..", "..", "data", "banco.db");
const MIGRATION_DIR = join(__dirname, "migrations");

const db = new Database(DB_PATH);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

function runMigrations() {
  const files = readdirSync(MIGRATION_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const sql = readFileSync(join(MIGRATION_DIR, file), "utf-8");
    db.exec(sql);
    console.log(`[db] migration aplicada: ${file}`);
  }
}

runMigrations();

export default db;

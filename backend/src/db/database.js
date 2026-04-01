const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

const DB_DIR = path.join(__dirname, "../../data");
const DB_PATH = path.join(DB_DIR, "app.db");

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const db = new Database(DB_PATH);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS wiki_groups (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS wiki_items (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    group_id TEXT,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (group_id) REFERENCES wiki_groups(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS wiki_shortcuts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS todo_tasks (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    note TEXT NOT NULL DEFAULT '',
    priority TEXT NOT NULL DEFAULT 'Moyenne',
    due TEXT NOT NULL DEFAULT '',
    done INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS todo_shortcuts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    note TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS permanences (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    start TEXT NOT NULL,
    end TEXT NOT NULL,
    all_day INTEGER NOT NULL DEFAULT 0,
    owner_id TEXT NOT NULL,
    owner_name TEXT NOT NULL,
    owner_group TEXT NOT NULL DEFAULT '',
    scope TEXT NOT NULL DEFAULT 'mine',
    label TEXT NOT NULL DEFAULT '',
    type TEXT NOT NULL DEFAULT '',
    tickets INTEGER NOT NULL DEFAULT 0,
    background_color TEXT NOT NULL DEFAULT '#1f6f43',
    border_color TEXT NOT NULL DEFAULT '#1f6f43',
    text_color TEXT NOT NULL DEFAULT '#ffffff',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS suivi_entries (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    pac TEXT NOT NULL,
    client_name TEXT NOT NULL,
    client_bu TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL,
    added_at TEXT NOT NULL,
    created_by TEXT NOT NULL DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS suivi_comments (
    id TEXT PRIMARY KEY,
    entry_id TEXT NOT NULL,
    text TEXT NOT NULL,
    created_at TEXT NOT NULL,
    by TEXT NOT NULL DEFAULT '',
    FOREIGN KEY (entry_id) REFERENCES suivi_entries(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS suivi_status_history (
    id TEXT PRIMARY KEY,
    entry_id TEXT NOT NULL,
    status TEXT NOT NULL,
    at TEXT NOT NULL,
    by TEXT NOT NULL DEFAULT '',
    FOREIGN KEY (entry_id) REFERENCES suivi_entries(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    numero_ticket TEXT NOT NULL DEFAULT '',
    objet TEXT NOT NULL DEFAULT '',
    priorite TEXT NOT NULL DEFAULT '',
    priorite_rms TEXT NOT NULL DEFAULT '',
    date_promis_pour TEXT NOT NULL DEFAULT '',
    echeance TEXT NOT NULL DEFAULT '',
    id_externe TEXT NOT NULL DEFAULT '',
    code_client TEXT NOT NULL DEFAULT '',
    compte TEXT NOT NULL DEFAULT '',
    proprietaire TEXT NOT NULL DEFAULT '',
    statut TEXT NOT NULL DEFAULT '',
    categorie TEXT NOT NULL DEFAULT '',
    classification_bu TEXT NOT NULL DEFAULT '',
    imported_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

module.exports = db;

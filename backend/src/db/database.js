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
    login_adesi TEXT NOT NULL DEFAULT '',
    imported_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS subject_templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS subjects (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    is_template INTEGER NOT NULL DEFAULT 0,
    pac TEXT NOT NULL DEFAULT '',
    client_name TEXT NOT NULL DEFAULT '',
    handler_id TEXT NOT NULL DEFAULT '',
    handler_name TEXT NOT NULL DEFAULT '',
    initial_ticket TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS subject_tickets (
    id TEXT PRIMARY KEY,
    subject_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    ticket_number TEXT NOT NULL,
    added_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    UNIQUE(subject_id, ticket_number)
  );
`);

// Migration : ajout de template_id sur subjects
try {
  db.exec(`ALTER TABLE subjects ADD COLUMN template_id TEXT NOT NULL DEFAULT ''`);
} catch { /* colonne déjà présente */ }

// Migration : ajout de login_adesi si la table existait déjà sans cette colonne
try {
  db.exec(`ALTER TABLE tickets ADD COLUMN login_adesi TEXT NOT NULL DEFAULT ''`);
} catch { /* colonne déjà présente */ }

// Migration : suppression des colonnes couleur de permanences (recréation de la table)
try {
  const cols = db.prepare("PRAGMA table_info(permanences)").all().map(c => c.name);
  if (cols.includes("background_color")) {
    db.exec(`
      BEGIN;
      CREATE TABLE permanences_new (
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
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      INSERT INTO permanences_new SELECT id, user_id, title, start, end, all_day, owner_id, owner_name, owner_group, scope, label, type, tickets, created_at FROM permanences;
      DROP TABLE permanences;
      ALTER TABLE permanences_new RENAME TO permanences;
      COMMIT;
    `);
  }
} catch (e) { console.error("Migration permanences:", e.message); }

module.exports = db;

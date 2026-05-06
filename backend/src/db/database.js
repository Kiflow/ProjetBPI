const Database = require("better-sqlite3");
const fs = require("fs");
const { DATA_DIR, DB_PATH } = require("../config/paths");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
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
    date_promis_pour TEXT NOT NULL DEFAULT '',
    echeance TEXT NOT NULL DEFAULT '',
    id_externe TEXT NOT NULL DEFAULT '',
    code_client TEXT NOT NULL DEFAULT '',
    compte TEXT NOT NULL DEFAULT '',
    proprietaire TEXT NOT NULL DEFAULT '',
    statut TEXT NOT NULL DEFAULT '',
    categorie TEXT NOT NULL DEFAULT '',
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

// ── Habilitation ─────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS habilitation_clients (
    id TEXT PRIMARY KEY,
    code_client TEXT NOT NULL,
    compte TEXT NOT NULL,
    client_num TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS habilitation_chefs_de_file (
    id TEXT PRIMARY KEY,
    habilitation_client_id TEXT NOT NULL,
    nom TEXT NOT NULL,
    prenom TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(habilitation_client_id, nom, prenom),
    FOREIGN KEY (habilitation_client_id) REFERENCES habilitation_clients(id) ON DELETE CASCADE
  );
`);

// Migration : ajout de bu sur habilitation_clients
try {
  db.exec(`ALTER TABLE habilitation_clients ADD COLUMN bu TEXT NOT NULL DEFAULT ''`);
} catch { /* colonne déjà présente */ }

// Migration : suppression de priorite_rms et classification_bu de tickets
try {
  const ticketCols = db.prepare("PRAGMA table_info(tickets)").all().map(c => c.name);
  if (ticketCols.includes("priorite_rms") || ticketCols.includes("classification_bu")) {
    const has = (col) => ticketCols.includes(col);
    db.exec(`
      BEGIN;
      CREATE TABLE tickets_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        numero_ticket TEXT NOT NULL DEFAULT '',
        objet TEXT NOT NULL DEFAULT '',
        priorite TEXT NOT NULL DEFAULT '',
        date_promis_pour TEXT NOT NULL DEFAULT '',
        echeance TEXT NOT NULL DEFAULT '',
        id_externe TEXT NOT NULL DEFAULT '',
        code_client TEXT NOT NULL DEFAULT '',
        compte TEXT NOT NULL DEFAULT '',
        proprietaire TEXT NOT NULL DEFAULT '',
        statut TEXT NOT NULL DEFAULT '',
        categorie TEXT NOT NULL DEFAULT '',
        login_adesi TEXT NOT NULL DEFAULT '',
        nom TEXT NOT NULL DEFAULT '',
        prenom TEXT NOT NULL DEFAULT '',
        derniere_maj TEXT NOT NULL DEFAULT '',
        imported_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      INSERT INTO tickets_new
        (id, numero_ticket, objet, priorite, date_promis_pour, echeance,
         id_externe, code_client, compte, proprietaire, statut, categorie,
         login_adesi, nom, prenom, derniere_maj, imported_at)
      SELECT
        id, numero_ticket, objet, priorite, date_promis_pour, echeance,
        id_externe, code_client, compte, proprietaire, statut, categorie,
        ${has("login_adesi")   ? "login_adesi"   : "''"},
        ${has("nom")           ? "nom"           : "''"},
        ${has("prenom")        ? "prenom"        : "''"},
        ${has("derniere_maj")  ? "derniere_maj"  : "''"},
        imported_at
      FROM tickets;
      DROP TABLE tickets;
      ALTER TABLE tickets_new RENAME TO tickets;
      COMMIT;
    `);
  }
} catch (e) { console.error("[migration] tickets cleanup:", e.message); }

// Migration : ajout de template_id sur subjects
try {
  db.exec(`ALTER TABLE subjects ADD COLUMN template_id TEXT NOT NULL DEFAULT ''`);
} catch { /* colonne déjà présente */ }

// Migration : ajout de login_adesi si la table existait déjà sans cette colonne
try {
  db.exec(`ALTER TABLE tickets ADD COLUMN login_adesi TEXT NOT NULL DEFAULT ''`);
} catch { /* colonne déjà présente */ }

// Migration : ajout de nom et prenom sur tickets
try {
  db.exec(`ALTER TABLE tickets ADD COLUMN nom TEXT NOT NULL DEFAULT ''`);
} catch { /* colonne déjà présente */ }
try {
  db.exec(`ALTER TABLE tickets ADD COLUMN prenom TEXT NOT NULL DEFAULT ''`);
} catch { /* colonne déjà présente */ }

// Migration : ajout de derniere_maj sur tickets
try {
  db.exec(`ALTER TABLE tickets ADD COLUMN derniere_maj TEXT NOT NULL DEFAULT ''`);
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

// Migration : ajout de project_number et notes sur subjects
try {
  db.exec(`ALTER TABLE subjects ADD COLUMN project_number TEXT NOT NULL DEFAULT ''`);
} catch { /* colonne déjà présente */ }
try {
  db.exec(`ALTER TABLE subjects ADD COLUMN notes TEXT NOT NULL DEFAULT ''`);
} catch { /* colonne déjà présente */ }

// Migration : soft-delete sur suivi_entries
try {
  db.exec(`ALTER TABLE suivi_entries ADD COLUMN archived INTEGER NOT NULL DEFAULT 0`);
} catch { /* colonne déjà présente */ }

// Migration : type sur suivi_status_history
try {
  db.exec(`ALTER TABLE suivi_status_history ADD COLUMN type TEXT NOT NULL DEFAULT 'status'`);
} catch { /* colonne déjà présente */ }
try {
  db.exec(`ALTER TABLE suivi_status_history ADD COLUMN old_value TEXT NOT NULL DEFAULT ''`);
} catch { /* colonne déjà présente */ }
try {
  db.exec(`ALTER TABLE suivi_status_history ADD COLUMN new_value TEXT NOT NULL DEFAULT ''`);
} catch { /* colonne déjà présente */ }

// Migration : suppression du ON DELETE CASCADE sur suivi_comments et suivi_status_history
// pour que l'historique survive au soft-delete des entrées
try {
  const commentCols = db.prepare("PRAGMA table_info(suivi_comments)").all().map(c => c.name);
  const historyCols = db.prepare("PRAGMA table_info(suivi_status_history)").all().map(c => c.name);
  // Vérifie si le CASCADE est encore actif en inspectant la définition de la table
  const commentDef = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='suivi_comments'").get();
  if (commentDef && commentDef.sql && commentDef.sql.includes("ON DELETE CASCADE")) {
    db.exec(`
      BEGIN;
      CREATE TABLE suivi_comments_new (
        id TEXT PRIMARY KEY,
        entry_id TEXT NOT NULL,
        text TEXT NOT NULL,
        created_at TEXT NOT NULL,
        by TEXT NOT NULL DEFAULT ''
      );
      INSERT INTO suivi_comments_new SELECT id, entry_id, text, created_at, by FROM suivi_comments;
      DROP TABLE suivi_comments;
      ALTER TABLE suivi_comments_new RENAME TO suivi_comments;
      COMMIT;
    `);
  }
  const historyDef = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='suivi_status_history'").get();
  if (historyDef && historyDef.sql && historyDef.sql.includes("ON DELETE CASCADE")) {
    const hasType = historyCols.includes("type");
    db.exec(`
      BEGIN;
      CREATE TABLE suivi_status_history_new (
        id TEXT PRIMARY KEY,
        entry_id TEXT NOT NULL,
        status TEXT NOT NULL,
        at TEXT NOT NULL,
        by TEXT NOT NULL DEFAULT '',
        type TEXT NOT NULL DEFAULT 'status'
      );
      INSERT INTO suivi_status_history_new SELECT id, entry_id, status, at, by${hasType ? ", type" : ", 'status'"} FROM suivi_status_history;
      DROP TABLE suivi_status_history;
      ALTER TABLE suivi_status_history_new RENAME TO suivi_status_history;
      COMMIT;
    `);
  }
} catch (e) { console.error("[migration] suivi cascade:", e.message); }

module.exports = db;

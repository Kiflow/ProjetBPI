const db = require("../db/database");

const getFullEntry = (entryId) => {
  const entry = db.prepare("SELECT * FROM suivi_entries WHERE id = ?").get(entryId);
  if (!entry) return null;
  const comments = db.prepare("SELECT * FROM suivi_comments WHERE entry_id = ? ORDER BY created_at").all(entryId);
  const statusHistory = db.prepare("SELECT * FROM suivi_status_history WHERE entry_id = ? ORDER BY at").all(entryId);
  return {
    id: entry.id,
    addedAt: entry.added_at,
    createdBy: entry.created_by,
    status: entry.status,
    client: { pac: entry.pac, name: entry.client_name, bu: entry.client_bu },
    comments: comments.map((c) => ({ id: c.id, text: c.text, createdAt: c.created_at, by: c.by })),
    statusHistory: statusHistory.map((h) => ({ id: h.id, status: h.status, at: h.at, by: h.by }))
  };
};

exports.getEntries = (req, res) => {
  const entries = db.prepare("SELECT id FROM suivi_entries WHERE user_id = ? ORDER BY added_at DESC").all(req.user.userId);
  const full = entries.map((e) => getFullEntry(e.id)).filter(Boolean);
  res.json(full);
};

exports.upsertEntry = (req, res) => {
  const { id, pac, clientName, clientBu, status, addedAt, createdBy, comment, commentId, historyId } = req.body;
  if (!id || !pac || !status) return res.status(400).json({ message: "id, pac et status requis" });

  const existing = db.prepare("SELECT id FROM suivi_entries WHERE id = ? AND user_id = ?").get(id, req.user.userId);

  if (!existing) {
    db.prepare(`
      INSERT INTO suivi_entries (id, user_id, pac, client_name, client_bu, status, added_at, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, req.user.userId, pac, clientName || "", clientBu || "", status, addedAt || new Date().toISOString(), createdBy || "");

    if (historyId) {
      db.prepare("INSERT INTO suivi_status_history (id, entry_id, status, at, by) VALUES (?, ?, ?, ?, ?)")
        .run(historyId, id, status, addedAt || new Date().toISOString(), createdBy || "");
    }
  } else {
    const now = new Date().toISOString();
    const current = db.prepare("SELECT status FROM suivi_entries WHERE id = ?").get(id);
    db.prepare("UPDATE suivi_entries SET status = ? WHERE id = ? AND user_id = ?").run(status, id, req.user.userId);

    if (current && current.status !== status && historyId) {
      db.prepare("INSERT INTO suivi_status_history (id, entry_id, status, at, by) VALUES (?, ?, ?, ?, ?)")
        .run(historyId, id, status, now, createdBy || "");
    }
  }

  if (comment && commentId) {
    db.prepare("INSERT INTO suivi_comments (id, entry_id, text, created_at, by) VALUES (?, ?, ?, ?, ?)")
      .run(commentId, id, comment, new Date().toISOString(), createdBy || "");
  }

  res.json(getFullEntry(id));
};

exports.addComment = (req, res) => {
  const { entryId } = req.params;
  const { id, text, by } = req.body;
  if (!id || !text) return res.status(400).json({ message: "id et text requis" });

  const entry = db.prepare("SELECT id FROM suivi_entries WHERE id = ? AND user_id = ?").get(entryId, req.user.userId);
  if (!entry) return res.status(404).json({ message: "Entrée introuvable" });

  const now = new Date().toISOString();
  db.prepare("INSERT INTO suivi_comments (id, entry_id, text, created_at, by) VALUES (?, ?, ?, ?, ?)").run(id, entryId, text, now, by || "");
  res.status(201).json({ id, text, createdAt: now, by });
};

exports.deleteEntry = (req, res) => {
  const { id } = req.params;
  db.prepare("DELETE FROM suivi_entries WHERE id = ? AND user_id = ?").run(id, req.user.userId);
  res.sendStatus(204);
};

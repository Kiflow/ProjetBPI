const db = require("../db/database");

const newId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

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
    archived: entry.archived,
    client: { pac: entry.pac, name: entry.client_name, bu: entry.client_bu },
    comments: comments.map(c => ({ id: c.id, text: c.text, createdAt: c.created_at, by: c.by })),
    statusHistory: statusHistory.map(h => ({ id: h.id, status: h.status, at: h.at, by: h.by, type: h.type || "status", oldValue: h.old_value || "", newValue: h.new_value || "" }))
  };
};

// Partagé entre tous les utilisateurs — pas de filtre user_id sur la lecture
exports.getEntries = (req, res) => {
  const entries = db.prepare("SELECT id FROM suivi_entries WHERE archived = 0 ORDER BY added_at DESC").all();
  res.json(entries.map(e => getFullEntry(e.id)).filter(Boolean));
};

exports.upsertEntry = (req, res) => {
  const { id, pac, clientName, clientBu, status, addedAt, createdBy, comment, commentId, historyId } = req.body;
  if (!id || !pac || !status) return res.status(400).json({ message: "id, pac et status requis" });

  const now = new Date().toISOString();
  const actor = createdBy || "Système";

  // Cherche par PAC (y compris les archivés) — global, pas filtré par user
  const existingByPac = db.prepare("SELECT * FROM suivi_entries WHERE pac = ?").get(pac);

  if (existingByPac) {
    const realId = existingByPac.id;

    if (existingByPac.archived) {
      // Restauration
      db.prepare("UPDATE suivi_entries SET archived = 0, status = ?, client_name = ?, client_bu = ? WHERE id = ?")
        .run(status, clientName || existingByPac.client_name, clientBu || existingByPac.client_bu, realId);
      db.prepare("INSERT INTO suivi_status_history (id, entry_id, status, at, by, type) VALUES (?, ?, ?, ?, ?, ?)")
        .run(historyId || newId(), realId, status, now, actor, "restored");
    } else {
      // Mise à jour : changement de statut si différent
      const current = db.prepare("SELECT status FROM suivi_entries WHERE id = ?").get(realId);
      if (current && current.status !== status) {
        db.prepare("UPDATE suivi_entries SET status = ? WHERE id = ?").run(status, realId);
        db.prepare("INSERT INTO suivi_status_history (id, entry_id, status, at, by, type) VALUES (?, ?, ?, ?, ?, ?)")
          .run(historyId || newId(), realId, status, now, actor, "status");
      }
    }

    if (comment && commentId) {
      db.prepare("INSERT INTO suivi_comments (id, entry_id, text, created_at, by) VALUES (?, ?, ?, ?, ?)")
        .run(commentId, realId, comment, now, actor);
    }
    return res.json(getFullEntry(realId));
  }

  // Création — on stocke user_id pour tracer le créateur
  db.prepare(`INSERT INTO suivi_entries (id, user_id, pac, client_name, client_bu, status, added_at, created_by, archived) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)`)
    .run(id, req.user.userId, pac, clientName || "", clientBu || "", status, addedAt || now, actor);
  db.prepare("INSERT INTO suivi_status_history (id, entry_id, status, at, by, type) VALUES (?, ?, ?, ?, ?, ?)")
    .run(historyId || newId(), id, status, addedAt || now, actor, "added");
  if (comment && commentId) {
    db.prepare("INSERT INTO suivi_comments (id, entry_id, text, created_at, by) VALUES (?, ?, ?, ?, ?)")
      .run(commentId, id, comment, now, actor);
  }
  res.json(getFullEntry(id));
};

exports.addComment = (req, res) => {
  const { entryId } = req.params;
  const { id, text, by } = req.body;
  if (!id || !text) return res.status(400).json({ message: "id et text requis" });
  const entry = db.prepare("SELECT id FROM suivi_entries WHERE id = ?").get(entryId);
  if (!entry) return res.status(404).json({ message: "Entrée introuvable" });
  const now = new Date().toISOString();
  db.prepare("INSERT INTO suivi_comments (id, entry_id, text, created_at, by) VALUES (?, ?, ?, ?, ?)").run(id, entryId, text, now, by || "");
  res.status(201).json({ id, text, createdAt: now, by });
};

exports.updateComment = (req, res) => {
  const { commentId } = req.params;
  const { text, by } = req.body;
  if (!text?.trim()) return res.status(400).json({ message: "text requis" });
  const comment = db.prepare("SELECT * FROM suivi_comments WHERE id = ?").get(commentId);
  if (!comment) return res.status(404).json({ message: "Commentaire introuvable" });
  if (comment.by !== by) return res.status(403).json({ message: "Non autorisé" });
  const oldText = comment.text;
  db.prepare("UPDATE suivi_comments SET text = ? WHERE id = ?").run(text.trim(), commentId);
  // Historique de la modification
  db.prepare("INSERT INTO suivi_status_history (id, entry_id, status, at, by, type, old_value, new_value) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
    .run(newId(), comment.entry_id, "", new Date().toISOString(), by, "comment_edited", oldText, text.trim());
  res.json({ id: commentId, text: text.trim(), createdAt: comment.created_at, by: comment.by });
};

exports.deleteComment = (req, res) => {
  const { commentId } = req.params;
  const { by } = req.query;
  const comment = db.prepare("SELECT * FROM suivi_comments WHERE id = ?").get(commentId);
  if (!comment) return res.sendStatus(204);
  if (comment.by !== by) return res.status(403).json({ message: "Non autorisé" });
  // Historique de la suppression
  db.prepare("INSERT INTO suivi_status_history (id, entry_id, status, at, by, type, old_value, new_value) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
    .run(newId(), comment.entry_id, "", new Date().toISOString(), by, "comment_deleted", comment.text, "");
  db.prepare("DELETE FROM suivi_comments WHERE id = ?").run(commentId);
  res.sendStatus(204);
};

exports.deleteEntry = (req, res) => {
  const { id } = req.params;
  const by = req.query.by || req.user.userId;
  const entry = db.prepare("SELECT * FROM suivi_entries WHERE id = ?").get(id);
  if (!entry) return res.sendStatus(204);
  db.prepare("UPDATE suivi_entries SET archived = 1 WHERE id = ?").run(id);
  db.prepare("INSERT INTO suivi_status_history (id, entry_id, status, at, by, type) VALUES (?, ?, ?, ?, ?, ?)")
    .run(newId(), id, entry.status, new Date().toISOString(), by, "removed");
  res.sendStatus(204);
};

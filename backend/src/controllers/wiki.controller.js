const db = require("../db/database");

// --- Groups ---

exports.getGroups = (req, res) => {
  const groups = db.prepare("SELECT * FROM wiki_groups WHERE user_id = ? ORDER BY name").all(req.user.userId);
  res.json(groups);
};

exports.createGroup = (req, res) => {
  const { id, name } = req.body;
  if (!id || !name) return res.status(400).json({ message: "id et name requis" });
  db.prepare("INSERT INTO wiki_groups (id, user_id, name) VALUES (?, ?, ?)").run(id, req.user.userId, name);
  res.status(201).json({ id, name });
};

exports.updateGroup = (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  if (!name) return res.status(400).json({ message: "name requis" });
  const result = db.prepare("UPDATE wiki_groups SET name = ? WHERE id = ? AND user_id = ?").run(name, id, req.user.userId);
  if (result.changes === 0) return res.status(404).json({ message: "Groupe introuvable" });
  res.json({ id, name });
};

exports.deleteGroup = (req, res) => {
  const { id } = req.params;
  db.prepare("UPDATE wiki_items SET group_id = NULL WHERE group_id = ? AND user_id = ?").run(id, req.user.userId);
  db.prepare("DELETE FROM wiki_groups WHERE id = ? AND user_id = ?").run(id, req.user.userId);
  res.sendStatus(204);
};

// --- Items ---

const mapItem = (row) => ({ id: row.id, name: row.name, url: row.url, groupId: row.group_id || null });

exports.getItems = (req, res) => {
  const items = db.prepare("SELECT * FROM wiki_items WHERE user_id = ? ORDER BY name").all(req.user.userId);
  res.json(items.map(mapItem));
};

exports.createItem = (req, res) => {
  const { id, name, url, groupId } = req.body;
  if (!id || !name || !url) return res.status(400).json({ message: "id, name et url requis" });
  db.prepare("INSERT INTO wiki_items (id, user_id, group_id, name, url) VALUES (?, ?, ?, ?, ?)").run(
    id, req.user.userId, groupId || null, name, url
  );
  res.status(201).json({ id, name, url, groupId: groupId || null });
};

exports.updateItem = (req, res) => {
  const { id } = req.params;
  const { name, url, groupId } = req.body;
  if (!name || !url) return res.status(400).json({ message: "name et url requis" });
  const result = db.prepare(
    "UPDATE wiki_items SET name = ?, url = ?, group_id = ? WHERE id = ? AND user_id = ?"
  ).run(name, url, groupId || null, id, req.user.userId);
  if (result.changes === 0) return res.status(404).json({ message: "Wiki introuvable" });
  res.json({ id, name, url, groupId: groupId || null });
};

exports.deleteItem = (req, res) => {
  const { id } = req.params;
  db.prepare("DELETE FROM wiki_items WHERE id = ? AND user_id = ?").run(id, req.user.userId);
  res.sendStatus(204);
};

// --- Shortcuts ---

exports.getShortcuts = (req, res) => {
  const shortcuts = db.prepare("SELECT * FROM wiki_shortcuts WHERE user_id = ? ORDER BY created_at").all(req.user.userId);
  res.json(shortcuts);
};

exports.createShortcut = (req, res) => {
  const { id, title, url } = req.body;
  if (!id || !title || !url) return res.status(400).json({ message: "id, title et url requis" });
  db.prepare("INSERT INTO wiki_shortcuts (id, user_id, title, url) VALUES (?, ?, ?, ?)").run(id, req.user.userId, title, url);
  res.status(201).json({ id, title, url });
};

exports.deleteShortcut = (req, res) => {
  const { id } = req.params;
  db.prepare("DELETE FROM wiki_shortcuts WHERE id = ? AND user_id = ?").run(id, req.user.userId);
  res.sendStatus(204);
};

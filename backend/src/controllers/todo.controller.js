const db = require("../db/database");

// --- Tasks ---

exports.getTasks = (req, res) => {
  const tasks = db.prepare("SELECT * FROM todo_tasks WHERE user_id = ? ORDER BY created_at DESC").all(req.user.userId);
  const mapped = tasks.map((t) => ({ ...t, done: t.done === 1 }));
  res.json(mapped);
};

exports.createTask = (req, res) => {
  const { id, title, note, priority, due, done, createdAt } = req.body;
  if (!id || !title) return res.status(400).json({ message: "id et title requis" });
  db.prepare(
    "INSERT INTO todo_tasks (id, user_id, title, note, priority, due, done, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
  ).run(id, req.user.userId, title, note || "", priority || "Moyenne", due || "", done ? 1 : 0, createdAt || new Date().toISOString());
  res.status(201).json({ id, title, note, priority, due, done: !!done, createdAt });
};

exports.updateTask = (req, res) => {
  const { id } = req.params;
  const { title, note, priority, due, done } = req.body;
  const result = db.prepare(
    "UPDATE todo_tasks SET title = ?, note = ?, priority = ?, due = ?, done = ? WHERE id = ? AND user_id = ?"
  ).run(title, note || "", priority || "Moyenne", due || "", done ? 1 : 0, id, req.user.userId);
  if (result.changes === 0) return res.status(404).json({ message: "Tâche introuvable" });
  res.json({ id, title, note, priority, due, done: !!done });
};

exports.deleteTask = (req, res) => {
  const { id } = req.params;
  db.prepare("DELETE FROM todo_tasks WHERE id = ? AND user_id = ?").run(id, req.user.userId);
  res.sendStatus(204);
};

// --- Shortcuts ---

exports.getShortcuts = (req, res) => {
  const shortcuts = db.prepare("SELECT * FROM todo_shortcuts WHERE user_id = ? ORDER BY created_at").all(req.user.userId);
  res.json(shortcuts);
};

exports.createShortcut = (req, res) => {
  const { id, title, note } = req.body;
  if (!id || !title) return res.status(400).json({ message: "id et title requis" });
  db.prepare("INSERT INTO todo_shortcuts (id, user_id, title, note) VALUES (?, ?, ?, ?)").run(id, req.user.userId, title, note || "");
  res.status(201).json({ id, title, note });
};

exports.deleteShortcut = (req, res) => {
  const { id } = req.params;
  db.prepare("DELETE FROM todo_shortcuts WHERE id = ? AND user_id = ?").run(id, req.user.userId);
  res.sendStatus(204);
};

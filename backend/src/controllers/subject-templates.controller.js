const db = require("../db/database");

const uid = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

exports.getTemplates = (req, res) => {
  const rows = db.prepare(`SELECT * FROM subject_templates ORDER BY name COLLATE NOCASE`).all();
  res.json(rows);
};

exports.createTemplate = (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ message: "name requis" });
  const id = uid();
  db.prepare(`INSERT INTO subject_templates (id, name, description) VALUES (?, ?, ?)`)
    .run(id, name.trim(), description || "");
  const created = db.prepare("SELECT * FROM subject_templates WHERE id = ?").get(id);
  res.status(201).json(created);
};

exports.updateTemplate = (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ message: "name requis" });
  const result = db.prepare(`UPDATE subject_templates SET name = ?, description = ? WHERE id = ?`)
    .run(name.trim(), description || "", id);
  if (result.changes === 0) return res.status(404).json({ message: "Modèle introuvable" });
  const updated = db.prepare("SELECT * FROM subject_templates WHERE id = ?").get(id);
  res.json(updated);
};

exports.deleteTemplate = (req, res) => {
  const { id } = req.params;
  db.prepare("DELETE FROM subject_templates WHERE id = ?").run(id);
  res.sendStatus(204);
};

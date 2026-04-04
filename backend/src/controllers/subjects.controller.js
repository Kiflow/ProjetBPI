const db = require("../db/database");

const uid = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

exports.getSubjects = (req, res) => {
  const rows = db.prepare(`
    SELECT s.*,
      (SELECT COUNT(*) FROM subject_tickets st WHERE st.subject_id = s.id) AS ticket_count
    FROM subjects s
    WHERE s.user_id = ?
    ORDER BY s.name COLLATE NOCASE
  `).all(req.user.userId);
  res.json(rows);
};

exports.createSubject = (req, res) => {
  const { name, description, pac, client_name, handler_id, handler_name, initial_ticket, template_id } = req.body;
  if (!name) return res.status(400).json({ message: "name requis" });
  const id = uid();
  db.prepare(`
    INSERT INTO subjects (id, user_id, name, description, pac, client_name, handler_id, handler_name, initial_ticket, template_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, req.user.userId,
    name, description || "",
    pac || "", client_name || "",
    handler_id || "", handler_name || "",
    initial_ticket || "",
    template_id || ""
  );
  const created = db.prepare("SELECT * FROM subjects WHERE id = ?").get(id);
  const count = { c: 0 };
  res.status(201).json({ ...created, ticket_count: count.c });
};

exports.updateSubject = (req, res) => {
  const { id } = req.params;
  const { name, description, handler_id, handler_name, initial_ticket, pac, client_name } = req.body;
  const result = db.prepare(`
    UPDATE subjects
    SET name = ?, description = ?, handler_id = ?, handler_name = ?, initial_ticket = ?, pac = ?, client_name = ?
    WHERE id = ? AND user_id = ?
  `).run(
    name, description || "",
    handler_id || "", handler_name || "",
    initial_ticket || "",
    pac || "", client_name || "",
    id, req.user.userId
  );
  if (result.changes === 0) return res.status(404).json({ message: "Sujet introuvable" });
  const updated = db.prepare("SELECT * FROM subjects WHERE id = ?").get(id);
  const count = db.prepare("SELECT COUNT(*) AS c FROM subject_tickets WHERE subject_id = ?").get(id);
  res.json({ ...updated, ticket_count: count.c });
};

exports.deleteSubject = (req, res) => {
  const { id } = req.params;
  db.prepare("DELETE FROM subjects WHERE id = ? AND user_id = ?").run(id, req.user.userId);
  res.sendStatus(204);
};

exports.getSubjectTickets = (req, res) => {
  const { id } = req.params;
  const rows = db.prepare(`
    SELECT st.id AS link_id, st.ticket_number, st.added_at,
      t.objet, t.code_client, t.priorite, t.login_adesi
    FROM subject_tickets st
    LEFT JOIN tickets t ON LOWER(TRIM(t.id_externe)) = LOWER(TRIM(st.ticket_number))
    WHERE st.subject_id = ?
    ORDER BY st.added_at DESC
  `).all(id);
  res.json(rows);
};

exports.addTicket = (req, res) => {
  const { id } = req.params;
  const { ticket_number } = req.body;
  if (!ticket_number) return res.status(400).json({ message: "ticket_number requis" });
  const subject = db.prepare("SELECT id FROM subjects WHERE id = ? AND user_id = ?").get(id, req.user.userId);
  if (!subject) return res.status(404).json({ message: "Sujet introuvable" });
  try {
    const linkId = uid();
    db.prepare("INSERT INTO subject_tickets (id, subject_id, user_id, ticket_number) VALUES (?, ?, ?, ?)")
      .run(linkId, id, req.user.userId, ticket_number.trim());
    res.status(201).json({ id: linkId, ticket_number });
  } catch {
    res.status(409).json({ message: "Ticket déjà lié à ce sujet" });
  }
};

exports.removeTicket = (req, res) => {
  const { id, linkId } = req.params;
  db.prepare("DELETE FROM subject_tickets WHERE id = ? AND subject_id = ?").run(linkId, id);
  res.sendStatus(204);
};

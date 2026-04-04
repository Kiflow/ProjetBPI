const db = require("../db/database");

const toEvent = (row) => ({
  id: row.id,
  title: row.title,
  start: row.start,
  end: row.end,
  allDay: row.all_day === 1,
  extendedProps: {
    ownerId: row.owner_id,
    ownerName: row.owner_name,
    ownerGroup: row.owner_group,
    scope: row.scope,
    label: row.label,
    type: row.type,
    tickets: row.tickets
  }
});

exports.getEvents = (req, res) => {
  const rows = db.prepare("SELECT * FROM permanences WHERE user_id = ? ORDER BY start").all(req.user.userId);
  res.json(rows.map(toEvent));
};

exports.createEvent = (req, res) => {
  const { id, title, start, end, allDay, extendedProps } = req.body;
  if (!id || !title || !start) return res.status(400).json({ message: "id, title et start requis" });
  const ep = extendedProps || {};
  db.prepare(`
    INSERT INTO permanences
      (id, user_id, title, start, end, all_day, owner_id, owner_name, owner_group, scope, label, type, tickets)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, req.user.userId, title, start, end || start,
    allDay ? 1 : 0,
    ep.ownerId || "", ep.ownerName || "", ep.ownerGroup || "",
    ep.scope || "mine", ep.label || "", ep.type || "",
    ep.tickets || 0
  );
  res.status(201).json({ id });
};

exports.updateTickets = (req, res) => {
  const { id } = req.params;
  const { tickets } = req.body;
  const result = db.prepare(
    "UPDATE permanences SET tickets = ? WHERE id = ? AND user_id = ?"
  ).run(tickets ?? 0, id, req.user.userId);
  if (result.changes === 0) return res.status(404).json({ message: "Permanence introuvable" });
  res.json({ id, tickets });
};

exports.deleteEvent = (req, res) => {
  const { id } = req.params;
  db.prepare("DELETE FROM permanences WHERE id = ? AND user_id = ?").run(id, req.user.userId);
  res.sendStatus(204);
};

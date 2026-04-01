const { importTickets } = require("../services/tickets-import.service");

exports.importTicketsManual = async (_req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const send = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`);

  try {
    const result = await importTickets((inserted, total, message) => {
      const pct = total > 0 ? Math.round((inserted / total) * 100) : 0;
      send({ pct, inserted, total, message });
    });
    send({ pct: 100, inserted: result.inserted, total: result.total, file: result.file, done: true });
  } catch (err) {
    console.error("[import] Erreur:", err.message);
    send({ error: err.message });
  }

  res.end();
};

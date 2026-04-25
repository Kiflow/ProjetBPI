const { randomUUID } = require("crypto");
const db = require("../db/database");
const { readInterlocuteurs } = require("../services/interlocuteurs.service");

// ── Clients gérés par habilitation ──────────────────────────────

exports.getClients = (req, res) => {
  const clients = db.prepare("SELECT * FROM habilitation_clients ORDER BY compte").all();
  const all = readInterlocuteurs();
  const result = clients.map((c) => ({
    ...c,
    nb_interlocuteurs: all.filter(
      (i) => i.code_client.toLowerCase() === c.code_client.toLowerCase()
    ).length,
  }));
  res.json(result);
};

exports.addClient = (req, res) => {
  const { code_client, compte, client_num } = req.body;
  if (!code_client || !compte)
    return res.status(400).json({ message: "code_client et compte requis." });

  const existing = db
    .prepare("SELECT id FROM habilitation_clients WHERE code_client = ?")
    .get(code_client);
  if (existing)
    return res.status(409).json({ message: "Ce client est déjà géré par habilitation." });

  const id = randomUUID();
  db.prepare(
    "INSERT INTO habilitation_clients (id, code_client, compte, client_num) VALUES (?, ?, ?, ?)"
  ).run(id, code_client, compte, client_num || "");

  res.status(201).json({ id, code_client, compte, client_num: client_num || "" });
};

exports.removeClient = (req, res) => {
  db.prepare("DELETE FROM habilitation_clients WHERE id = ?").run(req.params.id);
  res.json({ ok: true });
};

// ── Interlocuteurs (CSV + statut chef_de_file depuis DB) ─────────

exports.getInterlocuteurs = (req, res) => {
  const client = db
    .prepare("SELECT * FROM habilitation_clients WHERE id = ?")
    .get(req.params.clientId);
  if (!client) return res.status(404).json({ message: "Client introuvable." });

  const all = readInterlocuteurs();
  const csvRows = all.filter(
    (i) => i.code_client.toLowerCase() === client.code_client.toLowerCase()
  );

  // Enrichit avec le statut chef_de_file stocké en DB
  const chefs = db
    .prepare("SELECT nom, prenom FROM habilitation_chefs_de_file WHERE habilitation_client_id = ?")
    .all(req.params.clientId);
  const chefSet = new Set(chefs.map((c) => `${c.nom.toLowerCase()}::${c.prenom.toLowerCase()}`));

  const result = csvRows.map((i) => ({
    ...i,
    chef_de_file: chefSet.has(`${i.nom.toLowerCase()}::${i.prenom.toLowerCase()}`),
  }));

  res.json(result);
};

// ── Toggle chef de file ───────────────────────────────────────────

exports.toggleChefDeFile = (req, res) => {
  const { clientId } = req.params;
  const { nom, prenom } = req.body;
  if (!nom || !prenom) return res.status(400).json({ message: "nom et prenom requis." });

  const client = db
    .prepare("SELECT id FROM habilitation_clients WHERE id = ?")
    .get(clientId);
  if (!client) return res.status(404).json({ message: "Client introuvable." });

  const existing = db
    .prepare(
      "SELECT id FROM habilitation_chefs_de_file WHERE habilitation_client_id = ? AND LOWER(nom) = LOWER(?) AND LOWER(prenom) = LOWER(?)"
    )
    .get(clientId, nom, prenom);

  if (existing) {
    db.prepare("DELETE FROM habilitation_chefs_de_file WHERE id = ?").run(existing.id);
    return res.json({ chef_de_file: false });
  }

  db.prepare(
    "INSERT INTO habilitation_chefs_de_file (id, habilitation_client_id, nom, prenom) VALUES (?, ?, ?, ?)"
  ).run(randomUUID(), clientId, nom.trim(), prenom.trim());

  res.json({ chef_de_file: true });
};

// ── Chefs de file (pour le dashboard) ───────────────────────────

exports.getChefsDeFile = (req, res) => {
  const rows = db.prepare(`
    SELECT hc.code_client, hc.compte, cdf.nom, cdf.prenom
    FROM habilitation_chefs_de_file cdf
    JOIN habilitation_clients hc ON hc.id = cdf.habilitation_client_id
  `).all();
  res.json(rows);
};

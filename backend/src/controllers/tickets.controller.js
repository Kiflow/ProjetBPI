const { readTickets } = require("../services/excel.service");
const db = require("../db/database");

exports.getTickets = (req, res) => {
  const tickets = readTickets();
  res.json(tickets);
};

const ALLOWED_SORT = {
  Priorite: "priorite",
  DatePromisPour: "date_promis_pour",
  Echeance: "echeance",
  id: "id"
};

const mapRow = (r) => ({
  NumeroTicket: r.numero_ticket,
  Objet: r.objet,
  Priorite: r.priorite,
  PrioriteRms: r.priorite_rms,
  DatePromisPour: r.date_promis_pour,
  Echeance: r.echeance,
  IdExterne: r.id_externe,
  CodeClient: r.code_client,
  Compte: r.compte,
  Proprietaire: r.proprietaire,
  Statut: r.statut,
  Categorie: r.categorie,
  ClassificationBU: r.classification_bu,
  LoginAdesi: r.login_adesi
});

// --- RMS helpers ---

const normalizeDate = (raw) => {
  if (!raw) return null;
  const clean = String(raw).replace(/[^\d]/g, "");
  if (clean.length === 4) return `${clean.slice(0, 2)}/20${clean.slice(2)}`;
  if (clean.length === 6) return `${clean.slice(0, 2)}/${clean.slice(2)}`;
  return null;
};

const parseMonthYear = (value) => {
  const clean = String(value || "").replace(/[^\d]/g, "");
  if (clean.length !== 6) return null;
  const month = Number(clean.slice(0, 2));
  const year = Number(clean.slice(2));
  if (!month || month < 1 || month > 12) return null;
  return { month, year };
};

const extractRmsDates = (text) => {
  if (!text) return [];
  const upper = String(text).toUpperCase();
  if (!upper.includes("RMS")) return [];
  const matches = String(text).match(/\b\d{2}[\/.-]?\d{2,4}\b/g) ?? [];
  const normalized = matches.map(normalizeDate).filter(Boolean);
  return Array.from(new Set(normalized)).sort((a, b) => {
    const pa = parseMonthYear(a);
    const pb = parseMonthYear(b);
    if (!pa && !pb) return String(a).localeCompare(String(b));
    if (!pa) return -1;
    if (!pb) return 1;
    return pa.year !== pb.year ? pa.year - pb.year : pa.month - pb.month;
  });
};

exports.getRmsTickets = (req, res) => {
  const page    = Math.max(1, parseInt(req.query.page) || 1);
  const limit   = [10, 20, 50].includes(parseInt(req.query.limit)) ? parseInt(req.query.limit) : 20;
  const handler = req.query.handler || "all";
  const bu      = req.query.bu ? String(req.query.bu).split(",").filter(Boolean) : [];
  const offset  = (page - 1) * limit;

  const mine = req.query.mine === "true";

  const conditions = ["id_externe LIKE '%RMS%'"];
  const params = [];

  if (handler === "client") {
    conditions.push("LOWER(statut) = 'attente retour client'");
  } else if (handler === "adp") {
    conditions.push("LOWER(statut) != 'attente retour client'");
  }

  if (mine) {
    conditions.push("LOWER(login_adesi) = LOWER(?)");
    params.push(req.user.userId);
  }

  if (bu.length) {
    const placeholders = bu.map(() => "?").join(", ");
    conditions.push(`classification_bu IN (${placeholders})`);
    params.push(...bu);
  }

  const where = `WHERE ${conditions.join(" AND ")}`;

  const total = db.prepare(`SELECT COUNT(*) as n FROM tickets ${where}`).get(...params).n;
  const rows  = db.prepare(`SELECT * FROM tickets ${where} ORDER BY id LIMIT ? OFFSET ?`).all(...params, limit, offset);

  const buOptions = db.prepare(
    "SELECT DISTINCT classification_bu FROM tickets WHERE id_externe LIKE '%RMS%' AND classification_bu != '' ORDER BY classification_bu"
  ).all().map((r) => r.classification_bu);

  const tickets = rows.map((r) => ({
    ...mapRow(r),
    Dates: extractRmsDates(r.id_externe)
  }));

  res.json({ tickets, total, page, limit, buOptions });
};

exports.getTicketsFromDb = (req, res) => {
  const page    = Math.max(1, parseInt(req.query.page) || 1);
  const limit   = [10, 20, 50].includes(parseInt(req.query.limit)) ? parseInt(req.query.limit) : 20;
  const sortCol = ALLOWED_SORT[req.query.sort] || "id";
  const offset  = (page - 1) * limit;
  const mine    = req.query.mine === "true";

  const conditions = [];
  const params = [];

  if (mine) {
    conditions.push("LOWER(login_adesi) = LOWER(?)");
    params.push(req.user.userId);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const total = db.prepare(`SELECT COUNT(*) as n FROM tickets ${where}`).get(...params).n;
  const rows  = db.prepare(`SELECT * FROM tickets ${where} ORDER BY ${sortCol} LIMIT ? OFFSET ?`).all(...params, limit, offset);

  res.json({ tickets: rows.map(mapRow), total, page, limit });
};

const fs   = require("fs");
const path = require("path");
const xlsx = require("xlsx");
const db   = require("../db/database");
const { DATA_DIR, TICKETS_PATH } = require("../config/paths");

const resolveFilePath = () => {
  const envPath = process.env.TICKETS_FILE_PATH;
  if (envPath && fs.existsSync(envPath)) return envPath;

  if (fs.existsSync(TICKETS_PATH)) return TICKETS_PATH;

  // Recherche par nom si le fichier exact n'existe pas
  const files = fs.readdirSync(DATA_DIR);
  const match = files.find((f) => {
    const lower = f.toLowerCase();
    return lower.includes("ticket") &&
      (lower.endsWith(".csv") || lower.endsWith(".xlsx") || lower.endsWith(".xls"));
  });
  if (!match) throw new Error(`Aucun fichier tickets trouvé dans ${DATA_DIR}`);
  return `${DATA_DIR}/${match}`;
};

const normalizeKeys = (row) => {
  const out = {};
  for (const [k, v] of Object.entries(row)) out[k.trim()] = v;
  return out;
};

const mapRow = (row) => ({
  numero_ticket: String(
    row["Numero ticket"] ?? row["Numéro ticket"] ?? row["NumeroTicket"] ?? row["Numero Ticket"] ?? row["Numéro Ticket"] ?? ""
  ).trim(),
  objet: String(row.Objet ?? row.objet ?? "").trim(),
  priorite: String(row["Priorité"] ?? row.Priorite ?? row.priorite ?? "").trim(),
  date_promis_pour: String(row["Date promis pour"] ?? row["Date Promis pour"] ?? row["DatePromisPour"] ?? "").trim(),
  echeance: String(row["Échéance"] ?? row.Echeance ?? row.echeance ?? "").trim(),
  id_externe: String(row["ID externe"] ?? row["Id externe"] ?? row.IdExterne ?? "").trim(),
  code_client: String(
    row["Code Client"] ?? row["Code client"] ?? row.CodeClient ?? row.PAC ?? row.pac ?? ""
  ).trim(),
  compte: String(row.Compte ?? row.compte ?? row.Client ?? row.client ?? "").trim(),
  proprietaire: String(row["Propriétaire"] ?? row.Proprietaire ?? row.proprietaire ?? "").trim(),
  statut: String(row.Statut ?? row.statut ?? row.Status ?? row.status ?? "").trim(),
  categorie: String(row["Catégorie"] ?? row.Categorie ?? row.categorie ?? "").trim(),
  login_adesi: String(row["Login ADESI"] ?? row["Login Adesi"] ?? row["login_adesi"] ?? "").trim(),
  nom:          String(row["Nom"]    ?? row["nom"]    ?? "").trim(),
  prenom:       String(row["Prénom"] ?? row["Prenom"] ?? row["prenom"] ?? "").trim(),
  derniere_maj: String(row["Dernière mise à jour"] ?? row["Derniere mise a jour"] ?? row["derniere_maj"] ?? "").trim()
});

const BATCH_SIZE = 500;

const yieldToEventLoop = () => new Promise((resolve) => setImmediate(resolve));

const importTickets = async (onProgress) => {
  const filePath = resolveFilePath();
  const ext = path.extname(filePath).toLowerCase();
  const fileName = path.basename(filePath);

  onProgress && onProgress(0, 0, "Lecture du fichier...");
  await yieldToEventLoop();

  let rows;
  if (ext === ".csv") {
    const buffer = fs.readFileSync(filePath);
    let raw;

    // UTF-16 LE BOM : FF FE
    if (buffer[0] === 0xFF && buffer[1] === 0xFE) {
      raw = buffer.toString("utf16le").replace(/^\uFEFF/, "");
    // UTF-16 BE BOM : FE FF
    } else if (buffer[0] === 0xFE && buffer[1] === 0xFF) {
      raw = buffer.swap16().toString("utf16le").replace(/^\uFEFF/, "");
    } else {
      raw = buffer.toString("utf8");
      if (raw.includes("\uFFFD")) {
        raw = buffer.toString("latin1");
      }
      raw = raw.replace(/^\uFEFF/, "");
    }

    const wb = xlsx.read(raw, { type: "string" });
    rows = xlsx.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: "" });
  } else {
    const wb = xlsx.readFile(filePath, { cellDates: false });
    rows = xlsx.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: "" });
  }


  if (!rows.length) {
    return { inserted: 0, total: 0, file: fileName };
  }

  const firstNorm = normalizeKeys(rows[0]);
  console.log("[debug] Colonnes:", Object.keys(firstNorm));
  console.log("[debug] derniere_maj brut:", firstNorm["Dernière mise à jour"] ?? firstNorm["Derniere mise a jour"] ?? "(non trouvé)");

  const total = rows.length;
  onProgress && onProgress(0, total, `${total.toLocaleString("fr-FR")} tickets trouvés — suppression ancienne table...`);
  await yieldToEventLoop();

  const insert = db.prepare(`
    INSERT INTO tickets
      (numero_ticket, objet, priorite, date_promis_pour, echeance,
       id_externe, code_client, compte, proprietaire, statut, categorie, login_adesi,
       nom, prenom, derniere_maj)
    VALUES
      (@numero_ticket, @objet, @priorite, @date_promis_pour, @echeance,
       @id_externe, @code_client, @compte, @proprietaire, @statut, @categorie, @login_adesi,
       @nom, @prenom, @derniere_maj)
  `);

  db.prepare("DELETE FROM tickets").run();

  const insertBatch = db.transaction((batch) => {
    for (const row of batch) insert.run(mapRow(normalizeKeys(row)));
  });

  let inserted = 0;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    insertBatch(batch);
    inserted += batch.length;
    onProgress && onProgress(inserted, total, `Insertion : ${inserted.toLocaleString("fr-FR")} / ${total.toLocaleString("fr-FR")}`);
    await yieldToEventLoop();
  }

  return { inserted, total, file: fileName };
};

module.exports = { importTickets };

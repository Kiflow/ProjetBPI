const fs = require("fs");
const xlsx = require("xlsx");
const { DATA_DIR } = require("../config/paths");

// ── Colonnes du nouveau format client ───────────────────────────
// Compte         → nom du client   (anciennement nomclient)
// Code client    → code PAC        (anciennement numeropac)
// Cassification BU → BU            (anciennement bu)
// Statut         → filtre "Actif" uniquement
// N° de client / Compte principal → inutilisés
// ────────────────────────────────────────────────────────────────

const normalize = (value) =>
  String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");

const listClientCandidateFiles = () => {
  if (!fs.existsSync(DATA_DIR)) {
    throw new Error(`Data directory not found: ${DATA_DIR}`);
  }

  const files = fs.readdirSync(DATA_DIR);
  const dataFiles = files.filter((file) => /\.(xlsx|xls|csv)$/i.test(file));
  if (!dataFiles.length) {
    throw new Error("No client data files found in the data directory.");
  }

  return dataFiles
    .sort((a, b) => {
      const aHasClient = normalize(a).includes("client") ? 1 : 0;
      const bHasClient = normalize(b).includes("client") ? 1 : 0;
      if (aHasClient !== bHasClient) return bHasClient - aHasClient;
      const aMtime = fs.statSync(`${DATA_DIR}/${a}`).mtimeMs;
      const bMtime = fs.statSync(`${DATA_DIR}/${b}`).mtimeMs;
      return bMtime - aMtime;
    })
    .map((file) => `${DATA_DIR}/${file}`);
};

const detectColumns = (headers) => {
  const cols = {
    pac:    -1,   // Code client      (nouveau) | numeropac (ancien)
    name:   -1,   // Compte           (nouveau) | nomclient (ancien)
    bu:     -1,   // Cassification BU (nouveau) | bu        (ancien)
    statut: -1,   // Statut           (nouveau, filtre Actif)
  };

  headers.forEach((header, i) => {
    const key = normalize(header);

    // Code client / numeropac / pac
    if (cols.pac === -1 && (key.includes("codeclient") || key.includes("numeropac") || key === "pac")) {
      cols.pac = i;
      return;
    }
    // Compte (nom) — éviter "Compte principal" et "N° de client"
    if (cols.name === -1 && (key === "compte" || key.includes("nomclient") || key.includes("raisonsociale"))) {
      cols.name = i;
      return;
    }
    // Cassification BU / bu
    if (cols.bu === -1 && (key.includes("cassification") || key.includes("classification") || key === "bu" || key.includes("businessunit"))) {
      cols.bu = i;
      return;
    }
    // Statut
    if (cols.statut === -1 && key === "statut") {
      cols.statut = i;
    }
  });

  if (cols.pac === -1 || cols.name === -1) {
    throw new Error(
      "Colonnes requises introuvables dans le fichier client. Colonnes attendues : \"Code client\", \"Compte\"."
    );
  }

  return cols;
};

const readClients = () => {
  const files = listClientCandidateFiles();
  let lastError = null;

  for (const filePath of files) {
    try {
      const workbook = xlsx.readFile(filePath, { cellDates: false });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = xlsx.utils.sheet_to_json(firstSheet, { header: 1, defval: "" });

      if (!rows.length) continue;

      const headers = rows[0].map((cell) => String(cell || "").trim());
      const cols = detectColumns(headers);
      const seen = new Set();
      const clients = [];

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i] || [];

        const pac    = String(row[cols.pac]  || "").trim();
        const name   = String(row[cols.name] || "").trim();
        const bu     = cols.bu     >= 0 ? String(row[cols.bu]     || "").trim() : "";
        const statut = cols.statut >= 0 ? String(row[cols.statut] || "").trim() : "";

        if (!pac || !name) continue;

        // Filtrer uniquement les clients actifs si la colonne Statut existe
        if (cols.statut >= 0 && statut.toLowerCase() !== "actif") continue;

        const key = `${pac}::${name}`.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);

        clients.push({ pac, name, bu, statut });
      }

      return clients.sort((a, b) => a.name.localeCompare(b.name, "fr"));
    } catch (error) {
      lastError = error;
    }
  }

  throw new Error(
    lastError?.message ||
      "Aucun fichier client compatible trouvé. Colonnes attendues : \"Code client\", \"Compte\"."
  );
};

module.exports = { readClients };

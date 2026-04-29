const fs   = require("fs");
const path = require("path");
const xlsx = require("xlsx");
const { DATA_DIR } = require("../config/paths");

// Mois de la fiscale Juin→Mai avec le code colonne correspondant dans le fichier
const FISCAL_MONTHS = [
  { key: "jun", label: "Juin", col: "2025/06" },
  { key: "jul", label: "Juil", col: "2025/07" },
  { key: "aug", label: "Août", col: "2025/08" },
  { key: "sep", label: "Sep",  col: "2025/09" },
  { key: "oct", label: "Oct",  col: "2025/10" },
  { key: "nov", label: "Nov",  col: "2025/11" },
  { key: "dec", label: "Déc",  col: "2025/12" },
  { key: "jan", label: "Jan",  col: "2026/01" },
  { key: "feb", label: "Fév",  col: "2026/02" },
  { key: "mar", label: "Mar",  col: "2026/03" },
  { key: "apr", label: "Avr",  col: "2026/04" },
  { key: "may", label: "Mai",  col: "2026/05" },
];

// Normalise un en-tête de cellule → "YYYY/MM" ou chaîne brute
const normalizeHeader = (h) => {
  if (h === null || h === undefined || h === "") return "";
  if (h instanceof Date)
    return `${h.getFullYear()}/${String(h.getMonth() + 1).padStart(2, "0")}`;
  if (typeof h === "number" && h > 1 && h < 100000) {
    const d = new Date(Date.UTC(1899, 11, 30) + h * 86400000);
    return `${d.getUTCFullYear()}/${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  }
  return String(h).trim();
};

// Trouve le fichier Résumé FY dans DATA_DIR
const findFile = () => {
  if (!fs.existsSync(DATA_DIR)) return null;
  const norm = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const match = fs.readdirSync(DATA_DIR).find(
    (f) => norm(f).startsWith("resume fy") && /\.(xlsx|xls)$/i.test(f)
  );
  return match ? path.join(DATA_DIR, match) : null;
};

const readUserFiscalMonths = (loginAdesi) => {
  const filePath = findFile();
  if (!filePath) return null;

  const wb = xlsx.readFile(filePath, { cellDates: true });
  const sheet = wb.Sheets["Experts FY26"];
  if (!sheet) return null;

  // Lire en tableau brut, ligne 0-indexed
  const rows = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: "" });
  if (rows.length < 3) return null;

  // Ligne 1 (index 1) = ligne 2 Excel = en-têtes des mois
  const headers = rows[1].map(normalizeHeader);

  // Colonne D = index 3 (Logon SIEBI)
  const LOGIN_COL = 3;

  // Construire la map clé→index de colonne pour chaque mois fiscal
  const colIndexMap = {};
  FISCAL_MONTHS.forEach((m) => {
    const idx = headers.indexOf(m.col);
    if (idx !== -1) colIndexMap[m.key] = idx;
  });

  // Trouver la ligne de l'utilisateur (à partir de la ligne 2 = index 2)
  const userRow = rows.slice(2).find((row) => {
    const login = String(row[LOGIN_COL] ?? "").trim();
    return login.toLowerCase() === loginAdesi.toLowerCase();
  });

  if (!userRow) return null;

  return FISCAL_MONTHS.map((m) => {
    const idx = colIndexMap[m.key];
    const raw  = idx !== undefined ? userRow[idx] : null;
    const count = (raw !== null && raw !== "" && !Number.isNaN(Number(raw)))
      ? Number(raw)
      : null; // null = mois absent du fichier → affiché vide
    return { key: m.key, label: m.label, count };
  });
};

module.exports = { readUserFiscalMonths };

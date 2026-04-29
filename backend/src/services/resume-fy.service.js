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

// Colonne AJ = index 35 (0-based)
const EXTRACTION_DATE_COL = 35;

const parseDateCell = (raw) => {
  if (!raw && raw !== 0) return null;
  // Date object (cellDates: true)
  if (raw instanceof Date) return raw;
  // Excel serial
  if (typeof raw === "number" && raw > 1 && raw < 100000)
    return new Date(Date.UTC(1899, 11, 30) + raw * 86400000);
  // Chaîne MM/DD/YYYY ou DD/MM/YYYY
  const s = String(raw).trim();
  const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (m) {
    // Format MM/DD/YYYY (US) si premier nombre ≤ 12
    const a = Number(m[1]), b = Number(m[2]), y = Number(m[3]);
    return a <= 12 ? new Date(y, a - 1, b) : new Date(y, b - 1, a);
  }
  return null;
};

const formatDateFR = (d) => {
  if (!d) return "";
  return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`;
};

const readUserFiscalMonths = (loginAdesi) => {
  const filePath = findFile();
  if (!filePath) return null;

  const wb = xlsx.readFile(filePath, { cellDates: true });
  const sheet = wb.Sheets["Experts FY26"];
  if (!sheet) return null;

  const rows = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: "" });
  if (rows.length < 3) return null;

  // Ligne 1 (index 1) = ligne 2 Excel = en-têtes
  const headers = rows[1].map(normalizeHeader);

  // Date d'extraction : cellule AJ2 = rows[1][35]
  const extractionRaw  = rows[1][EXTRACTION_DATE_COL];
  const extractionDate = formatDateFR(parseDateCell(extractionRaw));

  const LOGIN_COL = 3;

  const colIndexMap = {};
  FISCAL_MONTHS.forEach((m) => {
    const idx = headers.indexOf(m.col);
    if (idx !== -1) colIndexMap[m.key] = idx;
  });

  const userRow = rows.slice(2).find((row) => {
    const login = String(row[LOGIN_COL] ?? "").trim();
    return login.toLowerCase() === loginAdesi.toLowerCase();
  });

  if (!userRow) return null;

  const months = FISCAL_MONTHS.map((m) => {
    const idx  = colIndexMap[m.key];
    const raw  = idx !== undefined ? userRow[idx] : null;
    const count = (raw !== null && raw !== "" && !Number.isNaN(Number(raw)))
      ? Number(raw)
      : null;
    return { key: m.key, label: m.label, count };
  });

  return { months, extractionDate };
};

module.exports = { readUserFiscalMonths };

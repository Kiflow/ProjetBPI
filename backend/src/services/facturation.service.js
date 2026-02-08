const xlsx = require("xlsx");
const path = require("path");
const fs = require("fs");

const CATALOGUE_NAME = "catalogue de service interne";

const normalize = (value) => String(value || "").trim().toLowerCase();

const isMarked = (value) => {
  const normalized = normalize(value);
  return normalized === "x" || normalized === "oui" || normalized === "yes";
};

const resolveCataloguePath = () => {
  const dataDir = path.join(__dirname, "../../data");
  console.log("[facturation] Data dir:", dataDir);
  const files = fs.readdirSync(dataDir);
  console.log("[facturation] Fichiers disponibles:", files);
  const match = files.find((file) => {
    const lower = file.toLowerCase();
    return (
      lower.includes(CATALOGUE_NAME) &&
      (lower.endsWith(".xlsx") || lower.endsWith(".xls"))
    );
  });

  if (!match) {
    console.error(
      "[facturation] Aucun fichier catalogue ne correspond au nom attendu."
    );
    throw new Error(
      "Catalogue de service interne introuvable dans backend/data."
    );
  }

  console.log("[facturation] Fichier catalogue selectionne:", match);
  return path.join(dataDir, match);
};

const getLevelFromRow = (row) => {
  if (isMarked(row[3])) return "simple";
  if (isMarked(row[4])) return "classique";
  if (isMarked(row[5])) return "complexe";
  return "";
};

exports.readFacturationCatalogue = () => {
  const filePath = resolveCataloguePath();
  console.log("[facturation] Lecture fichier:", filePath);
  const workbook = xlsx.readFile(filePath, { cellDates: true });
  console.log("[facturation] Feuilles disponibles:", workbook.SheetNames);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(sheet, {
    header: 1,
    defval: "",
    raw: false
  });
  console.log("[facturation] Nombre de lignes lues:", rows.length);
  console.log("[facturation] Apercu lignes 1-6:", rows.slice(0, 6));

  const startRowIndex = 2;
  let lastTheme = "";

  const data = rows.reduce((acc, row, index) => {
    const rawTheme = String(row[1] || "").trim();

    if (rawTheme) {
      lastTheme = rawTheme;
    }

    if (index < startRowIndex) {
      return acc;
    }

    const subTheme = String(row[2] || "").trim();
    const theme = rawTheme || lastTheme;

    if (!theme || !subTheme) return acc;

    const level = getLevelFromRow(row);
    const isPaie = isMarked(row[9]);
    const isGap = isMarked(row[10]);
    const pay = isPaie ? String(row[13] || "").trim() : "";
    const gapDays = isGap ? String(row[14] || "").trim() : "";

    acc.push({
      id: `cat-${index + 3}`,
      theme,
      subTheme,
      level,
      pay,
      gapDays,
      actors: {
        paie: isPaie,
        gap: isGap
      }
    });

    return acc;
  }, []);

  console.log("[facturation] Lignes utiles parsees:", data.length);
  return data;
};

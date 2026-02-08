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
  const dataDir = path.join(__dirname, "../data");
  const files = fs.readdirSync(dataDir);
  const match = files.find((file) => {
    const lower = file.toLowerCase();
    return (
      lower.includes(CATALOGUE_NAME) &&
      (lower.endsWith(".xlsx") || lower.endsWith(".xls"))
    );
  });

  if (!match) {
    throw new Error(
      "Catalogue de service interne introuvable dans backend/data."
    );
  }

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
  const workbook = xlsx.readFile(filePath, { cellDates: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(sheet, {
    header: 1,
    defval: "",
    raw: false
  });

  return rows.slice(2).reduce((acc, row, index) => {
    const theme = String(row[1] || "").trim();
    const subTheme = String(row[2] || "").trim();

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
};

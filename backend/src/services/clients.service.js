const fs = require("fs");
const path = require("path");
const xlsx = require("xlsx");

const DATA_DIR = path.join(__dirname, "..", "..", "data");

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
    throw new Error("No client data files found in backend/data.");
  }

  return dataFiles
    .sort((a, b) => {
      const aHasClient = normalize(a).includes("client") ? 1 : 0;
      const bHasClient = normalize(b).includes("client") ? 1 : 0;
      if (aHasClient !== bHasClient) return bHasClient - aHasClient;
      const aMtime = fs.statSync(path.join(DATA_DIR, a)).mtimeMs;
      const bMtime = fs.statSync(path.join(DATA_DIR, b)).mtimeMs;
      return bMtime - aMtime;
    })
    .map((file) => path.join(DATA_DIR, file));
};

const detectColumns = (headers) => {
  const indexByRole = {
    pac: -1,
    clientName: -1,
    bu: -1
  };

  headers.forEach((header, index) => {
    const key = normalize(header);
    if (indexByRole.pac === -1 && (key.includes("numeropac") || key === "pac" || key.includes("codeclient"))) {
      indexByRole.pac = index;
      return;
    }
    if (
      indexByRole.clientName === -1 &&
      (key.includes("nomclient") || key === "client" || key.includes("raisonsociale"))
    ) {
      indexByRole.clientName = index;
      return;
    }
    if (indexByRole.bu === -1 && (key === "bu" || key.includes("businessunit"))) {
      indexByRole.bu = index;
    }
  });

  if (indexByRole.pac === -1 || indexByRole.clientName === -1) {
    throw new Error(
      "Required columns missing in client Excel. Expected columns like: Numero du PAC, Nom client, BU."
    );
  }

  return indexByRole;
};

const readClients = () => {
  const files = listClientCandidateFiles();
  let lastError = null;

  for (let fileIndex = 0; fileIndex < files.length; fileIndex += 1) {
    const filePath = files[fileIndex];
    try {
      const workbook = xlsx.readFile(filePath, { cellDates: false });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = xlsx.utils.sheet_to_json(firstSheet, { header: 1, defval: "" });

      if (!rows.length) continue;

      const headers = rows[0].map((cell) => String(cell || "").trim());
      const columns = detectColumns(headers);
      const seen = new Set();
      const clients = [];

      for (let i = 1; i < rows.length; i += 1) {
        const row = rows[i] || [];
        const pac = String(row[columns.pac] || "").trim();
        const name = String(row[columns.clientName] || "").trim();
        const bu = columns.bu >= 0 ? String(row[columns.bu] || "").trim() : "";

        if (!pac || !name) continue;
        const key = `${pac}::${name}`.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);

        clients.push({
          pac,
          name,
          bu
        });
      }

      return clients.sort((a, b) => a.name.localeCompare(b.name, "fr"));
    } catch (error) {
      lastError = error;
    }
  }

  throw new Error(
    lastError?.message ||
      "No compatible client Excel found. Expected columns like: Numero du PAC, Nom client, BU."
  );
};

module.exports = {
  readClients
};

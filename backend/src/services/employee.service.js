const fs = require("fs");
const path = require("path");

const DATA_PATH = path.join(__dirname, "..", "..", "data", "employees.csv");

const normalizeHeader = (value) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");

const mapHeader = (header) => {
  const key = normalizeHeader(header);

  if (key.includes("idutilisateur")) return "userId";
  if (key === "nom") return "lastName";
  if (key === "prénom") return "firstName";
  if (key === "email") return "email";
  if (key === "poste") return "position";
  if (key.includes("posteparent")) return "parentPosition";
  if (key.includes("nomduresponsable")) return "managerName";
  if (key === "groupe") return "group";
  if (key.includes("motdepasse")) return "password";

  return null;
};

const parseCsv = (text, delimiter) => {
  const rows = [];
  let row = [];
  let value = "";
  let inQuotes = false;

  const pushValue = () => {
    row.push(value);
    value = "";
  };

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        value += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === delimiter && !inQuotes) {
      pushValue();
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") {
        i += 1;
      }
      pushValue();
      if (row.some((cell) => cell.trim() !== "")) {
        rows.push(row);
      }
      row = [];
      continue;
    }

    value += char;
  }

  if (value.length > 0 || row.length > 0) {
    pushValue();
    if (row.some((cell) => cell.trim() !== "")) {
      rows.push(row);
    }
  }

  return rows;
};

const detectDelimiter = (text) => {
  const firstLine = text.split(/\r?\n/)[0] || "";
  const commaCount = (firstLine.match(/,/g) || []).length;
  const semicolonCount = (firstLine.match(/;/g) || []).length;
  return semicolonCount > commaCount ? ";" : ",";
};

const loadEmployees = () => {
  if (!fs.existsSync(DATA_PATH)) {
    console.warn(`[employees] CSV introuvable: ${DATA_PATH}`);
    return [];
  }

  const buffer = fs.readFileSync(DATA_PATH);
  let raw = buffer.toString("utf8");
  if (raw.includes("�")) {
    raw = buffer.toString("latin1");
  }
  raw = raw.replace(/^\uFEFF/, "");
  if (!raw.trim()) {
    console.warn(`[employees] CSV vide: ${DATA_PATH}`);
    return [];
  }

  const delimiter = detectDelimiter(raw);
  const rows = parseCsv(raw, delimiter);
  if (rows.length === 0) {
    console.warn(`[employees] CSV sans lignes exploitables`);
    return [];
  }

  const headers = rows[0].map(mapHeader);
  console.log("[employees] Headers detectes:", rows[0]);
  console.log("[employees] Mapping:", headers);
  const employees = [];

  for (let i = 1; i < rows.length; i += 1) {
    const row = rows[i];
    const employee = {};

    for (let j = 0; j < headers.length; j += 1) {
      const field = headers[j];
      if (!field) continue;
      employee[field] = (row[j] || "").trim();
    }

    if (employee.userId) {
      employees.push(employee);
    }
  }

  console.log(`[employees] Employes charges: ${employees.length}`);
  return employees;
};

const normalizeValue = (value) => (value || "").trim();

const findByUserId = (userId) => {
  const normalized = normalizeValue(userId);
  const employees = loadEmployees();
  return employees.find(
    (employee) => employee.userId && normalizeValue(employee.userId) === normalized
  );
};

const findByGroup = (groupName) => {
  const normalized = normalizeValue(groupName);
  const employees = loadEmployees();
  return employees.filter(
    (employee) =>
      employee.group && normalizeValue(employee.group) === normalized
  );
};

module.exports = {
  loadEmployees,
  findByUserId,
  findByGroup
};

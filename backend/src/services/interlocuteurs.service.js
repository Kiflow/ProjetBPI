const fs = require("fs");
const xlsx = require("xlsx");
const { INTERLOCUTEURS_PATH } = require("../config/paths");

// Colonnes attendues dans interlocuteurs.csv :
// Nom | Prénom | Intitulé Poste | Compte | Client # | Code Client | Statut

// Décode un buffer en tenant compte des différents encodages courants
const decodeBuffer = (buffer) => {
  // UTF-16 LE (BOM FF FE)
  if (buffer[0] === 0xFF && buffer[1] === 0xFE)
    return buffer.toString("utf16le").replace(/^\uFEFF/, "");
  // UTF-16 BE (BOM FE FF)
  if (buffer[0] === 0xFE && buffer[1] === 0xFF)
    return buffer.swap16().toString("utf16le").replace(/^\uFEFF/, "");
  // UTF-8 avec BOM (EF BB BF)
  if (buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF)
    return buffer.toString("utf8").replace(/^\uFEFF/, "");
  // UTF-8 valide sans BOM
  const utf8 = buffer.toString("utf8");
  if (!utf8.includes("\uFFFD")) return utf8;
  // Fallback : Windows-1252 / latin-1 (CSV DOS)
  return buffer.toString("latin1");
};

const readInterlocuteurs = () => {
  if (!fs.existsSync(INTERLOCUTEURS_PATH)) return [];

  const buffer = fs.readFileSync(INTERLOCUTEURS_PATH);
  const raw = decodeBuffer(buffer);

  const wb = xlsx.read(raw, { type: "string" });
  const rows = xlsx.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: "" });

  return rows
    .map((row) => ({
      nom:            String(row["Nom"]                                                                   ?? "").trim(),
      prenom:         String(row["Prénom"]       ?? row["Prenom"]                                        ?? "").trim(),
      intitule_poste: String(row["Intitulé Poste"] ?? row["Intitulé poste"] ?? row["Intitule Poste"] ?? row["Intitule poste"] ?? "").trim(),
      compte:         String(row["Compte"]                                                                ?? "").trim(),
      client_num:     String(row["Client #"]                                                              ?? "").trim(),
      code_client:    String(row["Code Client"]  ?? row["Code client"]                                   ?? "").trim(),
      statut:         String(row["Statut"]                                                                ?? "").trim(),
    }))
    .filter((r) => r.nom && r.prenom && r.code_client && r.statut.toLowerCase() === "actif");
};

module.exports = { readInterlocuteurs };

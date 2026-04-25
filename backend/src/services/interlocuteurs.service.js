const fs = require("fs");
const xlsx = require("xlsx");
const { INTERLOCUTEURS_PATH } = require("../config/paths");

// Colonnes attendues dans interlocuteurs.csv :
// Nom | Prénom | Intitulé poste | Compte | Client # | Code client | Statut

const normalize = (v) =>
  String(v || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");

const readInterlocuteurs = () => {
  if (!fs.existsSync(INTERLOCUTEURS_PATH)) return [];

  const buffer = fs.readFileSync(INTERLOCUTEURS_PATH);
  let raw;
  if (buffer[0] === 0xFF && buffer[1] === 0xFE) {
    raw = buffer.toString("utf16le").replace(/^\uFEFF/, "");
  } else {
    raw = buffer.toString("utf8").replace(/^\uFEFF/, "");
  }

  const wb = xlsx.read(raw, { type: "string" });
  const rows = xlsx.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: "" });

  return rows
    .map((row) => ({
      nom:           String(row["Nom"]                                         ?? "").trim(),
      prenom:        String(row["Prénom"]  ?? row["Prenom"]                    ?? "").trim(),
      intitule_poste:String(row["Intitulé poste"] ?? row["Intitule poste"]     ?? "").trim(),
      compte:        String(row["Compte"]                                       ?? "").trim(),
      client_num:    String(row["Client #"]                                     ?? "").trim(),
      code_client:   String(row["Code client"]                                  ?? "").trim(),
      statut:        String(row["Statut"]                                       ?? "").trim(),
    }))
    .filter((r) => r.nom && r.prenom && r.code_client && r.statut.toLowerCase() === "actif");
};

module.exports = { readInterlocuteurs };

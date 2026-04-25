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
    return buffer.toString("utf8").slice(3);
  // UTF-8 valide sans BOM
  const utf8 = buffer.toString("utf8");
  if (!utf8.includes("\uFFFD")) return utf8;
  // Fallback : Windows-1252 / latin-1 (CSV DOS)
  return buffer.toString("latin1");
};

const readInterlocuteurs = () => {
  if (!fs.existsSync(INTERLOCUTEURS_PATH)) {
    console.warn("[interlocuteurs] Fichier introuvable :", INTERLOCUTEURS_PATH);
    return [];
  }

  const buffer = fs.readFileSync(INTERLOCUTEURS_PATH);
  const raw = decodeBuffer(buffer);
  console.log("[interlocuteurs] Encodage détecté, premiers 200 chars :", raw.slice(0, 200));

  const wb = xlsx.read(raw, { type: "string" });
  const rows = xlsx.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: "" });
  console.log("[interlocuteurs] Lignes lues :", rows.length);
  if (rows.length > 0) {
    console.log("[interlocuteurs] Colonnes détectées :", Object.keys(rows[0]));
    console.log("[interlocuteurs] Première ligne :", JSON.stringify(rows[0]));
  }

  const mapped = rows.map((row) => ({
    nom:            String(row["Nom"]                                      ?? "").trim(),
    prenom:         String(row["Prénom"]  ?? row["Prenom"]                 ?? "").trim(),
    intitule_poste: String(row["Intitulé poste"] ?? row["Intitule poste"]  ?? "").trim(),
    compte:         String(row["Compte"]                                    ?? "").trim(),
    client_num:     String(row["Client #"]                                  ?? "").trim(),
    code_client:    String(row["Code client"]                               ?? "").trim(),
    statut:         String(row["Statut"]                                    ?? "").trim(),
  }));

  const filtered = mapped.filter((r) => r.nom && r.prenom && r.code_client && r.statut.toLowerCase() === "actif");
  console.log("[interlocuteurs] Après filtre Actif :", filtered.length, "/ total mappé :", mapped.length);
  if (mapped.length > 0 && filtered.length === 0) {
    console.warn("[interlocuteurs] Aucun passé le filtre. Statuts trouvés :", [...new Set(mapped.map(r => `"${r.statut}"`))]);
    console.warn("[interlocuteurs] Code clients trouvés :", [...new Set(mapped.map(r => `"${r.code_client}"`))]);
  }

  return filtered;
};

module.exports = { readInterlocuteurs };

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
    return buffer.toString("utf8").replace(/^\uFEFF/, "");
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
    code_client:    String(row["Code Client"] ?? row["Code client"]          ?? "").trim(),
    statut:         String(row["Statut"]                                    ?? "").trim(),
  }));
  console.log("[interlocuteurs] [1] Total lignes mappées :", mapped.length);

  // Filtre 1 : nom présent
  const avecNom = mapped.filter(r => r.nom);
  console.log("[interlocuteurs] [2] Avec nom non vide :", avecNom.length, "| Sans nom :", mapped.length - avecNom.length);

  // Filtre 2 : prénom présent
  const avecPrenom = avecNom.filter(r => r.prenom);
  console.log("[interlocuteurs] [3] Avec prénom non vide :", avecPrenom.length, "| Sans prénom :", avecNom.length - avecPrenom.length);

  // Filtre 3 : code_client présent
  const avecCode = avecPrenom.filter(r => r.code_client);
  console.log("[interlocuteurs] [4] Avec code_client non vide :", avecCode.length, "| Sans code :", avecPrenom.length - avecCode.length);

  // Filtre 4 : statut Actif
  const actifs = avecCode.filter(r => r.statut.toLowerCase() === "actif");
  console.log("[interlocuteurs] [5] Avec statut Actif :", actifs.length, "| Statuts trouvés :", [...new Set(avecCode.map(r => JSON.stringify(r.statut)))]);

  if (actifs.length === 0 && mapped.length > 0) {
    console.warn("[interlocuteurs] Aucun résultat final. Code clients dans CSV :", [...new Set(mapped.map(r => JSON.stringify(r.code_client)))]);
  }

  return actifs;
};

module.exports = { readInterlocuteurs };

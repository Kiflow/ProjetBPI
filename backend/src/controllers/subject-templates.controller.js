const fs = require("fs");
const { SUJETS_MODELE_PATH } = require("../config/paths");

exports.getTemplates = (req, res) => {
  if (!fs.existsSync(SUJETS_MODELE_PATH)) return res.json([]);
  const lines = fs.readFileSync(SUJETS_MODELE_PATH, "utf8")
    .replace(/^﻿/, "")
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(Boolean);
  const templates = lines.map((name, i) => ({ id: String(i), name, description: "" }));
  res.json(templates);
};

const { readFacturationCatalogue } = require("../services/facturation.service");

exports.getFacturation = (req, res) => {
  try {
    console.log("[facturation] Requete recue:", {
      method: req.method,
      path: req.originalUrl,
      user: req.user || null
    });
    const data = readFacturationCatalogue();
    res.json(data);
  } catch (error) {
    console.error("[facturation] Erreur lecture catalogue:", error);
    res.status(500).json({
      message:
        "Impossible de lire le catalogue de service interne. Verifiez le fichier."
    });
  }
};

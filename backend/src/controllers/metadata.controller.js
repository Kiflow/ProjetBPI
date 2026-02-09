const { fetchTitleForUrl } = require("../services/metadata.service");

exports.getMetadata = async (req, res) => {
  const { url } = req.query;
  if (!url) {
    return res.status(400).json({ message: "URL manquante." });
  }

  if (!/^https?:\/\//i.test(url)) {
    return res.status(400).json({ message: "URL invalide." });
  }

  try {
    const title = await fetchTitleForUrl(url);
    return res.json({ title });
  } catch (error) {
    console.error("[metadata] Erreur recuperation titre:", error);
    return res.status(500).json({ title: "", message: "Erreur serveur." });
  }
};

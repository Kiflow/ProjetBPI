const fs   = require("fs");
const path = require("path");
const multer = require("multer");
const { DATA_DIR } = require("../config/paths");

const MAX_SIZE = 20 * 1024 * 1024; // 20 Mo

const getDocsDir = (userId, groupId) => {
  const dir = path.join(DATA_DIR, "documents", userId, groupId);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      const dir = getDocsDir(req.user.userId, req.params.groupId);
      cb(null, dir);
    } catch (e) { cb(e); }
  },
  filename: (req, file, cb) => {
    // Préserve le nom original, décode UTF-8 si besoin
    const original = Buffer.from(file.originalname, "latin1").toString("utf8");
    // Si un fichier du même nom existe, ajoute un suffixe timestamp
    const dir = getDocsDir(req.user.userId, req.params.groupId);
    const ext  = path.extname(original);
    const base = path.basename(original, ext);
    let name   = original;
    if (fs.existsSync(path.join(dir, name))) {
      name = `${base}_${Date.now()}${ext}`;
    }
    cb(null, name);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_SIZE }
}).single("file");

exports.listDocs = (req, res) => {
  const dir = getDocsDir(req.user.userId, req.params.groupId);
  try {
    const files = fs.readdirSync(dir).map(name => {
      const stat = fs.statSync(path.join(dir, name));
      return { name, size: stat.size, createdAt: stat.birthtime };
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(files);
  } catch { res.json([]); }
};

exports.uploadDoc = (req, res) => {
  upload(req, res, (err) => {
    if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({ message: "Fichier trop volumineux (max 20 Mo)." });
    }
    if (err) return res.status(500).json({ message: "Erreur lors de l'upload." });
    if (!req.file) return res.status(400).json({ message: "Aucun fichier reçu." });
    const stat = fs.statSync(req.file.path);
    res.status(201).json({ name: req.file.filename, size: stat.size, createdAt: stat.birthtime });
  });
};

exports.downloadDoc = (req, res) => {
  const dir  = getDocsDir(req.user.userId, req.params.groupId);
  const file = path.join(dir, req.params.filename);
  if (!fs.existsSync(file)) return res.status(404).json({ message: "Fichier introuvable." });
  res.download(file, req.params.filename);
};

exports.deleteDoc = (req, res) => {
  const dir  = getDocsDir(req.user.userId, req.params.groupId);
  const file = path.join(dir, req.params.filename);
  if (fs.existsSync(file)) fs.unlinkSync(file);
  res.sendStatus(204);
};

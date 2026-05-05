const path = require("path");

const BACKEND_ROOT = path.join(__dirname, "../../");

const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(BACKEND_ROOT, process.env.DATA_DIR)
  : path.join(BACKEND_ROOT, "data");

module.exports = {
  DATA_DIR,
  DB_PATH:               path.join(DATA_DIR, "app.db"),
  TICKETS_PATH:          path.join(DATA_DIR, "tickets.xlsx"),
  EMPLOYEES_PATH:        path.join(DATA_DIR, "employees.csv"),
  INTERLOCUTEURS_PATH:   path.join(DATA_DIR, "interlocuteurs.csv"),
  SUJETS_MODELE_PATH:    path.join(DATA_DIR, "Sujets_modele.csv"),
};

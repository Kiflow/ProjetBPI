const router = require("express").Router();
const auth = require("../middleware/auth.middleware");
const { getTickets, getTicketsFromDb, getRmsTickets, getAttenteStats } = require("../controllers/tickets.controller");

router.get("/", auth, getTickets);
router.get("/db", auth, getTicketsFromDb);
router.get("/rms", auth, getRmsTickets);
router.get("/attente-stats", auth, getAttenteStats);

module.exports = router;

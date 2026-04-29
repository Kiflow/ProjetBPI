const router = require("express").Router();
const auth = require("../middleware/auth.middleware");
const { getTickets, getTicketsFromDb, getRmsTickets, getAttenteStats, getFiscalMonths } = require("../controllers/tickets.controller");

router.get("/", auth, getTickets);
router.get("/db", auth, getTicketsFromDb);
router.get("/rms", auth, getRmsTickets);
router.get("/attente-stats",  auth, getAttenteStats);
router.get("/fiscal-months", auth, getFiscalMonths);

module.exports = router;

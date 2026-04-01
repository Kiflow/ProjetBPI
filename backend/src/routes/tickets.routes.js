const router = require("express").Router();
const auth = require("../middleware/auth.middleware");
const { getTickets, getTicketsFromDb, getRmsTickets } = require("../controllers/tickets.controller");

router.get("/", auth, getTickets);
router.get("/db", auth, getTicketsFromDb);
router.get("/rms", auth, getRmsTickets);

module.exports = router;

const router = require("express").Router();
const auth = require("../middleware/auth.middleware");
const { getTickets } = require("../controllers/tickets.controller");

router.get("/", auth, getTickets);

module.exports = router;

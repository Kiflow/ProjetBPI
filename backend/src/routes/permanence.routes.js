const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth.middleware");
const ctrl = require("../controllers/permanence.controller");

router.use(auth);

router.get("/", ctrl.getEvents);
router.post("/", ctrl.createEvent);
router.patch("/:id/tickets", ctrl.updateTickets);
router.delete("/:id", ctrl.deleteEvent);

module.exports = router;

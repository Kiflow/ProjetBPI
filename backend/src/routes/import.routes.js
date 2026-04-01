const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth.middleware");
const ctrl = require("../controllers/import.controller");

router.post("/tickets", auth, ctrl.importTicketsManual);

module.exports = router;

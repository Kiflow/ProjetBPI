const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth.middleware");
const ctrl = require("../controllers/subject-templates.controller");

router.get("/", auth, ctrl.getTemplates);

module.exports = router;

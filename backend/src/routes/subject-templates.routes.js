const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth.middleware");
const ctrl = require("../controllers/subject-templates.controller");

router.get("/", auth, ctrl.getTemplates);
router.post("/", auth, ctrl.createTemplate);
router.put("/:id", auth, ctrl.updateTemplate);
router.delete("/:id", auth, ctrl.deleteTemplate);

module.exports = router;

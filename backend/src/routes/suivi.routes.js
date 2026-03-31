const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth.middleware");
const ctrl = require("../controllers/suivi.controller");

router.use(auth);

router.get("/", ctrl.getEntries);
router.post("/", ctrl.upsertEntry);
router.post("/:entryId/comments", ctrl.addComment);
router.delete("/:id", ctrl.deleteEntry);

module.exports = router;

const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth.middleware");
const ctrl = require("../controllers/subjects.controller");

router.get("/", auth, ctrl.getSubjects);
router.post("/", auth, ctrl.createSubject);
router.put("/:id", auth, ctrl.updateSubject);
router.delete("/:id", auth, ctrl.deleteSubject);
router.get("/:id/tickets", auth, ctrl.getSubjectTickets);
router.post("/:id/tickets", auth, ctrl.addTicket);
router.delete("/:id/tickets/:linkId", auth, ctrl.removeTicket);

module.exports = router;

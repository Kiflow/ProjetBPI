const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth.middleware");
const ctrl = require("../controllers/todo.controller");

router.use(auth);

router.get("/tasks", ctrl.getTasks);
router.post("/tasks", ctrl.createTask);
router.put("/tasks/:id", ctrl.updateTask);
router.delete("/tasks/:id", ctrl.deleteTask);

router.get("/shortcuts", ctrl.getShortcuts);
router.post("/shortcuts", ctrl.createShortcut);
router.delete("/shortcuts/:id", ctrl.deleteShortcut);

module.exports = router;

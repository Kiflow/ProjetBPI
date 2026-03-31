const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth.middleware");
const ctrl = require("../controllers/wiki.controller");

router.use(auth);

router.get("/groups", ctrl.getGroups);
router.post("/groups", ctrl.createGroup);
router.put("/groups/:id", ctrl.updateGroup);
router.delete("/groups/:id", ctrl.deleteGroup);

router.get("/items", ctrl.getItems);
router.post("/items", ctrl.createItem);
router.put("/items/:id", ctrl.updateItem);
router.delete("/items/:id", ctrl.deleteItem);

router.get("/shortcuts", ctrl.getShortcuts);
router.post("/shortcuts", ctrl.createShortcut);
router.delete("/shortcuts/:id", ctrl.deleteShortcut);

module.exports = router;

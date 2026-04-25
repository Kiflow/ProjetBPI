const express = require("express");
const router  = express.Router();
const auth    = require("../middleware/auth.middleware");
const ctrl    = require("../controllers/habilitation.controller");

router.get("/clients",                          auth, ctrl.getClients);
router.post("/clients",                         auth, ctrl.addClient);
router.delete("/clients/:id",                   auth, ctrl.removeClient);

router.get("/clients/:clientId/interlocuteurs",       auth, ctrl.getInterlocuteurs);
router.post("/clients/:clientId/toggle-chef-de-file", auth, ctrl.toggleChefDeFile);

router.get("/chefs-de-file",                    auth, ctrl.getChefsDeFile);

module.exports = router;

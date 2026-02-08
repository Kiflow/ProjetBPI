const router = require("express").Router();
const auth = require("../middleware/auth.middleware");
const { getFacturation } = require("../controllers/facturation.controller");

router.get("/", auth, getFacturation);

module.exports = router;

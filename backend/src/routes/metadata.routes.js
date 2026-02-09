const router = require("express").Router();
const auth = require("../middleware/auth.middleware");
const { getMetadata } = require("../controllers/metadata.controller");

router.get("/", auth, getMetadata);

module.exports = router;

const router = require("express").Router();
const auth = require("../middleware/auth.middleware");
const { list } = require("../controllers/employee.controller");

router.get("/", auth, list);

module.exports = router;

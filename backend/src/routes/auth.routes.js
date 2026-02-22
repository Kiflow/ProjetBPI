const router = require("express").Router();
const auth = require("../middleware/auth.middleware");
const {
  login,
  me,
  microsoftStart,
  microsoftCallback
} = require("../controllers/auth.controller");

router.post("/login", login);
router.get("/me", auth, me);
router.get("/microsoft/start", microsoftStart);
router.get("/microsoft/callback", microsoftCallback);

module.exports = router;

const jwt = require("jsonwebtoken");

const AUTH_JWT_SECRET = process.env.AUTH_JWT_SECRET || "SECRET_KEY";

module.exports = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) return res.sendStatus(401);

  try {
    const decoded = jwt.verify(token, AUTH_JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.sendStatus(403);
  }
};

const jwt = require("jsonwebtoken");

exports.login = (req, res) => {
  console.log("BODY REÇU :", req.body);
  const { username, password } = req.body;

  if (username === "admin" && password === "admin") {
    const token = jwt.sign(
      { role: "admin" },
      "SECRET_KEY",
      { expiresIn: "8h" }
    );

    return res.json({ token });
  }

  res.status(401).json({ message: "Invalid credentials" });
};

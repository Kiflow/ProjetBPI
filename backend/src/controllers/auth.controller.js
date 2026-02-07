const jwt = require("jsonwebtoken");
const employeeService = require("../services/employee.service");

const buildUserPayload = (employee) => ({
  userId: employee.userId,
  firstName: employee.firstName,
  lastName: employee.lastName,
  email: employee.email,
  position: employee.position,
  parentPosition: employee.parentPosition,
  managerName: employee.managerName,
  group: employee.group,
  role: "user"
});

exports.login = (req, res) => {
  const { username, userId, password } = req.body;
  const loginId = (userId || username || "").trim();

  console.log("[auth] Tentative login:", {
    loginId,
    hasPassword: Boolean(password)
  });

  if (!loginId || !password) {
    console.warn("[auth] Credentials manquants");
    return res.status(400).json({ message: "Missing credentials" });
  }

  const employee = employeeService.findByUserId(loginId);

  if (!employee || employee.password !== password) {
    console.warn("[auth] Identifiants invalides", {
      foundUser: Boolean(employee),
      userId: loginId
    });
    return res.status(401).json({ message: "Invalid credentials" });
  }

  console.log("[auth] Login OK:", loginId);
  const payload = buildUserPayload(employee);
  const token = jwt.sign(payload, "SECRET_KEY", { expiresIn: "8h" });

  return res.json({ token, user: payload });
};

exports.me = (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  return res.json({ user: req.user });
};

const employeeService = require("../services/employee.service");

exports.list = (req, res) => {
  const group = (req.query.group || "").trim();

  if (!group) {
    return res.status(400).json({ message: "Missing group" });
  }

  const employees = employeeService.findByGroup(group);

  const safeEmployees = employees.map((employee) => ({
    userId: employee.userId,
    firstName: employee.firstName,
    lastName: employee.lastName,
    group: employee.group
  }));

  return res.json({ employees: safeEmployees });
};

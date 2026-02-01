const { readTickets } = require("../services/excel.service");

exports.getTickets = (req, res) => {
  const tickets = readTickets();
  res.json(tickets);
};

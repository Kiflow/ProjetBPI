const xlsx = require("xlsx");
const path = require("path");

exports.readTickets = () => {
  const filePath = path.join(__dirname, "../data/tickets.xlsx");
  const workbook = xlsx.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  return xlsx.utils.sheet_to_json(sheet);
};

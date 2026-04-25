const xlsx = require("xlsx");
const { TICKETS_PATH } = require("../config/paths");

exports.readTickets = () => {
  const workbook = xlsx.readFile(TICKETS_PATH);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  return xlsx.utils.sheet_to_json(sheet);
};

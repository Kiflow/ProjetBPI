const { readClients } = require("../services/clients.service");

exports.list = (req, res) => {
  try {
    const clients = readClients();
    return res.json({ clients });
  } catch (error) {
    return res.status(400).json({
      message: error.message || "Failed to read client Excel file."
    });
  }
};

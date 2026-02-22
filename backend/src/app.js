require("dotenv").config();

const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");
const employeeRoutes = require("./routes/employees.routes");
const ticketRoutes = require("./routes/tickets.routes");
const facturationRoutes = require("./routes/facturation.routes");
const metadataRoutes = require("./routes/metadata.routes");
const clientsRoutes = require("./routes/clients.routes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/facturation", facturationRoutes);
app.use("/api/metadata", metadataRoutes);
app.use("/api/clients", clientsRoutes);

app.listen(3001, () => {
  console.log("Backend running on http://localhost:3001");
});

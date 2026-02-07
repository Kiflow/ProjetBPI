const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");
const employeeRoutes = require("./routes/employees.routes");
const ticketRoutes = require("./routes/tickets.routes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/tickets", ticketRoutes);

app.listen(3001, () => {
  console.log("Backend running on http://localhost:3001");
});

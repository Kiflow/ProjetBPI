require("dotenv").config();

const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");
const employeeRoutes = require("./routes/employees.routes");
const ticketRoutes = require("./routes/tickets.routes");
const facturationRoutes = require("./routes/facturation.routes");
const metadataRoutes = require("./routes/metadata.routes");
const clientsRoutes = require("./routes/clients.routes");
const wikiRoutes = require("./routes/wiki.routes");
const todoRoutes = require("./routes/todo.routes");
const permanenceRoutes = require("./routes/permanence.routes");
const suiviRoutes = require("./routes/suivi.routes");
const importRoutes = require("./routes/import.routes");
const subjectsRoutes = require("./routes/subjects.routes");
const subjectTemplatesRoutes = require("./routes/subject-templates.routes");
const cron = require("node-cron");
const { importTickets } = require("./services/tickets-import.service");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/facturation", facturationRoutes);
app.use("/api/metadata", metadataRoutes);
app.use("/api/clients", clientsRoutes);
app.use("/api/wiki", wikiRoutes);
app.use("/api/todo", todoRoutes);
app.use("/api/permanences", permanenceRoutes);
app.use("/api/suivi", suiviRoutes);
app.use("/api/import", importRoutes);
app.use("/api/subjects", subjectsRoutes);
app.use("/api/subject-templates", subjectTemplatesRoutes);

// Import automatique tous les jours à 6h00
cron.schedule("0 6 * * *", () => {
  console.log("[cron] Import tickets automatique...");
  try {
    importTickets();
  } catch (err) {
    console.error("[cron] Erreur import tickets:", err.message);
  }
});

app.listen(3001, () => {
  console.log("Backend running on http://localhost:3001");
});

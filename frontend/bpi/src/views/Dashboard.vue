<template>
  <div class="dashboard">

    <!-- ── Import card ──────────────────────────────────────────── -->
    <div class="import-card">
      <div class="import-card-header">
        <div class="import-card-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 12V4m0 8l-3-3m3 3l3-3" />
          </svg>
        </div>
        <div class="import-card-info">
          <p class="import-card-title">Synchronisation des tickets</p>
          <p class="import-card-path">
            <span class="path-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
              </svg>
            </span>
            backend/data/tickets.csv — .xlsx
          </p>
        </div>
        <button
          type="button"
          class="import-btn"
          :disabled="importing"
          @click="importFromServer"
        >
          <svg v-if="!importing" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 12V4m0 8l-3-3m3 3l3-3" />
          </svg>
          <svg v-else class="spin" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M4 4v5h5M20 20v-5h-5M4 9a9 9 0 0114.4-5.4M20 15a9 9 0 01-14.4 5.4" />
          </svg>
          <span>{{ importing ? "Import en cours…" : "Importer" }}</span>
        </button>
      </div>

      <div v-if="importing || importDone" class="import-progress">
        <div class="progress-meta">
          <span class="progress-msg">{{ importStatusMsg }}</span>
          <span class="progress-pct" :class="{ done: importDone && !importError, error: !!importError }">
            {{ importPct }}%
          </span>
        </div>
        <div class="progress-track">
          <div
            class="progress-bar"
            :class="{ done: importDone && !importError, error: !!importError }"
            :style="{ width: importPct + '%' }"
          />
        </div>
        <p v-if="importDone && !importError" class="import-success">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd" />
          </svg>
          {{ importTotal.toLocaleString("fr-FR") }} tickets importés depuis <strong>{{ importFile }}</strong>
        </p>
        <p v-if="importError" class="import-error">{{ importError }}</p>
      </div>
    </div>

    <!-- ── Backlog ───────────────────────────────────────────────── -->
    <div class="backlog-section">
      <div class="section-header">
        <h2 class="section-title">Backlog tickets</h2>
        <div class="toolbar-right">
          <span class="total-badge">{{ total.toLocaleString("fr-FR") }} tickets</span>
<label class="filter-label" for="sortKey">Trier par</label>
          <select id="sortKey" v-model="sortKey" class="filter-select">
            <option value="Priorite">Priorité</option>
            <option value="DatePromisPour">Date promis pour</option>
            <option value="Echeance">Échéance</option>
          </select>
          <label class="filter-label" for="pageSize">Afficher</label>
          <select id="pageSize" v-model="pageSize" class="filter-select" @change="currentPage = 1">
            <option :value="10">10</option>
            <option :value="20">20</option>
            <option :value="50">50</option>
          </select>
          <span class="filter-label">par page</span>
        </div>
      </div>

      <div class="legend">
        <span class="marker marker-rms"></span>
        <span class="legend-text">Ticket RMS (détecté dans ID externe)</span>
      </div>

      <div v-if="loadingTickets" class="loading">Chargement…</div>

      <p v-else-if="!tickets.length" class="empty">
        Aucun ticket. Importez d'abord un fichier depuis le chemin ci-dessus.
      </p>

      <template v-else>
        <table class="tickets-table">
          <thead>
            <tr>
              <th>Numéro ticket</th>
              <th class="col-pac">PAC</th>
              <th class="col-client">Client</th>
              <th>Objet</th>
              <th>Priorité</th>
              <th>Date promis pour</th>
              <th>Échéance</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(ticket, index) in tickets" :key="ticket.NumeroTicket || index">
              <td>
                <div class="ticket-id">
                  <span v-if="hasRms(ticket)" class="marker marker-rms" aria-hidden="true"></span>
                  <span>{{ ticket.NumeroTicket }}</span>
                </div>
              </td>
              <td class="col-pac">{{ ticket.CodeClient }}</td>
              <td class="col-client" :title="ticket.Compte">{{ ticket.Compte }}</td>
              <td>{{ ticket.Objet }}</td>
              <td>{{ ticket.Priorite }}</td>
              <td>{{ formatDate(ticket.DatePromisPour) }}</td>
              <td>{{ formatDate(ticket.Echeance) }}</td>
            </tr>
          </tbody>
        </table>

        <div class="pagination">
          <button class="page-btn" :disabled="currentPage === 1" @click="currentPage = 1">«</button>
          <button class="page-btn" :disabled="currentPage === 1" @click="currentPage--">‹</button>
          <button
            v-for="page in visiblePages"
            :key="page"
            class="page-btn"
            :class="{ active: page === currentPage }"
            @click="currentPage = page"
          >{{ page }}</button>
          <button class="page-btn" :disabled="currentPage === totalPages" @click="currentPage++">›</button>
          <button class="page-btn" :disabled="currentPage === totalPages" @click="currentPage = totalPages">»</button>
          <span class="page-info">Page {{ currentPage }} / {{ totalPages }}</span>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import api from "../services/api";

// ── Import ──────────────────────────────────────────────────────
const importing = ref(false);
const importPct = ref(0);
const importStatusMsg = ref("");
const importDone = ref(false);
const importError = ref("");
const importTotal = ref(0);
const importFile = ref("");

const importFromServer = async () => {
  importing.value = true;
  importDone.value = false;
  importError.value = "";
  importPct.value = 0;
  importStatusMsg.value = "Lecture du fichier…";
  importTotal.value = 0;
  importFile.value = "";

  try {
    const token = localStorage.getItem("token");
    const response = await fetch("http://localhost:3001/api/import/tickets", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!response.ok) throw new Error(`Erreur serveur (${response.status})`);

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop();

      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        try {
          const event = JSON.parse(line.slice(5).trim());
          if (event.error) {
            importError.value = event.error;
            importing.value = false;
            importDone.value = true;
            return;
          }
          importPct.value = event.pct ?? importPct.value;
          importStatusMsg.value = event.message ?? importStatusMsg.value;
          if (event.done) {
            importTotal.value = event.total;
            importFile.value = event.file;
            importDone.value = true;
            importing.value = false;
            setTimeout(() => fetchPage(), 1500);
          }
        } catch { /* ligne SSE non-JSON */ }
      }
    }
  } catch (err) {
    importError.value = err.message || "Erreur lors de l'import.";
    importing.value = false;
    importDone.value = true;
  }
};

// ── Backlog ─────────────────────────────────────────────────────
const tickets = ref([]);
const total = ref(0);
const sortKey = ref("Priorite");
const pageSize = ref(20);
const currentPage = ref(1);
const loadingTickets = ref(false);

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)));

const fetchPage = async () => {
  loadingTickets.value = true;
  try {
    const res = await api.get("/tickets/db", {
      params: { page: currentPage.value, limit: pageSize.value, sort: sortKey.value, mine: true }
    });
    tickets.value = res.data.tickets;
    total.value = res.data.total;
  } catch {
    tickets.value = [];
    total.value = 0;
  } finally {
    loadingTickets.value = false;
  }
};

onMounted(fetchPage);
watch(currentPage, fetchPage);
watch([pageSize, sortKey], () => { currentPage.value = 1; fetchPage(); });

const parseDate = (value) => {
  if (!value) return null;
  const raw = String(value).trim();
  const cleaned = raw.replace(/[^0-9,.-]/g, "");
  const numeric = Number(cleaned.replace(",", "."));
  if (!Number.isNaN(numeric) && numeric >= 1) {
    const d = new Date(Date.UTC(1899, 11, 30) + numeric * 86400000);
    if (!Number.isNaN(d.getTime())) return d;
  }
  const m = raw.match(/(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4})/);
  if (m) {
    const d = new Date(Number(m[3].length === 2 ? `20${m[3]}` : m[3]), Number(m[2]) - 1, Number(m[1]));
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const iso = raw.match(/(\d{4})[\/.\-](\d{1,2})[\/.\-](\d{1,2})/);
  if (iso) {
    const d = new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
};

const formatDate = (value) => {
  const d = parseDate(value);
  if (!d) return value ?? "";
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
};

const hasRms = (ticket) => String(ticket?.IdExterne ?? "").toUpperCase().includes("RMS");

const visiblePages = computed(() => {
  const pages = [];
  for (let i = Math.max(1, currentPage.value - 2); i <= Math.min(totalPages.value, currentPage.value + 2); i++) {
    pages.push(i);
  }
  return pages;
});
</script>

<style scoped>
.dashboard {
  padding: 28px;
  background: #ffffff;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* ── Import card ─────────────────────────────────────────────── */
.import-card {
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.07);
  padding: 20px 24px;
  border: 1px solid #e2e8f0;
}

.import-card-header {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.import-card-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: #1a3a5c;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.import-card-icon svg {
  width: 22px;
  height: 22px;
  stroke: #ffffff;
}

.import-card-info {
  flex: 1;
  min-width: 0;
}

.import-card-title {
  font-size: 15px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 4px;
}

.import-card-path {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #64748b;
  font-family: monospace;
  margin: 0;
  background: #f1f5f9;
  padding: 3px 10px;
  border-radius: 6px;
  width: fit-content;
}

.path-icon svg {
  width: 14px;
  height: 14px;
  stroke: #94a3b8;
  display: block;
}

.import-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: #1a3a5c;
  color: #ffffff;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.2s, transform 0.15s;
  box-shadow: 0 4px 12px rgba(26, 58, 92, 0.25);
}

.import-btn svg {
  width: 18px;
  height: 18px;
  stroke: #ffffff;
  flex-shrink: 0;
}

.import-btn:hover:not(:disabled) {
  background: #2e5f8a;
  transform: translateY(-1px);
}

.import-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.spin {
  animation: spin 1s linear infinite;
}

.import-progress {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #f1f5f9;
}

.progress-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.progress-msg {
  font-size: 13px;
  color: #64748b;
}

.progress-pct {
  font-size: 14px;
  font-weight: 700;
  color: #1a3a5c;
}

.progress-pct.done { color: #16a34a; }
.progress-pct.error { color: #dc2626; }

.progress-track {
  height: 8px;
  background: #e2e8f0;
  border-radius: 999px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #1a3a5c, #2e5f8a);
  transition: width 0.3s ease;
  box-shadow: 0 0 8px rgba(26, 58, 92, 0.3);
}

.progress-bar.done {
  background: linear-gradient(90deg, #16a34a, #22c55e);
  box-shadow: 0 0 8px rgba(22, 163, 74, 0.35);
}

.progress-bar.error {
  background: #dc2626;
  box-shadow: none;
}

.import-success {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 10px;
  font-size: 13px;
  color: #16a34a;
}

.import-success svg {
  width: 16px;
  height: 16px;
  fill: #16a34a;
  flex-shrink: 0;
}

.import-error {
  margin-top: 10px;
  font-size: 13px;
  color: #dc2626;
}

/* ── Backlog section ─────────────────────────────────────────── */
.backlog-section {
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.07);
  padding: 20px 24px;
  border: 1px solid #e2e8f0;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 12px;
}

.section-title {
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.total-badge {
  font-size: 13px;
  color: #64748b;
  background: #f1f5f9;
  padding: 4px 10px;
  border-radius: 99px;
}

.filter-label {
  font-weight: 600;
  color: #243b53;
  font-size: 13px;
}

.filter-select {
  padding: 6px 10px;
  border: 1px solid #cbd5e0;
  border-radius: 6px;
  background: #ffffff;
  font-size: 13px;
}

.legend {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-size: 13px;
  color: #64748b;
}

.legend-text { font-size: 13px; }

.marker {
  width: 8px;
  height: 18px;
  border-radius: 2px;
  display: inline-block;
  flex-shrink: 0;
}

.marker-rms { background: #d14343; }

.ticket-id {
  display: flex;
  align-items: center;
  gap: 8px;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #94a3b8;
  font-size: 14px;
}

.empty {
  color: #94a3b8;
  font-size: 14px;
  padding: 20px 0;
}

.tickets-table {
  width: 100%;
  border-collapse: collapse;
  background: #ffffff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.05);
  border: 1px solid #e2e8f0;
}

.tickets-table th,
.tickets-table td {
  border-bottom: 1px solid #e2e8f0;
  border-right: 1px solid #e2e8f0;
  padding: 8px 12px;
  text-align: left;
  vertical-align: middle;
}

.tickets-table th:last-child,
.tickets-table td:last-child { border-right: none; }

.tickets-table thead {
  background: linear-gradient(90deg, #eef2ff 0%, #f8fafc 100%);
}

.tickets-table th {
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-size: 11px;
  font-weight: 700;
  color: #334155;
  padding: 12px;
}

.tickets-table tbody tr {
  transition: background-color 0.15s ease;
}

.tickets-table tbody tr:nth-child(even) { background: #f8fafc; }
.tickets-table tbody tr:hover { background: #eef2ff; }

.tickets-table tbody td {
  color: #0f172a;
  font-size: 13px;
  line-height: 1.3;
}

.col-pac {
  width: 120px;
  white-space: nowrap;
}

.col-client {
  max-width: 200px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-top: 20px;
  flex-wrap: wrap;
}

.page-btn {
  min-width: 34px;
  height: 34px;
  padding: 0 10px;
  border: 1px solid #cbd5e0;
  border-radius: 6px;
  background: #ffffff;
  color: #334155;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
}

.page-btn:hover:not(:disabled) {
  background: #dce8f5;
  border-color: #1a3a5c;
  color: #1a3a5c;
}

.page-btn.active {
  background: #1a3a5c;
  border-color: #1a3a5c;
  color: #ffffff;
  font-weight: 700;
}

.page-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.page-info {
  font-size: 13px;
  color: #64748b;
  margin-left: 8px;
}
</style>

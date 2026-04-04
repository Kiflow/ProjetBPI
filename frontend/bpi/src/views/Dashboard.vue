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
            <option value="default">Par défaut</option>
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

      <div v-if="loadingTickets" class="loading">Chargement…</div>

      <p v-else-if="!tickets.length" class="empty">
        Aucun ticket. Importez d'abord un fichier depuis le chemin ci-dessus.
      </p>

      <template v-else>
        <div class="table-wrapper">
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
          <tbody v-for="group in groupedTickets" :key="group.key">
            <tr class="group-header-row">
              <td colspan="7">
                <div class="group-header">
                  <span class="group-line"></span>
                  <span class="group-label">
                    <svg v-if="group.key === 'critique'" class="group-icon" style="color:#dc2626" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd"/></svg>
                    <svg v-else-if="group.key === 'plan'" class="group-icon" style="color:#7c3aed" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 7l2.55 2.4A1 1 0 0116 11H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z" clip-rule="evenodd"/></svg>
                    <svg v-else-if="group.key === 'sensible'" class="group-icon" style="color:#d97706" viewBox="0 0 20 20" fill="currentColor"><path d="M10 1a6 6 0 00-3.815 10.631C7.237 12.5 8 13.443 8 14.456v.544a1 1 0 001 1h2a1 1 0 001-1v-.544c0-1.013.762-1.957 1.815-2.825A6 6 0 0010 1zM8.863 17.414a1 1 0 00-.186 1.986l.022.004a8.998 8.998 0 002.604 0l.022-.004a1 1 0 00-.186-1.986 7.002 7.002 0 01-2.276 0z"/></svg>
                    <svg v-else class="group-icon" style="color:#64748b" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3.293 1.293a1 1 0 011.414 0L10 9.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>
                    {{ group.label || 'Autres tickets' }}
                    <span class="group-count">{{ group.tickets.length }}</span>
                  </span>
                  <span class="group-line"></span>
                </div>
              </td>
            </tr>
            <tr v-for="(ticket, index) in group.tickets" :key="ticket.NumeroTicket || index">
              <td>
                <div class="ticket-id">
                  <span v-if="hasRms(ticket)" class="rms-tag">RMS</span>
                  <span class="ticket-num">{{ ticket.NumeroTicket }}</span>
                </div>
              </td>
              <td class="col-pac">{{ ticket.CodeClient }}</td>
              <td class="col-client" :title="ticket.Compte">{{ ticket.Compte }}</td>
              <td class="col-objet" :title="ticket.Objet">{{ ticket.Objet }}</td>
              <td class="col-priorite">{{ ticket.Priorite }}</td>
              <td class="col-date">{{ formatDate(ticket.DatePromisPour) }}</td>
              <td class="col-date">{{ formatDate(ticket.Echeance) }}</td>
            </tr>
          </tbody>
        </table>
        </div>

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
const sortKey = ref("default");
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

const CRITIQUE_KEYWORDS = ["critique", "critical", "urgent", "urgente", "p1"];
const isCritique = (ticket) => CRITIQUE_KEYWORDS.includes(String(ticket?.Priorite ?? "").toLowerCase().trim());

const groupedTickets = computed(() => {
  const critique = tickets.value.filter(t => isCritique(t));
  const plan     = tickets.value.filter(t => !isCritique(t) && t.IsPlan);
  const sensible = tickets.value.filter(t => !isCritique(t) && !t.IsPlan && t.IsSensible);
  const others   = tickets.value.filter(t => !isCritique(t) && !t.IsPlan && !t.IsSensible);

  const groups = [];
  if (critique.length) groups.push({ key: "critique", label: "Critique",        tickets: critique });
  if (plan.length)     groups.push({ key: "plan",     label: "Plan d'action",   tickets: plan });
  if (sensible.length) groups.push({ key: "sensible", label: "Client sensible", tickets: sensible });
  if (others.length)   groups.push({ key: "others",   label: null,              tickets: others });
  return groups;
});

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
  padding: 0;
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

.ticket-id {
  display: flex;
  align-items: center;
  gap: 6px;
}

.rms-tag {
  font-size: 10px;
  font-weight: 700;
  color: #d14343;
  letter-spacing: 0.4px;
  flex-shrink: 0;
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
}

.tickets-table th,
.tickets-table td {
  border-bottom: 1px solid #f1f5f9;
  border-right: 1px solid #f1f5f9;
  padding: 6px 14px;
  text-align: left;
  vertical-align: middle;
}

.tickets-table th:last-child,
.tickets-table td:last-child {
  border-right: none;
}

.tickets-table thead th {
  border-bottom: 2px solid #e2e8f0;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  color: #94a3b8;
  padding: 6px 14px;
  background: #ffffff;
  white-space: nowrap;
}

.tickets-table tbody tr {
  transition: background 0.12s ease;
}

.tickets-table tbody tr:not(.group-header-row):hover { background: #f8fafc; }

.tickets-table tbody tr:last-child td {
  border-bottom: none;
}

.group-header-row td {
  padding: 16px 0 6px !important;
  border: none !important;
  background: transparent !important;
}

.group-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.group-line {
  flex: 1;
  height: 1px;
  background: #e2e8f0;
}

.group-line:first-child {
  display: none;
}

.group-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  color: #64748b;
  white-space: nowrap;
}

.group-icon {
  width: 13px;
  height: 13px;
  color: #64748b;
  flex-shrink: 0;
}

.group-count {
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 99px;
  padding: 1px 7px;
  font-size: 11px;
  font-weight: 600;
  color: #64748b;
}

.tickets-table tbody td {
  color: #1e293b;
  font-size: 13px;
  line-height: 1.4;
}

.ticket-num {
  font-weight: 600;
  font-size: 13px;
  color: #0f172a;
  font-variant-numeric: tabular-nums;
}

.col-pac {
  width: 110px;
  white-space: nowrap;
  color: #64748b;
  font-size: 12px;
}

.col-client {
  max-width: 180px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.col-objet {
  max-width: 260px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #334155;
}

.col-priorite {
  white-space: nowrap;
  color: #64748b;
  font-size: 12px;
}

.col-date {
  white-space: nowrap;
  color: #64748b;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
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

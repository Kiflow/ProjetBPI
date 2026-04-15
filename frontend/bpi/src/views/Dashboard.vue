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
        <button type="button" class="import-btn" :disabled="importing" @click="importFromServer">
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
          <div class="progress-bar" :class="{ done: importDone && !importError, error: !!importError }"
            :style="{ width: importPct + '%' }" />
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

    <!-- ── Stats row ─────────────────────────────────────────────── -->
    <div class="stats-row">
      <div class="stat-card">
        <p class="stat-label">Total tickets actifs</p>
        <p class="stat-value">{{ total.toLocaleString("fr-FR") || "1 284" }}</p>
      </div>
      <div class="stat-card stat-card--critical">
        <p class="stat-label">Priorité critique</p>
        <p class="stat-value">42</p>
        <p class="stat-sub">
          <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 3l4 6H4l4-6z"/></svg>
          +12% vs hier
        </p>
      </div>
      <div class="stat-card">
        <p class="stat-label">Tickets fermés ce mois</p>
        <p class="stat-value">89</p>
        <p class="stat-sub muted">Tickets fermés fiscal : 324</p>
      </div>
      <div class="stat-card">
        <p class="stat-label">Attente retour client +2 mois</p>
        <p class="stat-value">14</p>
        <p class="stat-sub muted">Attente retour client total : 57</p>
      </div>
    </div>

    <div v-if="loadingTickets" class="loading">Chargement…</div>

    <template v-else-if="tickets.length">

      <!-- ── Tickets Critiques ──────────────────────────────────── -->
      <div v-if="critiqueTickets.length" class="section-card">
        <div class="section-header critique-header">
          <div class="section-header-left">
            <svg class="section-icon" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd"/>
            </svg>
            <span class="section-title">Tickets Critiques</span>
            <span class="badge-urgent">URGENT</span>
          </div>
          <span class="section-count">{{ critiqueTickets.length }}</span>
        </div>
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Référence</th>
                <th>PAC</th>
                <th>Client</th>
                <th>Objet</th>
                <th>Priorité</th>
                <th>Date promis pour</th>
                <th>Date prochain traitement</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(ticket, i) in critiqueTickets" :key="ticket.NumeroTicket || i">
                <td>
                  <span class="ref-link">
                    <span v-if="hasRms(ticket)" class="rms-tag">RMS</span>
                    {{ ticket.NumeroTicket }}
                  </span>
                </td>
                <td class="muted-cell">{{ ticket.CodeClient }}</td>
                <td class="client-cell" :title="ticket.Compte">{{ ticket.Compte }}</td>
                <td class="objet-cell" :title="ticket.Objet">{{ ticket.Objet }}</td>
                <td><span class="badge-critique">CRITIQUE</span></td>
                <td class="date-cell urgent-date">{{ formatDate(ticket.DatePromisPour) }}</td>
                <td class="date-cell">{{ formatDate(ticket.Echeance) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ── Plans d'Action ────────────────────────────────────── -->
      <div v-if="planTickets.length" class="section-card">
        <div class="section-header plan-header">
          <div class="section-header-left">
            <svg class="section-icon" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 7l2.55 2.4A1 1 0 0116 11H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z" clip-rule="evenodd"/>
            </svg>
            <span class="section-title">Plans d'Action</span>
            <span class="section-count">{{ planTickets.length }}</span>
          </div>
          <button class="link-btn">Voir tout →</button>
        </div>
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Référence</th>
                <th>PAC</th>
                <th>Client</th>
                <th>Objet</th>
                <th>Priorité</th>
                <th>Date promis pour</th>
                <th>Date prochain traitement</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(ticket, i) in planTickets" :key="ticket.NumeroTicket || i">
                <td><span class="ref-link plan-ref">{{ ticket.NumeroTicket }}</span></td>
                <td class="muted-cell">{{ ticket.CodeClient }}</td>
                <td class="client-cell" :title="ticket.Compte">{{ ticket.Compte }}</td>
                <td class="objet-cell" :title="ticket.Objet">{{ ticket.Objet }}</td>
                <td><span class="badge-plan">{{ ticket.Priorite }}</span></td>
                <td class="date-cell">{{ formatDate(ticket.DatePromisPour) }}</td>
                <td class="date-cell deadline-cell">{{ formatDate(ticket.Echeance) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ── Clients Sensibles ─────────────────────────────────── -->
      <div v-if="sensibleTickets.length" class="section-card">
        <div class="section-header sensible-header">
          <div class="section-header-left">
            <svg class="section-icon" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 1a6 6 0 00-3.815 10.631C7.237 12.5 8 13.443 8 14.456v.544a1 1 0 001 1h2a1 1 0 001-1v-.544c0-1.013.762-1.957 1.815-2.825A6 6 0 0010 1zM8.863 17.414a1 1 0 00-.186 1.986l.022.004a8.998 8.998 0 002.604 0l.022-.004a1 1 0 00-.186-1.986 7.002 7.002 0 01-2.276 0z"/>
            </svg>
            <span class="section-title">Clients Sensibles</span>
            <span class="section-count">{{ sensibleTickets.length }}</span>
          </div>
          <button class="link-btn vip-btn">Portail VIP →</button>
        </div>
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Référence</th>
                <th>PAC</th>
                <th>Client</th>
                <th>Objet</th>
                <th>Priorité</th>
                <th>Date promis pour</th>
                <th>Date prochain traitement</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(ticket, i) in sensibleTickets" :key="ticket.NumeroTicket || i">
                <td><span class="ref-link sensible-ref">{{ ticket.NumeroTicket }}</span></td>
                <td class="muted-cell">{{ ticket.CodeClient }}</td>
                <td class="client-cell" :title="ticket.Compte">{{ ticket.Compte }}</td>
                <td class="objet-cell" :title="ticket.Objet">{{ ticket.Objet }}</td>
                <td><span class="badge-sensible">{{ ticket.Priorite || "Normal" }}</span></td>
                <td class="date-cell">{{ formatDate(ticket.DatePromisPour) }}</td>
                <td class="date-cell">{{ formatDate(ticket.Echeance) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ── Autres Tickets ────────────────────────────────────── -->
      <div class="section-card">
        <div class="section-header others-header">
          <div class="section-header-left">
            <svg class="section-icon" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3.293 1.293a1 1 0 011.414 0L10 9.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"/>
            </svg>
            <span class="section-title">Autres Tickets</span>
          </div>
          <div class="header-actions">
            <div class="toolbar-controls">
              <label class="filter-label" for="sortKey">Trier</label>
              <select id="sortKey" v-model="sortKey" class="filter-select">
                <option value="default">Par défaut</option>
                <option value="Priorite">Priorité</option>
                <option value="DatePromisPour">Date promis pour</option>
                <option value="Echeance">Échéance</option>
              </select>
              <select id="pageSize" v-model="pageSize" class="filter-select" @change="currentPage = 1">
                <option :value="10">10</option>
                <option :value="20">20</option>
                <option :value="50">50</option>
              </select>
            </div>
          </div>
        </div>

        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Référence</th>
                <th>PAC</th>
                <th>Client</th>
                <th>Objet</th>
                <th>Priorité</th>
                <th>Date promis pour</th>
                <th>Date prochain traitement</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(ticket, i) in otherTickets" :key="ticket.NumeroTicket || i">
                <td>
                  <span class="ref-link">
                    <span v-if="hasRms(ticket)" class="rms-tag">RMS</span>
                    {{ ticket.NumeroTicket }}
                  </span>
                </td>
                <td class="muted-cell">{{ ticket.CodeClient }}</td>
                <td class="client-cell" :title="ticket.Compte">{{ ticket.Compte }}</td>
                <td class="objet-cell" :title="ticket.Objet">{{ ticket.Objet }}</td>
                <td class="muted-cell">{{ ticket.Priorite }}</td>
                <td class="date-cell">{{ formatDate(ticket.DatePromisPour) }}</td>
                <td class="date-cell">{{ formatDate(ticket.Echeance) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="table-footer">
          <span class="table-footer-count">
            Affichage de {{ otherTickets.length }} sur {{ total.toLocaleString("fr-FR") }} tickets réguliers
          </span>
          <div class="pagination">
            <button class="page-btn" :disabled="currentPage === 1" @click="currentPage = 1">«</button>
            <button class="page-btn" :disabled="currentPage === 1" @click="currentPage--">‹</button>
            <button v-for="page in visiblePages" :key="page" class="page-btn"
              :class="{ active: page === currentPage }" @click="currentPage = page">
              {{ page }}
            </button>
            <button class="page-btn" :disabled="currentPage === totalPages" @click="currentPage++">›</button>
            <button class="page-btn" :disabled="currentPage === totalPages" @click="currentPage = totalPages">»</button>
            <span class="page-info">Page {{ currentPage }} / {{ totalPages }}</span>
          </div>
        </div>
      </div>

    </template>

    <p v-else-if="!loadingTickets" class="empty">
      Aucun ticket. Importez d'abord un fichier depuis le chemin ci-dessus.
    </p>

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
const isCritique = (t) => CRITIQUE_KEYWORDS.includes(String(t?.Priorite ?? "").toLowerCase().trim());

const critiqueTickets = computed(() => tickets.value.filter(t => isCritique(t)));
const planTickets     = computed(() => tickets.value.filter(t => !isCritique(t) && t.IsPlan));
const sensibleTickets = computed(() => tickets.value.filter(t => !isCritique(t) && !t.IsPlan && t.IsSensible));
const otherTickets    = computed(() => tickets.value.filter(t => !isCritique(t) && !t.IsPlan && !t.IsSensible));

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
  margin: -24px;
  padding: 24px;
  min-height: calc(100% + 48px);
  background: #f1f5f9;
  display: flex;
  flex-direction: column;
  gap: 20px;
  font-family: Inter, sans-serif;
}

/* ── Import card ─────────────────────────────────────────────── */
.import-card {
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 1px 4px rgba(15, 23, 42, 0.07);
  padding: 18px 22px;
  border: 1px solid #e2e8f0;
}

.import-card-header {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.import-card-icon {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  background: #1a3a5c;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.import-card-icon svg { width: 20px; height: 20px; stroke: #fff; }

.import-card-info { flex: 1; min-width: 0; }
.import-card-title { font-size: 14px; font-weight: 700; color: #0f172a; margin: 0 0 3px; }
.import-card-path {
  display: flex; align-items: center; gap: 5px;
  font-size: 12px; color: #64748b; font-family: monospace; margin: 0;
  background: #f1f5f9; padding: 2px 8px; border-radius: 5px; width: fit-content;
}
.path-icon svg { width: 13px; height: 13px; stroke: #94a3b8; display: block; }

.import-btn {
  display: inline-flex; align-items: center; gap: 7px;
  padding: 9px 18px; background: #1a3a5c; color: #fff;
  border: none; border-radius: 8px; font-size: 13px; font-weight: 700;
  cursor: pointer; white-space: nowrap;
  transition: background 0.2s, transform 0.15s;
  box-shadow: 0 3px 10px rgba(26, 58, 92, 0.22);
}
.import-btn svg { width: 17px; height: 17px; stroke: #fff; flex-shrink: 0; }
.import-btn:hover:not(:disabled) { background: #2e5f8a; transform: translateY(-1px); }
.import-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

@keyframes spin { to { transform: rotate(360deg); } }
.spin { animation: spin 1s linear infinite; }

.import-progress { margin-top: 16px; padding-top: 14px; border-top: 1px solid #f1f5f9; }
.progress-meta { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
.progress-msg { font-size: 12px; color: #64748b; }
.progress-pct { font-size: 13px; font-weight: 700; color: #1a3a5c; }
.progress-pct.done { color: #16a34a; }
.progress-pct.error { color: #dc2626; }
.progress-track { height: 7px; background: #e2e8f0; border-radius: 999px; overflow: hidden; }
.progress-bar { height: 100%; border-radius: 999px; background: linear-gradient(90deg, #1a3a5c, #2e5f8a); transition: width 0.3s ease; }
.progress-bar.done { background: linear-gradient(90deg, #16a34a, #22c55e); }
.progress-bar.error { background: #dc2626; }
.import-success { display: flex; align-items: center; gap: 5px; margin-top: 8px; font-size: 12px; color: #16a34a; }
.import-success svg { width: 15px; height: 15px; fill: #16a34a; flex-shrink: 0; }
.import-error { margin-top: 8px; font-size: 12px; color: #dc2626; }

/* ── Stats row ───────────────────────────────────────────────── */
.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.stat-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 18px 20px;
  box-shadow: 0 1px 4px rgba(15, 23, 42, 0.06);
}

.stat-card--critical {
  background: #7f1d1d;
  border-color: #991b1b;
  color: #fff;
}

.stat-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #94a3b8;
  margin: 0 0 6px;
}
.stat-card--critical .stat-label { color: rgba(255,255,255,0.65); }

.stat-value {
  font-size: 28px;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 4px;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}
.stat-card--critical .stat-value { color: #fff; }

.stat-sub {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #fca5a5;
  margin: 0;
}
.stat-sub.muted { color: #94a3b8; }
.stat-sub svg { width: 10px; height: 10px; flex-shrink: 0; }

/* ── Section cards ───────────────────────────────────────────── */
.section-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  box-shadow: 0 1px 4px rgba(15, 23, 42, 0.06);
  overflow: hidden;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid #f1f5f9;
}

.section-header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.section-title {
  font-size: 14px;
  font-weight: 700;
  color: #0f172a;
}

.section-count {
  font-size: 11px;
  font-weight: 700;
  background: #f1f5f9;
  color: #64748b;
  border: 1px solid #e2e8f0;
  border-radius: 99px;
  padding: 1px 8px;
}

/* Critique header */
.critique-header { background: #fff7f7; border-bottom-color: #fecaca; }
.critique-header .section-icon { color: #dc2626; }
.critique-header .section-title { color: #991b1b; }

/* Plan header */
.plan-header { background: #fff7ed; border-bottom-color: #fed7aa; }
.plan-header .section-icon { color: #ea580c; }
.plan-header .section-title { color: #9a3412; }

/* Sensible header */
.sensible-header { background: #fffbeb; border-bottom-color: #fde68a; }
.sensible-header .section-icon { color: #d97706; }
.sensible-header .section-title { color: #92400e; }

/* Others header */
.others-header { background: #f8fafc; border-bottom-color: #e2e8f0; }
.others-header .section-icon { color: #64748b; }

/* ── Badges ──────────────────────────────────────────────────── */
.badge-urgent {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #dc2626;
  background: #fee2e2;
  border: 1px solid #fecaca;
  border-radius: 4px;
  padding: 1px 6px;
}

.badge-critique {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #fff;
  background: #dc2626;
  border-radius: 4px;
  padding: 2px 7px;
}

.badge-plan {
  font-size: 11px;
  font-weight: 600;
  color: #9a3412;
  background: #ffedd5;
  border-radius: 4px;
  padding: 2px 7px;
}

.badge-sensible {
  font-size: 11px;
  font-weight: 600;
  color: #92400e;
  background: #fef3c7;
  border-radius: 4px;
  padding: 2px 7px;
}

/* ── Table ───────────────────────────────────────────────────── */
.table-wrapper {
  overflow-x: auto;
}

.table-wrapper::-webkit-scrollbar {
  height: 5px;
}
.table-wrapper::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 99px;
}
.table-wrapper::-webkit-scrollbar-thumb {
  background: #cbd5e0;
  border-radius: 99px;
}
.table-wrapper::-webkit-scrollbar-thumb:hover {
  background: #1a3a5c;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

.data-table thead th {
  padding: 8px 14px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: #94a3b8;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  text-align: left;
  white-space: nowrap;
}

/* Largeurs proportionnelles identiques pour tous les tableaux */
.data-table thead th:nth-child(1) { width: 14%; min-width: 150px; }  /* Référence */
.data-table thead th:nth-child(2) { width: 9%;  min-width:  90px; }  /* PAC */
.data-table thead th:nth-child(3) { width: 14%; min-width: 140px; }  /* Client */
.data-table thead th:nth-child(4) { width: 25%; min-width: 180px; }  /* Objet */
.data-table thead th:nth-child(5) { width: 10%; min-width: 100px; }  /* Priorité */
.data-table thead th:nth-child(6) { width: 14%; min-width: 130px; }  /* Date promis pour */
.data-table thead th:nth-child(7) { width: 14%; min-width: 160px; }  /* Date prochain traitement */

.data-table tbody td {
  padding: 9px 14px;
  font-size: 14px;
  color: #1e293b;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}

.data-table tbody tr:last-child td { border-bottom: none; }
.data-table tbody tr:hover { background: #f8fafc; }

.ref-link {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-weight: 700;
  font-size: 14px;
  color: #1a3a5c;
  font-variant-numeric: tabular-nums;
}

.plan-ref { color: #9a3412; }
.sensible-ref { color: #92400e; }

.rms-tag {
  font-size: 9px;
  font-weight: 800;
  color: #dc2626;
  letter-spacing: 0.4px;
}

.muted-cell { color: #64748b; font-size: 13px; }
.client-cell { max-width: 180px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-weight: 500; }
.objet-cell { max-width: 260px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #334155; }
.date-cell { white-space: nowrap; color: #64748b; font-size: 13px; font-variant-numeric: tabular-nums; }
.urgent-date { color: #dc2626; font-weight: 600; }
.deadline-cell { font-weight: 600; color: #334155; }

/* ── Link / action buttons ───────────────────────────────────── */
.link-btn {
  font-size: 12px;
  font-weight: 600;
  color: #1a3a5c;
  background: none;
  border: 1px solid #cbd5e0;
  border-radius: 6px;
  padding: 4px 10px;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}
.link-btn:hover { background: #f1f5f9; border-color: #94a3b8; }

.vip-btn { color: #92400e; border-color: #fde68a; }
.vip-btn:hover { background: #fef9ee; }

/* ── Toolbar in others header ────────────────────────────────── */
.header-actions { display: flex; align-items: center; gap: 10px; }
.toolbar-controls { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.filter-label { font-size: 12px; font-weight: 600; color: #64748b; }
.filter-select { padding: 4px 8px; border: 1px solid #cbd5e0; border-radius: 6px; background: #fff; font-size: 12px; color: #334155; }

/* ── Table footer ────────────────────────────────────────────── */
.table-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 18px;
  border-top: 1px solid #f1f5f9;
  background: #f8fafc;
  flex-wrap: wrap;
  gap: 10px;
}

.table-footer-count {
  font-size: 12px;
  color: #94a3b8;
}

.pagination {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
}

.page-btn {
  min-width: 30px;
  height: 30px;
  padding: 0 8px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: #fff;
  color: #334155;
  font-size: 12px;
  cursor: pointer;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
}
.page-btn:hover:not(:disabled) { background: #eef2ff; border-color: #1a3a5c; color: #1a3a5c; }
.page-btn.active { background: #1a3a5c; border-color: #1a3a5c; color: #fff; font-weight: 700; }
.page-btn:disabled { opacity: 0.35; cursor: not-allowed; }
.page-info { font-size: 12px; color: #94a3b8; margin-left: 4px; }

/* ── States ──────────────────────────────────────────────────── */
.loading { text-align: center; padding: 48px; color: #94a3b8; font-size: 14px; }
.empty { color: #94a3b8; font-size: 14px; padding: 20px 0; text-align: center; }
</style>

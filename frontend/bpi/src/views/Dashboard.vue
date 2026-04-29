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
            {{ dataDir }}/tickets.xlsx
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
      <div class="stat-card stat-card--donut">
        <p class="stat-label">Répartition des tickets</p>
        <div class="donut-wrap">
          <svg class="donut-svg" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="30" fill="none" stroke="#f1f5f9" stroke-width="10"/>
            <circle v-for="seg in donutSegments" :key="seg.label"
              cx="40" cy="40" r="30" fill="none"
              :stroke="seg.color" stroke-width="10"
              :stroke-dasharray="`${seg.dash} ${seg.gap}`"
              :stroke-dashoffset="seg.offset"
              stroke-linecap="butt"
            />
            <text x="40" y="44" text-anchor="middle" class="donut-total">{{ donutTotal }}</text>
          </svg>
          <ul class="donut-legend">
            <li v-for="seg in donutSegments" :key="seg.label" class="donut-legend-item">
              <span class="donut-dot" :style="{ background: seg.color }"></span>
              <span class="donut-legend-label">{{ seg.label }}</span>
              <span class="donut-legend-val">{{ seg.count }}</span>
            </li>
          </ul>
        </div>
      </div>
      <div class="stat-card stat-card--fiscal">
        <p class="stat-label">Tickets fermés — Année fiscale</p>
        <div class="fiscal-chart">
          <svg :viewBox="`0 0 ${fiscalSvgW} ${fiscalSvgH}`" class="fiscal-svg" preserveAspectRatio="none">
            <!-- Lignes de grille -->
            <line v-for="g in fiscalGridLines" :key="g.y"
              :x1="fiscalPadL" :y1="g.y" :x2="fiscalSvgW - fiscalPadR" :y2="g.y"
              stroke="#f1f5f9" stroke-width="1"/>
            <!-- Valeurs grille -->
            <text v-for="g in fiscalGridLines" :key="'t'+g.y"
              :x="fiscalPadL - 6" :y="g.y + 4"
              text-anchor="end" class="fiscal-grid-label">{{ g.val }}</text>
            <!-- Barres -->
            <g v-for="(m, i) in fiscalMonths" :key="m.key">
              <template v-if="m.count !== null && m.count > 0">
                <rect
                  :x="fiscalBarX(i)" :y="fiscalBarY(m.count)"
                  :width="fiscalBarW" :height="fiscalBarH(m.count)"
                  :fill="m.current ? '#1a6b3a' : '#1a3a5c'"
                  rx="2"
                />
                <text
                  :x="fiscalBarX(i) + fiscalBarW / 2"
                  :y="fiscalBarY(m.count) + fiscalBarH(m.count) - 6"
                  text-anchor="middle" class="fiscal-bar-label"
                >{{ m.count }}</text>
              </template>
              <text
                :x="fiscalBarX(i) + fiscalBarW / 2" :y="fiscalSvgH - fiscalPadB + 13"
                text-anchor="middle" class="fiscal-month-label"
                :fill="m.current ? '#1a6b3a' : '#0f172a'"
              >{{ m.label }}</text>
            </g>
          </svg>
        </div>
      </div>
      <div class="stat-card stat-card--attente">
        <p class="stat-label">Attente retour client</p>
        <div class="attente-stats" style="margin-top:0">
          <div class="attente-main">
            <span class="attente-number">{{ attenteStats.plusDeuxMois }}</span>
            <span class="attente-sublabel">+ 2 mois</span>
          </div>
          <div class="attente-divider"></div>
          <div class="attente-secondary">
            <div class="attente-row">
              <span class="attente-row-label">Total en attente</span>
              <span class="attente-row-val">{{ attenteStats.total }}</span>
            </div>
            <div class="attente-bar-wrap">
              <div class="attente-bar" :style="{ width: attenteStats.total ? Math.round(attenteStats.plusDeuxMois / attenteStats.total * 100) + '%' : '0%' }"></div>
            </div>
            <div class="attente-row" style="margin-top:8px">
              <span class="attente-row-label">Moins de 2 mois</span>
              <span class="attente-row-val">{{ attenteStats.moinsDeux }}</span>
            </div>
            <div class="attente-bar-wrap">
              <div class="attente-bar attente-bar--low" :style="{ width: attenteStats.total ? Math.round(attenteStats.moinsDeux / attenteStats.total * 100) + '%' : '0%' }"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="loadingTickets" class="loading">Chargement…</div>

    <template v-else-if="tickets.length">

      <!-- ── Tickets Critiques ──────────────────────────────────── -->
      <div v-if="critiqueTickets.length" class="section-card">
        <div class="section-header critique-header">
          <div class="section-header-left">
            <span class="section-title">Tickets Critiques</span>
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
                <th>Habilitation</th>
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
                <td><span v-if="habStatus(ticket) === 'chef'" class="hab-badge chef">Chef de file</span><span v-else-if="habStatus(ticket) === 'hab'" class="hab-badge hab">Habilitation</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ── Plans d'Action ────────────────────────────────────── -->
      <div v-if="planTickets.length" class="section-card">
        <div class="section-header plan-header">
          <div class="section-header-left">
            <span class="section-title">Plans d'Action</span>
          </div>
          <span class="section-count">{{ planTickets.length }}</span>
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
                <th>Habilitation</th>
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
                <td><span v-if="habStatus(ticket) === 'chef'" class="hab-badge chef">Chef de file</span><span v-else-if="habStatus(ticket) === 'hab'" class="hab-badge hab">Habilitation</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ── Clients Sensibles ─────────────────────────────────── -->
      <div v-if="sensibleTickets.length" class="section-card">
        <div class="section-header sensible-header">
          <div class="section-header-left">
            <span class="section-title">Clients Sensibles</span>
          </div>
          <span class="section-count">{{ sensibleTickets.length }}</span>
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
                <th>Habilitation</th>
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
                <td><span v-if="habStatus(ticket) === 'chef'" class="hab-badge chef">Chef de file</span><span v-else-if="habStatus(ticket) === 'hab'" class="hab-badge hab">Habilitation</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ── Autres Tickets ────────────────────────────────────── -->
      <div class="section-card">
        <div class="section-header others-header">
          <div class="section-header-left">
            <span class="section-title">Tickets en cours</span>
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
                <th>Habilitation</th>
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
                <td><span v-if="habStatus(ticket) === 'chef'" class="hab-badge chef">Chef de file</span><span v-else-if="habStatus(ticket) === 'hab'" class="hab-badge hab">Habilitation</span></td>
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

const dataDir = import.meta.env.VITE_DATA_DIR || "./data";

// ── Attente retour client stats ──────────────────────────────────
const attenteStats = ref({ total: 0, plusDeuxMois: 0, moinsDeux: 0 });
const loadAttenteStats = async () => {
  try {
    const res = await api.get("/tickets/attente-stats");
    attenteStats.value = res.data;
  } catch (e) {
    console.error("[attenteStats] erreur:", e?.response?.status, e?.response?.data || e?.message);
  }
};

// ── Habilitation ────────────────────────────────────────────────
const chefsDeFile = ref([]); // [{ code_client, nom, prenom }]

const loadChefsDeFile = async () => {
  try {
    const res = await api.get("/habilitation/chefs-de-file");
    chefsDeFile.value = res.data || [];
  } catch {}
};

// Ensemble des code_client gérés par habilitation
const habClientCodes = computed(() =>
  new Set(chefsDeFile.value.map(c => String(c.code_client).trim().toLowerCase()))
);

// Retourne null | "chef" | "hab" pour un ticket
const habStatus = (ticket) => {
  const code = String(ticket.CodeClient || "").trim().toLowerCase();
  if (!habClientCodes.value.has(code)) return null;

  const tNom    = String(ticket.Nom    || "").trim().toLowerCase();
  const tPrenom = String(ticket.Prenom || "").trim().toLowerCase();
  const hasMatch = chefsDeFile.value.some(c =>
    String(c.code_client).trim().toLowerCase() === code &&
    String(c.nom).trim().toLowerCase()    === tNom &&
    String(c.prenom).trim().toLowerCase() === tPrenom
  );
  return hasMatch ? "chef" : "hab";
};

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

onMounted(() => { fetchPage(); loadChefsDeFile(); loadAttenteStats(); loadFiscalMonths(); });
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

const CIRC = 2 * Math.PI * 30; // ≈ 188.5

const donutSegments = computed(() => {
  const cats = [
    { label: "Critiques",        count: critiqueTickets.value.length, color: "#dc2626" },
    { label: "Plans d'action",   count: planTickets.value.length,     color: "#ea580c" },
    { label: "Clients sensibles",count: sensibleTickets.value.length, color: "#d97706" },
    { label: "En cours",          count: otherTickets.value.length,    color: "#94a3b8" },
  ].filter(c => c.count > 0);

  const tot = cats.reduce((s, c) => s + c.count, 0);
  if (!tot) return [];

  let offset = -CIRC / 4; // commence à 12h
  return cats.map(c => {
    const dash = (c.count / tot) * CIRC;
    const gap  = CIRC - dash;
    const seg  = { ...c, dash, gap, offset: -offset };
    offset += dash;
    return seg;
  });
});

const donutTotal = computed(() =>
  critiqueTickets.value.length + planTickets.value.length +
  sensibleTickets.value.length + otherTickets.value.length
);

// Année fiscale Juin → Mai — données depuis le fichier Résumé FY
const fiscalData = ref([]);

const loadFiscalMonths = async () => {
  try {
    const res = await api.get("/tickets/fiscal-months");
    if (res.data) fiscalData.value = res.data;
  } catch {}
};

const FISCAL_KEYS = [
  { key:"jun",label:"Juin" }, { key:"jul",label:"Juil" }, { key:"aug",label:"Août" },
  { key:"sep",label:"Sep"  }, { key:"oct",label:"Oct"  }, { key:"nov",label:"Nov"  },
  { key:"dec",label:"Déc"  }, { key:"jan",label:"Jan"  }, { key:"feb",label:"Fév"  },
  { key:"mar",label:"Mar"  }, { key:"apr",label:"Avr"  }, { key:"may",label:"Mai"  },
];

const fiscalMonths = computed(() => {
  const now = new Date();
  const currentMonthKey = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"][now.getMonth()];
  const base = fiscalData.value.length ? fiscalData.value : FISCAL_KEYS.map(m => ({ ...m, count: null }));
  return base.map(m => ({ ...m, current: m.key === currentMonthKey }));
});

// Dimensions SVG
const fiscalSvgW = 520;
const fiscalSvgH = 120;
const fiscalPadL = 32;
const fiscalPadR = 8;
const fiscalPadT = 10;
const fiscalPadB = 20;
const fiscalBarGap = 4;

const fiscalMax = computed(() => Math.max(...fiscalMonths.value.map(m => m.count ?? 0), 1));

const fiscalChartW = computed(() => fiscalSvgW - fiscalPadL - fiscalPadR);
const fiscalChartH = computed(() => fiscalSvgH - fiscalPadT - fiscalPadB);
const fiscalBarW   = computed(() => (fiscalChartW.value / fiscalMonths.value.length) - fiscalBarGap);

const fiscalBarX = (i) => fiscalPadL + i * (fiscalBarW.value + fiscalBarGap);
const fiscalBarH = (count) => (count / fiscalMax.value) * fiscalChartH.value;
const fiscalBarY = (count) => fiscalPadT + fiscalChartH.value - fiscalBarH(count);

const fiscalGridLines = computed(() => {
  const steps = 4;
  return Array.from({ length: steps + 1 }, (_, i) => {
    const val = Math.round((fiscalMax.value / steps) * i);
    const y = fiscalPadT + fiscalChartH.value - (val / fiscalMax.value) * fiscalChartH.value;
    return { val, y };
  });
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
  margin: -24px;
  padding: 24px;
  min-height: calc(100% + 48px);
  background: #f1f5f9;
  display: flex;
  flex-direction: column;
  gap: 20px;
  font-family: Inter, sans-serif;
}

.stats-row + * { margin-top: 16px; }

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
.progress-pct.done { color: #1a6b3a; }
.progress-pct.error { color: #dc2626; }
.progress-track { height: 7px; background: #e2e8f0; border-radius: 999px; overflow: hidden; }
.progress-bar { height: 100%; border-radius: 999px; background: linear-gradient(90deg, #1a3a5c, #2e5f8a); transition: width 0.3s ease; }
.progress-bar.done { background: linear-gradient(90deg, #1a6b3a, #22c55e); }
.progress-bar.error { background: #dc2626; }
.import-success { display: flex; align-items: center; gap: 5px; margin-top: 8px; font-size: 12px; color: #1a6b3a; }
.import-success svg { width: 15px; height: 15px; fill: #1a6b3a; flex-shrink: 0; }
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

.stat-card--donut { padding: 14px 16px; display: flex; flex-direction: column; }
.stat-card--donut .donut-wrap { flex: 1; display: flex; align-items: center; gap: 16px; margin-top: 10px; min-height: 0; }

.stat-card--fiscal { padding: 14px 16px; grid-column: span 2; }

.stat-card--attente { padding: 14px 16px; display: flex; flex-direction: column; justify-content: space-between; }
.stat-card--attente .attente-stats { flex: 1; display: flex; align-items: center; gap: 14px; margin-top: 10px; }
.attente-stats { display: flex; align-items: center; gap: 14px; margin-top: 10px; }
.attente-main { display: flex; flex-direction: column; align-items: center; flex-shrink: 0; }
.attente-number { font-size: 36px; font-weight: 800; color: #dc2626; line-height: 1; }
.attente-sublabel { font-size: 10px; font-weight: 600; color: #dc2626; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 2px; }
.attente-divider { width: 1px; height: 60px; background: #e2e8f0; flex-shrink: 0; }
.attente-secondary { flex: 1; display: flex; flex-direction: column; gap: 4px; }
.attente-row { display: flex; justify-content: space-between; align-items: center; }
.attente-row-label { font-size: 11px; color: #64748b; }
.attente-row-val { font-size: 12px; font-weight: 700; color: #0f172a; }
.attente-bar-wrap { height: 5px; background: #f1f5f9; border-radius: 99px; overflow: hidden; margin-top: 2px; }
.attente-bar { height: 100%; background: #dc2626; border-radius: 99px; }
.attente-bar--low { background: #94a3b8; }
.fiscal-chart { margin-top: 8px; width: 100%; }
.fiscal-svg { width: 100%; height: 120px; overflow: visible; }
.fiscal-grid-label { font-size: 9px; fill: #0f172a; }
.fiscal-month-label { font-size: 9px; }
.fiscal-bar-label { font-size: 9px; font-weight: 700; fill: #ffffff; }
.donut-wrap { display: flex; align-items: center; gap: 14px; margin-top: 8px; }
.donut-svg { width: 110px; height: 110px; flex-shrink: 0; transform: rotate(-90deg); }
.donut-total {
  font-size: 12px; font-weight: 800; fill: #0f172a;
  transform: rotate(90deg); transform-origin: 40px 40px;
}
.donut-legend { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; justify-content: center; gap: 8px; flex: 1; }
.donut-legend-item { display: flex; align-items: center; gap: 6px; }
.donut-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.donut-legend-label { font-size: 12px; color: #64748b; flex: 1; }
.donut-legend-val { font-size: 13px; font-weight: 700; color: #0f172a; }

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
  padding: 6px 14px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: #1a3a5c;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  text-align: left;
  white-space: nowrap;
}

/* Largeurs proportionnelles identiques pour tous les tableaux */
.data-table thead th:nth-child(1) { width: 13%; min-width: 150px; }  /* Référence */
.data-table thead th:nth-child(2) { width: 8%;  min-width:  90px; }  /* PAC */
.data-table thead th:nth-child(3) { width: 13%; min-width: 140px; }  /* Client */
.data-table thead th:nth-child(4) { width: 22%; min-width: 180px; }  /* Objet */
.data-table thead th:nth-child(5) { width: 9%;  min-width: 100px; }  /* Priorité */
.data-table thead th:nth-child(6) { width: 12%; min-width: 130px; }  /* Date promis pour */
.data-table thead th:nth-child(7) { width: 13%; min-width: 160px; }  /* Date prochain traitement */
.data-table thead th:nth-child(8) { width: 10%; min-width: 110px; white-space: nowrap; }  /* Habilitation */

.hab-badge {
  display: inline-block;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-radius: 4px;
  padding: 2px 7px;
  white-space: nowrap;
}
.hab-badge.chef {
  color: #15803d;
  background: #dcfce7;
  border: 1px solid #bbf7d0;
}
.hab-badge.hab {
  color: #92400e;
  background: #fef3c7;
  border: 1px solid #fde68a;
}

.data-table tbody td {
  padding: 6px 14px;
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

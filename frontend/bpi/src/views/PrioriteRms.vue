<template>
  <div class="page">
    <p class="hint">
      <!--Recherche du mot RMS dans la colonne ID externe et extraction des dates.-->
    </p>

    <div class="filters-row">
      <div class="filter-block">
        <label class="filter-label" for="handlerFilter">À traiter par</label>
        <select
          id="handlerFilter"
          v-model="handlerFilter"
          class="filter-select"
        >
          <option value="all">Tous</option>
          <option value="client">Client</option>
          <option value="adp">ADP</option>
        </select>
      </div>

      <div class="filter-block">
        <label class="filter-label" for="buFilter">Classification BU</label>
        <select
          id="buFilter"
          v-model="buFilter"
          class="filter-select"
          multiple
        >
          <option
            v-for="option in buOptions"
            :key="option"
            :value="option"
          >
            {{ option }}
          </option>
        </select>
      </div>

      <div class="toggle">
        <button
          type="button"
          class="toggle-btn"
          :class="{ active: viewMode === 'equipe' }"
          @click="viewMode = 'equipe'"
        >
          Équipe
        </button>
        <button
          type="button"
          class="toggle-btn"
          :class="{ active: viewMode === 'individuel' }"
          @click="viewMode = 'individuel'"
        >
          Individuel
        </button>
      </div>
    </div>

    <div class="toolbar">
      <span class="total-count">{{ total.toLocaleString("fr-FR") }} tickets RMS</span>
      <div class="toolbar-right">
        <label class="filter-label" for="pageSize">Afficher</label>
        <select id="pageSize" v-model="pageSize" class="filter-select" @change="currentPage = 1">
          <option :value="10">10</option>
          <option :value="20">20</option>
          <option :value="50">50</option>
        </select>
        <span class="filter-label">par page</span>
      </div>
    </div>

    <div v-if="loading" class="loading">Chargement...</div>

    <p v-else-if="!displayRows.length" class="empty">
      Aucun ticket RMS trouvé. Importez d'abord un fichier dans le dashboard.
    </p>

    <template v-else>
    <table class="tickets-table">
      <thead>
        <tr>
          <th class="col-ticket">Numéro ticket</th>
          <th class="col-code-client">Code Client</th>
          <th class="col-compte">Compte</th>
          <th>Objet</th>
          <th>Priorité</th>
          <th v-if="viewMode === 'equipe'">Propriétaire</th>
          <th v-if="viewMode === 'equipe'">Catégorie</th>
          <th v-else>Catégorie</th>
          <th class="col-date-promis">Date promis pour</th>
          <th>Priorité RMS</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, index) in displayRows" :key="row.NumeroTicket || index">
          <td class="col-ticket">{{ row.NumeroTicket }}</td>
          <td class="col-code-client">{{ row.CodeClient }}</td>
          <td class="col-compte" :title="row.Compte">{{ row.Compte }}</td>
          <td class="col-objet" :title="row.Objet">
            {{ truncateText(row.Objet, 35) }}
          </td>
          <td class="col-priorite" :title="row.Priorite">
            {{ row.Priorite }}
          </td>
          <td v-if="viewMode === 'equipe'" class="col-proprietaire" :title="row.Proprietaire">
            {{ row.Proprietaire }}
          </td>
          <td
            v-if="viewMode === 'equipe'"
            class="col-categorie"
            :title="row.Categorie"
          >
            {{ row.Categorie }}
          </td>
          <td v-else class="col-categorie" :title="row.Categorie">
            {{ row.Categorie }}
          </td>
          <td class="col-date-promis">
            <div class="promise-cell">
              <span v-if="!row.DatePromisPour" class="alert alert-severe">
                Non renseignée
              </span>
              <template v-else>
                <span class="promise-date">
                  {{ formatPromiseDate(row.DatePromisPour) }}
                </span>
                <span class="promise-divider" aria-hidden="true"></span>
                <span class="promise-status" :class="promiseStatusClass(row.DatePromisPour)">
                  {{ promiseStatusText(row.DatePromisPour) }}
                </span>
              </template>
            </div>
          </td>
          <td>
            <div class="rms-cell">
              <span
                class="rms-active"
                :class="dateStatusClass(latestDate(row))"
              >
                {{ latestDate(row) }}
              </span>
              <button
                v-if="historyDates(row).length"
                type="button"
                class="rms-counter"
                :aria-expanded="isHistoryOpen(row, index)"
                :aria-controls="`rms-history-${index}`"
                @mouseenter="showHistory(row, index)"
                @mouseleave="hideHistory(row, index)"
                @click="toggleHistory(row, index)"
              >
                +{{ historyDates(row).length }}
              </button>
              <div
                v-if="isHistoryOpen(row, index)"
                class="rms-history"
                :id="`rms-history-${index}`"
              >
                {{ historyDates(row).join(" • ") }}
              </div>
            </div>
          </td>
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
        >
          {{ page }}
        </button>
        <button class="page-btn" :disabled="currentPage === totalPages" @click="currentPage++">›</button>
        <button class="page-btn" :disabled="currentPage === totalPages" @click="currentPage = totalPages">»</button>
        <span class="page-info">Page {{ currentPage }} / {{ totalPages }}</span>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import api from "../services/api";

const displayRows = ref([]);
const total = ref(0);
const buOptions = ref([]);
const viewMode = ref("equipe");
const handlerFilter = ref("all");
const buFilter = ref([]);
const pageSize = ref(20);
const currentPage = ref(1);
const loading = ref(false);
const hoveredHistoryKey = ref(null);
const pinnedHistoryKey = ref(null);

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)));

const fetchPage = async () => {
  loading.value = true;
  try {
    const params = {
      page: currentPage.value,
      limit: pageSize.value,
      handler: handlerFilter.value,
    };
    if (viewMode.value === "individuel") params.mine = "true";
    if (buFilter.value.length) params.bu = buFilter.value.join(",");
    const res = await api.get("/tickets/rms", { params });
    displayRows.value = res.data.tickets;
    total.value = res.data.total;
    if (res.data.buOptions) buOptions.value = res.data.buOptions;
  } catch {
    displayRows.value = [];
    total.value = 0;
  } finally {
    loading.value = false;
  }
};

onMounted(fetchPage);

watch(currentPage, fetchPage);
watch([pageSize, handlerFilter, buFilter, viewMode], () => { currentPage.value = 1; fetchPage(); });

const parseMonthYear = (value) => {
  if (!value) return null;
  const clean = String(value).replace(/[^\d]/g, "");
  if (clean.length !== 6) return null;
  const month = Number(clean.slice(0, 2));
  const year = Number(clean.slice(2));
  if (!month || month < 1 || month > 12) return null;
  return { month, year };
};

const dateStatusClass = (value) => {
  const parsed = parseMonthYear(value);
  if (!parsed) return "chip-unknown";
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  if (parsed.year < currentYear) return "chip-overdue";
  if (parsed.year === currentYear && parsed.month < currentMonth) return "chip-overdue";
  if (parsed.year === currentYear && parsed.month === currentMonth) return "chip-current";
  return "chip-future";
};

const parseDate = (value) => {
  if (!value) return null;
  const raw = String(value).trim();
  const cleaned = raw.replace(/[^0-9,.-]/g, "");
  const numeric = Number(cleaned.replace(",", "."));
  if (!Number.isNaN(numeric) && numeric >= 1) {
    const utc = Date.UTC(1899, 11, 30) + numeric * 86400000;
    const excelDate = new Date(utc);
    if (!Number.isNaN(excelDate.getTime())) return excelDate;
  }
  const match = raw.match(/(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4})/);
  if (match) {
    const parsed = new Date(Number(match[3].length === 2 ? `20${match[3]}` : match[3]), Number(match[2]) - 1, Number(match[1]));
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  const isoMatch = raw.match(/(\d{4})[\/.\-](\d{1,2})[\/.\-](\d{1,2})/);
  if (isoMatch) {
    const parsed = new Date(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]));
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
};

const truncateText = (value, maxLength = 20) => {
  if (!value) return "";
  const text = String(value);
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
};

const formatPromiseDate = (value) => {
  const date = parseDate(value);
  if (!date) return String(value ?? "");
  return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
};

const daysFromToday = (value) => {
  const date = parseDate(value);
  if (!date) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  return Math.round((target - today) / 86400000);
};

const promiseStatusText = (value) => {
  const delta = daysFromToday(value);
  if (delta === null) return "Date invalide";
  if (delta < 0) { const d = Math.abs(delta); return `Dépassée depuis ${d} jour${d > 1 ? "s" : ""}`; }
  if (delta === 0) return "Échéance aujourd'hui";
  return `Il reste ${delta} jour${delta > 1 ? "s" : ""}`;
};

const promiseStatusClass = (value) => {
  const delta = daysFromToday(value);
  if (delta === null) return "promise-unknown";
  return delta < 0 ? "promise-overdue" : "promise-ok";
};

const rowKey = (row, index) => `${row.NumeroTicket ?? "ticket"}-${index}`;

const latestDate = (row) => row?.Dates?.[row.Dates.length - 1] ?? "";
const historyDates = (row) => (!row?.Dates?.length ? [] : row.Dates.slice(0, -1));

const showHistory = (row, index) => { hoveredHistoryKey.value = rowKey(row, index); };
const hideHistory = (row, index) => {
  const key = rowKey(row, index);
  if (hoveredHistoryKey.value === key) hoveredHistoryKey.value = null;
};
const toggleHistory = (row, index) => {
  const key = rowKey(row, index);
  pinnedHistoryKey.value = pinnedHistoryKey.value === key ? null : key;
};
const isHistoryOpen = (row, index) => {
  const key = rowKey(row, index);
  return hoveredHistoryKey.value === key || pinnedHistoryKey.value === key;
};

const visiblePages = computed(() => {
  const t = totalPages.value;
  const c = currentPage.value;
  const pages = [];
  for (let i = Math.max(1, c - 2); i <= Math.min(t, c + 2); i++) pages.push(i);
  return pages;
});
</script>

<style scoped>
.page {
  padding: 24px;
  background-color: #ffffff;
  min-height: 100vh;
}

.hint {
  margin-top: 6px;
  color: #243b53;
}

.filters-row {
  margin-top: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.toggle {
  display: inline-flex;
  gap: 8px;
}

.filter-block {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.filter-label {
  font-weight: 600;
  color: #243b53;
}

.filter-select {
  padding: 6px 10px;
  border: 1px solid #cbd5e0;
  border-radius: 4px;
  background: #ffffff;
}

.filter-select[multiple] {
  min-width: 180px;
  min-height: 70px;
}

.toggle-btn {
  padding: 8px 14px;
  border: 1px solid #cbd5e0;
  background: #ffffff;
  color: #243b53;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
}

.toggle-btn.active {
  background: #0f2742;
  color: #ffffff;
  border-color: #0f2742;
}

.empty {
  margin-top: 16px;
  color: #6b6b6b;
}

.tickets-table {
  width: 100%;
  margin-top: 16px;
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

.tickets-table tbody tr:hover {
  background: #f8fafc;
}

.tickets-table tbody tr:last-child td {
  border-bottom: none;
}

.tickets-table tbody td {
  color: #1e293b;
  font-size: 13px;
  line-height: 1.4;
}

.col-ticket {
  width: 1%;
  white-space: nowrap;
}

.col-code-client {
  width: 120px;
  white-space: nowrap;
}

.col-objet {
  max-width: 260px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.col-priorite {
  width: 100px;
  white-space: nowrap;
}

.col-compte {
  max-width: 220px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.col-proprietaire {
  max-width: 220px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.col-categorie {
  max-width: 200px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.promise-cell {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 10px;
}

.col-date-promis {
  width: 1%;
  white-space: nowrap;
}
.promise-status {
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  border: 1px solid transparent;
}

.promise-status.promise-overdue {
  background: #fee2e2;
  color: #b91c1c;
  border-color: #fecaca;
}

.promise-status.promise-ok {
  background: #dcfce7;
  color: #166534;
  border-color: #bbf7d0;
}

.promise-status.promise-unknown {
  background: #e2e8f0;
  color: #334155;
  border-color: #cbd5e1;
}

.promise-date {
  color: #1f2937;
  font-weight: 400;
  white-space: nowrap;
}

.promise-divider {
  width: 2px;
  height: 22px;
  background: #e2e8f0;
  flex-shrink: 0;
}

.alert {
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  border: 1px solid transparent;
}

.alert-severe {
  background: #fee2e2;
  color: #b91c1c;
  border-color: #fecaca;
}

.alert-info {
  background: #dbeafe;
  color: #1d4ed8;
  border-color: #bfdbfe;
}

.rms-cell {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  position: relative;
}

.rms-active {
  background: #f1f5f9;
  padding: 5px 10px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  letter-spacing: 0.3px;
  border-left-width: 7px;
  font-size: 12px;
  font-weight: 700;
  color: #0f172a;
}

.rms-active.chip-overdue {
  border-color: #fecaca;
  color: #b91c1c;
  border-left-color: #ef4444;
}

.rms-active.chip-current {
  border-color: #86efac;
  color: #166534;
  border-left-color: #22c55e;
}

.rms-active.chip-future {
  border-color: #86efac;
  color: #166534;
  border-left-color: #22c55e;
}

.rms-active.chip-unknown {
  border-color: #cbd5e1;
  color: #334155;
  border-left-color: #94a3b8;
}

.rms-counter {
  border: 1px solid #cbd5e1;
  background: #ffffff;
  color: #0f172a;
  font-size: 12px;
  font-weight: 700;
  padding: 4px 8px;
  border-radius: 999px;
  cursor: pointer;
}

.rms-counter:hover {
  background: #e2e8f0;
}

.rms-history {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  background: #ffffff;
  color: #0f172a;
  padding: 10px 12px;
  border-radius: 12px;
  font-size: 12px;
  box-shadow: 0 14px 28px rgba(15, 23, 42, 0.16);
  border: 1px solid #e2e8f0;
  min-width: 220px;
  z-index: 5;
}

.rms-history::before {
  content: "";
  position: absolute;
  top: -6px;
  left: 18px;
  width: 12px;
  height: 12px;
  background: #ffffff;
  border-left: 1px solid #e2e8f0;
  border-top: 1px solid #e2e8f0;
  transform: rotate(45deg);
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 12px;
  margin-bottom: 12px;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.total-count {
  font-size: 13px;
  color: #64748b;
  background: #f1f5f9;
  padding: 4px 10px;
  border-radius: 99px;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #64748b;
  font-size: 14px;
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
  background: #eef2ff;
  border-color: #0052cc;
  color: #0052cc;
}

.page-btn.active {
  background: #0052cc;
  border-color: #0052cc;
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


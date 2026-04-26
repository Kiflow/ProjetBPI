<template>
  <div class="page">
    <p class="hint">
      <!--Recherche du mot RMS dans la colonne ID externe et extraction des dates.-->
    </p>

    <div class="filters-row">
      <div class="filter-block">
        <label class="filter-label">Classification BU</label>
        <div class="bu-filter-wrap" v-click-outside="closeBuDropdown">
          <button class="bu-trigger" @click="buDropdownOpen = !buDropdownOpen">
            <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M2.628 1.601C5.028 1.206 7.49 1 10 1s4.973.206 7.372.601a.75.75 0 0 1 .628.74v2.288a2.25 2.25 0 0 1-.659 1.59l-4.682 4.683a2.25 2.25 0 0 0-.659 1.59v3.037c0 .684-.31 1.33-.844 1.757l-1.937 1.55A.75.75 0 0 1 8 18.25v-5.757a2.25 2.25 0 0 0-.659-1.591L2.659 6.22A2.25 2.25 0 0 1 2 4.629V2.34a.75.75 0 0 1 .628-.74Z" clip-rule="evenodd"/></svg>
            <span>{{ buFilter.length ? `${buFilter.length} BU sélectionnée${buFilter.length > 1 ? 's' : ''}` : 'Toutes les BU' }}</span>
            <svg class="chevron" :class="{ open: buDropdownOpen }" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd"/></svg>
          </button>
          <div v-if="buDropdownOpen" class="bu-dropdown">
            <label v-for="bu in buOptions" :key="bu" class="bu-option">
              <input type="checkbox" :value="bu" v-model="buFilter" @change="onBuChange" />
              <span>{{ bu }}</span>
            </label>
            <div v-if="buFilter.length" class="bu-reset" @click="buFilter = []; onBuChange()">Réinitialiser</div>
          </div>
        </div>
      </div>

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
    <div class="table-card">
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
              <span v-if="!row.DatePromisPour" class="alert alert-severe">Non renseignée</span>
              <template v-else>
                <span class="promise-date">{{ formatPromiseDate(row.DatePromisPour) }}</span>
                <span class="promise-info" :class="promiseStatusClass(row.DatePromisPour)">
                  i
                  <span class="promise-tooltip">{{ promiseStatusText(row.DatePromisPour) }}</span>
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
    </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import api from "../services/api";

const vClickOutside = {
  mounted(el, binding) {
    el._clickOutside = (e) => { if (!el.contains(e.target)) binding.value(); };
    document.addEventListener("click", el._clickOutside);
  },
  unmounted(el) { document.removeEventListener("click", el._clickOutside); }
};

const displayRows = ref([]);
const total = ref(0);
const buOptions = ref([]);
const viewMode = ref("equipe");
const handlerFilter = ref("all");
const buFilter = ref([]);
const buDropdownOpen = ref(false);
const closeBuDropdown = () => { buDropdownOpen.value = false; };
const onBuChange = () => { currentPage.value = 1; fetchPage(); };
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
  margin: -24px;
  padding: 24px;
  min-height: calc(100% + 48px);
  background: #f1f5f9;
  font-family: Inter, sans-serif;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.filters-row {
  display: flex;
  align-items: center;
  gap: 32px;
  flex-wrap: wrap;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 14px 18px;
  box-shadow: 0 1px 4px rgba(15,23,42,0.05);
}

.toggle {
  display: inline-flex;
  gap: 6px;
  margin-left: auto;
}

.filter-block {
  display: flex;
  align-items: center;
  gap: 10px;
}

.filter-label {
  font-size: 12px;
  font-weight: 700;
  color: #475569;
  white-space: nowrap;
}

.filter-select {
  padding: 6px 10px;
  border: 1px solid #e2e8f0;
  border-radius: 7px;
  background: #f8fafc;
  font-size: 13px;
  color: #334155;
}

.bu-filter-wrap { position: relative; min-width: 180px; }
.bu-trigger {
  display: flex; align-items: center; gap: 6px; width: 100%;
  padding: 6px 10px; background: #fff; border: 1px solid #cbd5e0;
  border-radius: 4px; font-size: 13px; color: #334155; cursor: pointer;
  transition: border-color 0.15s;
}
.bu-trigger:hover { border-color: #94a3b8; }
.bu-trigger svg:first-child { width: 13px; height: 13px; color: #64748b; flex-shrink: 0; }
.bu-trigger span { flex: 1; text-align: left; }
.bu-trigger .chevron { width: 13px; height: 13px; color: #94a3b8; transition: transform 0.2s; flex-shrink: 0; }
.bu-trigger .chevron.open { transform: rotate(180deg); }
.bu-dropdown {
  position: absolute; top: calc(100% + 4px); left: 0; right: 0; min-width: 200px;
  background: #fff; border: 1px solid #e2e8f0; border-radius: 8px;
  box-shadow: 0 8px 20px rgba(15,23,42,0.12); z-index: 30; overflow: hidden;
}
.bu-option {
  display: flex; align-items: center; gap: 8px; padding: 7px 12px;
  font-size: 13px; color: #334155; cursor: pointer; transition: background 0.12s;
}
.bu-option:hover { background: #f8fafc; }
.bu-option input[type="checkbox"] { accent-color: #1a3a5c; width: 14px; height: 14px; cursor: pointer; }
.bu-reset {
  padding: 7px 12px; font-size: 12px; font-weight: 600; color: #dc2626;
  border-top: 1px solid #f1f5f9; cursor: pointer;
}
.bu-reset:hover { background: #fff7f7; }

.toggle-btn {
  padding: 7px 14px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  color: #64748b;
  border-radius: 7px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
}
.toggle-btn:hover { background: #f1f5f9; border-color: #cbd5e0; color: #334155; }
.toggle-btn.active {
  background: #1a3a5c;
  color: #ffffff;
  border-color: #1a3a5c;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}

.empty {
  color: #94a3b8;
  font-size: 14px;
  text-align: center;
  padding: 40px;
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

/* ── Table card ── */
.table-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  box-shadow: 0 1px 4px rgba(15,23,42,0.06);
  overflow: hidden;
}

.tickets-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: auto;
}

.tickets-table th,
.tickets-table td {
  border-bottom: 1px solid #f1f5f9;
  padding: 8px 14px;
  text-align: left;
  vertical-align: middle;
}

.tickets-table th:last-child,
.tickets-table td:last-child { border-right: none; }

.tickets-table thead th {
  border-bottom: 2px solid #e2e8f0;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: #1a3a5c;
  padding: 10px 14px;
  background: #f8fafc;
  white-space: nowrap;
}

.tickets-table tbody tr { transition: background 0.12s ease; }
.tickets-table tbody tr:hover { background: #f8fafc; }
.tickets-table tbody tr:last-child td { border-bottom: none; }
.tickets-table tbody td { color: #1e293b; font-size: 13px; line-height: 1.4; }

.col-ticket { width: 1%; white-space: nowrap; }
.col-ticket td { font-weight: 700; color: #1a3a5c; font-variant-numeric: tabular-nums; }
.col-code-client { width: 100px; white-space: nowrap; color: #64748b; font-size: 12px; }

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
  align-items: center;
  gap: 8px;
}

.col-date-promis {
  width: 1%;
  white-space: nowrap;
}
.promise-info {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 17px;
  height: 17px;
  border-radius: 50%;
  font-size: 10px;
  font-weight: 800;
  font-style: italic;
  cursor: default;
  flex-shrink: 0;
}
.promise-info.promise-overdue { background: #dc2626; color: #fff; }
.promise-info.promise-ok      { background: #16a34a; color: #fff; }
.promise-info.promise-unknown { background: #94a3b8; color: #fff; }

.promise-tooltip {
  display: none;
  position: absolute;
  bottom: calc(100% + 6px);
  left: 50%;
  transform: translateX(-50%);
  background: #0f172a;
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  font-style: normal;
  white-space: nowrap;
  padding: 5px 10px;
  border-radius: 6px;
  pointer-events: none;
  z-index: 20;
}
.promise-tooltip::after {
  content: "";
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 5px solid transparent;
  border-top-color: #0f172a;
}
.promise-info:hover .promise-tooltip { display: block; }

.promise-date {
  color: #1f2937;
  font-weight: 400;
  white-space: nowrap;
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

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.total-count {
  font-size: 12px;
  font-weight: 700;
  color: #1a3a5c;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  padding: 4px 12px;
  border-radius: 99px;
}

.loading {
  text-align: center;
  padding: 48px;
  color: #94a3b8;
  font-size: 14px;
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 12px 18px;
  border-top: 1px solid #f1f5f9;
  background: #f8fafc;
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

.page-btn:hover:not(:disabled) { background: #eff6ff; border-color: #1a3a5c; color: #1a3a5c; }
.page-btn.active { background: #1a3a5c; border-color: #1a3a5c; color: #fff; font-weight: 700; }
.page-btn:disabled { opacity: 0.35; cursor: not-allowed; }
.page-info { font-size: 12px; color: #94a3b8; margin-left: 6px; }
</style>


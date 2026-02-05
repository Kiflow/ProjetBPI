<template>
  <div class="page">
    <p class="hint">
      Recherche du mot RMS dans la colonne ID externe et extraction des dates.
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

    <p v-if="!displayRows.length" class="empty">
      Aucun ticket RMS trouvé. Importez d'abord un fichier Excel dans le
      dashboard.
    </p>

    <table v-else class="tickets-table">
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";

const rows = ref([]);
const viewMode = ref("equipe");
const handlerFilter = ref("all");
const buFilter = ref([]);
const hoveredHistoryKey = ref(null);
const pinnedHistoryKey = ref(null);

const normalizeDate = (raw) => {
  if (!raw) return null;
  const clean = String(raw).replace(/[^\d]/g, "");
  if (clean.length === 4) {
    const month = clean.slice(0, 2);
    const year = `20${clean.slice(2)}`;
    return `${month}/${year}`;
  }
  if (clean.length === 6) {
    const month = clean.slice(0, 2);
    const year = clean.slice(2);
    return `${month}/${year}`;
  }
  return null;
};

const extractRmsDates = (text) => {
  if (!text) return [];
  const upper = String(text).toUpperCase();
  if (!upper.includes("RMS")) return [];

  const matches =
    String(text).match(/\b\d{2}[\/.-]?\d{2,4}\b/g) ?? [];
  const normalized = matches
    .map((m) => normalizeDate(m))
    .filter(Boolean);

  return Array.from(new Set(normalized));
};

const isEquipe = (ticket) => {
  const owner = String(ticket?.Proprietaire ?? "").toLowerCase();
  return owner.includes("equipe") || owner.includes("équipe") || owner.includes("pole") || owner.includes("pôle");
};

const isClientStatus = (value) => {
  const normalized = String(value ?? "").toLowerCase().trim();
  return normalized === "attente retour client";
};

const parseMonthYear = (value) => {
  if (!value) return null;
  const clean = String(value).replace(/[^\d]/g, "");
  if (clean.length !== 6) return null;
  const month = Number(clean.slice(0, 2));
  const year = Number(clean.slice(2));
  if (!month || month < 1 || month > 12) return null;
  return { month, year };
};

const sortRmsDates = (values) => {
  const sorted = [...values].sort((a, b) => {
    const parsedA = parseMonthYear(a);
    const parsedB = parseMonthYear(b);
    if (!parsedA && !parsedB) return String(a).localeCompare(String(b), "fr");
    if (!parsedA) return -1;
    if (!parsedB) return 1;
    if (parsedA.year !== parsedB.year) return parsedA.year - parsedB.year;
    return parsedA.month - parsedB.month;
  });
  return sorted;
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

  // Prefer explicit d/m/y parsing to avoid US month/day swaps.
  const match = raw.match(/(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4})/);
  if (match) {
    const day = Number(match[1]);
    const month = Number(match[2]);
    const year = Number(match[3].length === 2 ? `20${match[3]}` : match[3]);
    const parsed = new Date(year, month - 1, day);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  // Fallback for ISO-like dates only (e.g. 2025-02-01).
  const isoMatch = raw.match(/(\d{4})[\/.\-](\d{1,2})[\/.\-](\d{1,2})/);
  if (isoMatch) {
    const year = Number(isoMatch[1]);
    const month = Number(isoMatch[2]);
    const day = Number(isoMatch[3]);
    const parsed = new Date(year, month - 1, day);
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
  if (!date) return String(value);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String(date.getFullYear());
  return `${day}/${month}/${year}`;
};

const daysFromToday = (value) => {
  const date = parseDate(value);
  if (!date) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  const diffMs = target - today;
  return Math.round(diffMs / 86400000);
};

const promiseStatusText = (value) => {
  const delta = daysFromToday(value);
  if (delta === null) return "Date invalide";
  if (delta < 0) {
    const days = Math.abs(delta);
    return `Dépassée depuis ${days} jour${days > 1 ? "s" : ""}`;
  }
  if (delta === 0) return "Échéance aujourd'hui";
  return `Il reste ${delta} jour${delta > 1 ? "s" : ""}`;
};

const promiseStatusClass = (value) => {
  const delta = daysFromToday(value);
  if (delta === null) return "promise-unknown";
  return delta < 0 ? "promise-overdue" : "promise-ok";
};

const isPromiseOverdue = (value) => {
  const date = parseDate(value);
  if (!date) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
};

const displayRows = computed(() => {
  let filtered = rows.value;
  if (viewMode.value !== "equipe") {
    filtered = filtered.filter((row) => !isEquipe(row));
  }

  if (handlerFilter.value === "client") {
    filtered = filtered.filter((row) => isClientStatus(row.Statut));
  } else if (handlerFilter.value === "adp") {
    filtered = filtered.filter((row) => !isClientStatus(row.Statut));
  }

  if (viewMode.value === "equipe" && buFilter.value.length) {
    filtered = filtered.filter((row) =>
      buFilter.value.includes(row.ClassificationBU)
    );
  }

  return filtered;
});

const rowKey = (row, index) => `${row.NumeroTicket ?? "ticket"}-${index}`;

const latestDate = (row) => row?.Dates?.[row.Dates.length - 1] ?? "";

const historyDates = (row) => {
  if (!row?.Dates?.length) return [];
  return row.Dates.slice(0, -1);
};

const showHistory = (row, index) => {
  hoveredHistoryKey.value = rowKey(row, index);
};

const hideHistory = (row, index) => {
  const key = rowKey(row, index);
  if (hoveredHistoryKey.value === key) {
    hoveredHistoryKey.value = null;
  }
};

const toggleHistory = (row, index) => {
  const key = rowKey(row, index);
  pinnedHistoryKey.value = pinnedHistoryKey.value === key ? null : key;
};

const isHistoryOpen = (row, index) => {
  const key = rowKey(row, index);
  return hoveredHistoryKey.value === key || pinnedHistoryKey.value === key;
};

onMounted(() => {
  const stored = localStorage.getItem("tickets");
  if (!stored) return;
  let tickets = [];
  try {
    tickets = JSON.parse(stored);
  } catch {
    tickets = [];
  }

  rows.value = tickets
    .map((ticket) => {
      const dates = sortRmsDates(extractRmsDates(ticket.IdExterne));
      if (!dates.length) return null;
      return {
        NumeroTicket: ticket.NumeroTicket,
        Objet: ticket.Objet,
        Priorite: ticket.Priorite,
        CodeClient: ticket.CodeClient,
        Compte: ticket.Compte,
        Proprietaire: ticket.Proprietaire,
        Categorie: ticket.Categorie,
        ClassificationBU: ticket.ClassificationBU,
        Statut: ticket.Statut,
        DatePromisPour: ticket.DatePromisPour,
        Dates: dates,
      };
    })
    .filter(Boolean);
});

const buOptions = computed(() => {
  const values = rows.value
    .map((row) => row.ClassificationBU)
    .filter((value) => value && String(value).trim().length);
  return Array.from(new Set(values)).sort((a, b) =>
    String(a).localeCompare(String(b), "fr", { sensitivity: "base" })
  );
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
  border-radius: 12px;
  box-shadow: 0 6px 14px rgba(15, 23, 42, 0.06);
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
.tickets-table td:last-child {
  border-right: none;
}

.tickets-table thead {
  background: linear-gradient(90deg, #eef2ff 0%, #f8fafc 100%);
}

.tickets-table th {
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-size: 12px;
  font-weight: 700;
  color: #334155;
  padding: 12px 12px;
}

.tickets-table tbody tr {
  transition: background-color 0.2s ease, transform 0.2s ease;
}

.tickets-table tbody tr:nth-child(even) {
  background: #f8fafc;
}

.tickets-table tbody tr:hover {
  background: #eef2ff;
}

.tickets-table tbody td {
  color: #0f172a;
  line-height: 1.2;
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
</style>


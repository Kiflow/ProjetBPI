<template>
  <div class="page">
    <p class="hint">
      Recherche du mot RMS dans la colonne ID externe et extraction des dates.
    </p>

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

    <p v-if="!displayRows.length" class="empty">
      Aucun ticket RMS trouvé. Importez d'abord un fichier Excel dans le
      dashboard.
    </p>

    <table v-else class="tickets-table">
      <thead>
        <tr>
          <th class="col-ticket">Numéro ticket</th>
          <th>Code Client</th>
          <th>Compte</th>
          <th>Objet</th>
          <th v-if="viewMode === 'equipe'">Propriétaire</th>
          <th>Date promis pour</th>
          <th>Priorité RMS</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, index) in displayRows" :key="row.NumeroTicket || index">
          <td class="col-ticket">{{ row.NumeroTicket }}</td>
          <td>{{ row.CodeClient }}</td>
          <td>{{ row.Compte }}</td>
          <td>{{ row.Objet }}</td>
          <td v-if="viewMode === 'equipe'">{{ row.Proprietaire }}</td>
          <td>
            <div class="promise-cell">
              <span v-if="!row.DatePromisPour" class="alert alert-severe">
                Non renseignée
              </span>
              <span
                v-else-if="isPromiseOverdue(row.DatePromisPour)"
                class="alert alert-info"
              >
                Dépassée — {{ formatPromiseDate(row.DatePromisPour) }}
              </span>
              <span v-else class="promise-date">
                {{ formatPromiseDate(row.DatePromisPour) }}
              </span>
            </div>
          </td>
          <td>
            <div class="rms-cell">
              <div class="rms-timeline">
                <div
                  v-for="(date, idx) in row.Dates"
                  :key="`${row.NumeroTicket}-${idx}`"
                  class="rms-node"
                  :class="dateStatusClass(date)"
                >
                  <span class="rms-date">{{ date }}</span>
                </div>
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
  const numeric = Number(raw.replace(",", "."));
  if (!Number.isNaN(numeric) && numeric > 20000) {
    const utc = Date.UTC(1899, 11, 30) + numeric * 86400000;
    const excelDate = new Date(utc);
    if (!Number.isNaN(excelDate.getTime())) return excelDate;
  }
  const direct = new Date(raw);
  if (!Number.isNaN(direct.getTime())) return direct;

  const match = raw.match(/(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4})/);
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]) - 1;
  const year = Number(match[3].length === 2 ? `20${match[3]}` : match[3]);
  const fallback = new Date(year, month, day);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
};

const formatPromiseDate = (value) => {
  const date = parseDate(value);
  if (!date) return String(value);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String(date.getFullYear());
  return `${day}/${month}/${year}`;
};

const isPromiseOverdue = (value) => {
  const date = parseDate(value);
  if (!date) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
};

const displayRows = computed(() => {
  if (viewMode.value === "equipe") {
    return rows.value;
  }
  return rows.value.filter((row) => !isEquipe(row));
});

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
      const dates = extractRmsDates(ticket.IdExterne);
      if (!dates.length) return null;
      return {
        NumeroTicket: ticket.NumeroTicket,
        Objet: ticket.Objet,
        CodeClient: ticket.CodeClient,
        Compte: ticket.Compte,
        Proprietaire: ticket.Proprietaire,
        DatePromisPour: ticket.DatePromisPour,
        Dates: dates,
      };
    })
    .filter(Boolean);
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

.toggle {
  margin-top: 12px;
  display: inline-flex;
  gap: 8px;
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
  border: 1px solid #e2e8f0;
  padding: 10px 12px;
  text-align: left;
}

.tickets-table thead {
  background: #f5f7fa;
}

.col-ticket {
  width: 1%;
  white-space: nowrap;
}

.promise-cell {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.promise-date {
  color: #1f2937;
  font-weight: 600;
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
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.rms-timeline {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  position: relative;
}

.rms-timeline::before {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  height: 2px;
  background: #e2e8f0;
  transform: translateY(-50%);
}

.rms-node {
  display: inline-flex;
  align-items: center;
  font-size: 11px;
  font-weight: 600;
  color: #0f172a;
  position: relative;
  background: #ffffff;
  padding: 0 2px;
}

.rms-date {
  background: #f1f5f9;
  padding: 3px 8px;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
  letter-spacing: 0.2px;
  border-left-width: 6px;
}

.chip-overdue .rms-date {
  border-color: #fecaca;
  color: #b91c1c;
  border-left-color: #ef4444;
}

.chip-current .rms-date {
  border-color: #fde68a;
  color: #92400e;
  border-left-color: #f59e0b;
}

.chip-future .rms-date {
  border-color: #86efac;
  color: #166534;
  border-left-color: #22c55e;
}

.chip-unknown .rms-date {
  border-color: #cbd5e1;
  color: #334155;
  border-left-color: #94a3b8;
}
</style>


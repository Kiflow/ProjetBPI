<template>
  <div class="tickets">
    <p class="hint">
      Données lues depuis le fichier chargé dans le dashboard.
    </p>

    <p v-if="!tickets.length" class="empty">
      Aucun ticket chargé. Importez d'abord un fichier Excel dans le dashboard.
    </p>

    <div v-else class="filters">
      <label class="filter-label" for="sortKey">Trier par</label>
      <select id="sortKey" v-model="sortKey" class="filter-select">
        <option value="Priorite">Priorité</option>
        <option value="DatePromisPour">Date promis pour</option>
        <option value="Echeance">Échéance</option>
      </select>
    </div>

    <div v-if="tickets.length" class="legend">
      <div class="legend-item">
        <span class="marker marker-rms"></span>
        <span>Ticket RMS (détecté dans ID externe)</span>
      </div>
    </div>

    <table v-if="tickets.length" class="tickets-table">
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
        <tr
          v-for="(ticket, index) in sortedTickets"
          :key="ticket.NumeroTicket || index"
        >
          <td>
            <div class="ticket-id">
              <span
                v-if="hasRms(ticket)"
                class="marker marker-rms"
                aria-hidden="true"
              ></span>
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";

const tickets = ref([]);
const sortKey = ref("Priorite");

onMounted(() => {
  const stored = localStorage.getItem("tickets");
  if (!stored) return;
  try {
    tickets.value = JSON.parse(stored);
  } catch {
    tickets.value = [];
  }
});

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
    const day = Number(match[1]);
    const month = Number(match[2]);
    const year = Number(match[3].length === 2 ? `20${match[3]}` : match[3]);
    const parsed = new Date(year, month - 1, day);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

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

const formatDate = (value) => {
  const date = parseDate(value);
  if (!date) return value ?? "";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String(date.getFullYear());
  return `${day}/${month}/${year}`;
};

const parseMaybeNumber = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const normalized = String(value).replace(/\s/g, "").replace(",", ".");
  const parsed = Number(normalized);
  return Number.isNaN(parsed) ? null : parsed;
};

const hasRms = (ticket) => {
  const text = String(ticket?.IdExterne ?? "").toUpperCase();
  return text.includes("RMS");
};

const sortedTickets = computed(() => {
  const key = sortKey.value;
  if (!key) return tickets.value;
  return [...tickets.value].sort((a, b) => {
    const aValue = a[key] ?? "";
    const bValue = b[key] ?? "";

    if (key === "DatePromisPour" || key === "Echeance") {
      const aDate = parseDate(aValue);
      const bDate = parseDate(bValue);
      if (aDate && bDate) return aDate - bDate;
      if (aDate) return -1;
      if (bDate) return 1;
    }

    const aNumber = parseMaybeNumber(aValue);
    const bNumber = parseMaybeNumber(bValue);
    if (aNumber !== null && bNumber !== null) return aNumber - bNumber;

    return String(aValue).localeCompare(String(bValue), "fr", {
      numeric: true,
      sensitivity: "base",
    });
  });
});
</script>

<style scoped>
.tickets {
  padding: 24px;
  background-color: #ffffff;
  min-height: 100vh;
}

.hint {
  margin-top: 6px;
  color: #243b53;
}

.empty {
  margin-top: 16px;
  color: #6b6b6b;
}

.filters {
  margin-top: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
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

.legend {
  margin-top: 12px;
  display: flex;
  align-items: center;
  gap: 16px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #243b53;
  font-size: 14px;
}

.marker {
  width: 8px;
  height: 18px;
  border-radius: 2px;
  display: inline-block;
}

.marker-rms {
  background: #d14343;
}

.ticket-id {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tickets-table {
  width: 100%;
  margin-top: 16px;
  border-collapse: collapse;
  background: #ffffff;
  border-radius: 12px;
  overflow: hidden;
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

.col-pac {
  width: 120px;
  white-space: nowrap;
}

.col-client {
  max-width: 220px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>

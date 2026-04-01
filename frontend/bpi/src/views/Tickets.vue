<template>
  <div class="tickets">
    <p v-if="!tickets.length" class="empty">
      Aucun ticket chargé. Importez d'abord un fichier dans le dashboard.
    </p>

    <div v-else>
      <div class="toolbar">
        <div class="toolbar-left">
          <label class="filter-label" for="sortKey">Trier par</label>
          <select id="sortKey" v-model="sortKey" class="filter-select">
            <option value="Priorite">Priorité</option>
            <option value="DatePromisPour">Date promis pour</option>
            <option value="Echeance">Échéance</option>
          </select>
        </div>

        <div class="toolbar-right">
          <span class="total-count">{{ total.toLocaleString("fr-FR") }} tickets</span>
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
        <div class="legend-item">
          <span class="marker marker-rms"></span>
          <span>Ticket RMS (détecté dans ID externe)</span>
        </div>
      </div>

      <div v-if="loading" class="loading">Chargement...</div>

      <table v-else class="tickets-table">
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
        >
          {{ page }}
        </button>

        <button class="page-btn" :disabled="currentPage === totalPages" @click="currentPage++">›</button>
        <button class="page-btn" :disabled="currentPage === totalPages" @click="currentPage = totalPages">»</button>

        <span class="page-info">Page {{ currentPage }} / {{ totalPages }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import api from "../services/api";

const tickets = ref([]);
const total = ref(0);
const sortKey = ref("Priorite");
const pageSize = ref(20);
const currentPage = ref(1);
const loading = ref(false);

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)));

const fetchPage = async () => {
  loading.value = true;
  try {
    const res = await api.get("/tickets/db", {
      params: { page: currentPage.value, limit: pageSize.value, sort: sortKey.value }
    });
    tickets.value = res.data.tickets;
    total.value = res.data.total;
  } catch {
    tickets.value = [];
    total.value = 0;
  } finally {
    loading.value = false;
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

const formatDate = (value) => {
  const date = parseDate(value);
  if (!date) return value ?? "";
  return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
};

const parseMaybeNumber = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(String(value).replace(/\s/g, "").replace(",", "."));
  return Number.isNaN(parsed) ? null : parsed;
};

const hasRms = (ticket) => String(ticket?.IdExterne ?? "").toUpperCase().includes("RMS");

const visiblePages = computed(() => {
  const t = totalPages.value;
  const c = currentPage.value;
  const pages = [];
  for (let i = Math.max(1, c - 2); i <= Math.min(t, c + 2); i++) pages.push(i);
  return pages;
});
</script>

<style scoped>
.tickets {
  padding: 24px;
  background-color: #ffffff;
  min-height: 100vh;
}

.empty {
  margin-top: 16px;
  color: #6b6b6b;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 12px;
}

.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.filter-label {
  font-weight: 600;
  color: #243b53;
  font-size: 14px;
}

.filter-select {
  padding: 6px 10px;
  border: 1px solid #cbd5e0;
  border-radius: 4px;
  background: #ffffff;
}

.total-count {
  font-size: 13px;
  color: #64748b;
  background: #f1f5f9;
  padding: 4px 10px;
  border-radius: 99px;
}

.legend {
  margin-bottom: 12px;
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
  padding: 12px;
}

.tickets-table tbody tr {
  transition: background-color 0.15s ease;
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

.loading {
  text-align: center;
  padding: 40px;
  color: #64748b;
  font-size: 14px;
}
</style>

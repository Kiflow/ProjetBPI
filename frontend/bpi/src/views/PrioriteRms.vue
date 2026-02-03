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
          <td>priorité rms du {{ row.Dates }}</td>
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
        Dates: dates.join(" | "),
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
</style>

<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h2>Centralisation demande</h2>
        <p class="subtitle">Exemples de themes et tarifs de facturation.</p>
      </div>
    </div>

    <div class="card">
      <div class="filters">
        <label class="filter-field">
          <span>Filtrer par theme</span>
          <select v-model="selectedTheme">
            <option value="">Tous les themes</option>
            <option v-for="theme in themes" :key="theme.id" :value="theme.name">
              {{ theme.name }}
            </option>
          </select>
        </label>
      </div>
      <div class="table-wrap">
        <table class="tickets-table">
          <thead>
            <tr>
              <th>Theme</th>
              <th>Description</th>
              <th>Facturation max</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="theme in filteredThemes" :key="theme.id">
              <td class="theme-name">{{ theme.name }}</td>
              <td class="theme-desc">{{ theme.description }}</td>
              <td class="theme-price">{{ theme.price }}</td>
            </tr>
            <tr v-if="filteredThemes.length === 0">
              <td colspan="3" class="empty-row">Aucun theme trouve.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";

const selectedTheme = ref("");

const themes = [
  {
    id: 1,
    name: "Ouverture de compte",
    description: "Creation et verification des informations client.",
    price: "2 500 MAD"
  },
  {
    id: 2,
    name: "Mise a jour KYC",
    description: "Controle des documents et validation annuelle.",
    price: "1 800 MAD"
  },
  {
    id: 3,
    name: "Reclamation client",
    description: "Traitement des demandes et suivi des resolutions.",
    price: "1 200 MAD"
  },
  {
    id: 4,
    name: "Cloture de compte",
    description: "Verification, calcul des soldes et fermeture.",
    price: "2 200 MAD"
  },
  {
    id: 5,
    name: "Incident carte",
    description: "Blocage, remplacement et suivi de dossier.",
    price: "900 MAD"
  }
];

const filteredThemes = computed(() => {
  if (!selectedTheme.value) return themes;
  return themes.filter((theme) => theme.name === selectedTheme.value);
});
</script>

<style scoped>
.page {
  padding: 24px;
  background-color: #ffffff;
  min-height: 100vh;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  font-size: 24px;
  color: #0f172a;
}

.subtitle {
  margin: 4px 0 0;
  color: #475569;
}

.card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 18px;
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.06);
}

.filters {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
}

.filter-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-weight: 600;
  color: #1f2937;
  font-size: 13px;
}

.filter-field select {
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  min-width: 220px;
}

.table-wrap {
  overflow-x: auto;
}

.tickets-table {
  width: 100%;
  margin-top: 8px;
  border-collapse: collapse;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 6px 14px rgba(15, 23, 42, 0.06);
}

.tickets-table th,
.tickets-table td {
  text-align: left;
  border-bottom: 1px solid #e2e8f0;
  border-right: 1px solid #e2e8f0;
  padding: 8px 12px;
}

.tickets-table th:last-child,
.tickets-table td:last-child {
  border-right: none;
}

.tickets-table thead {
  background: linear-gradient(90deg, #eef2ff 0%, #f8fafc 100%);
}

.tickets-table th {
  font-size: 12px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
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

.theme-name {
  font-weight: 700;
  color: #0f172a;
}

.theme-desc {
  color: #475569;
}

.theme-price {
  font-weight: 700;
  color: #1f6f43;
}

.empty-row {
  text-align: center;
  color: #64748b;
  padding: 14px 8px;
}

@media (max-width: 768px) {
  .themes-table th,
  .themes-table td {
    padding: 10px 12px;
  }
}
</style>

<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h2>Facturation</h2>
        <p class="subtitle">
          Themes, sous-themes, niveau de difficulte et facturation GAP.
        </p>
      </div>
    </div>

    <div class="card filters">
      <div class="filter-field">
        <label for="theme-filter">Theme</label>
        <select id="theme-filter" v-model="selectedTheme">
          <option value="all">Tous les themes</option>
          <option v-for="theme in themeOptions" :key="theme" :value="theme">
            {{ theme }}
          </option>
        </select>
      </div>
      <div class="filter-field">
        <label for="subtheme-filter">Sous-theme</label>
        <select id="subtheme-filter" v-model="selectedSubTheme">
          <option value="all">Tous les sous-themes</option>
          <option
            v-for="subTheme in subThemeOptions"
            :key="subTheme"
            :value="subTheme"
          >
            {{ subTheme }}
          </option>
        </select>
      </div>
    </div>

    <div class="card table-card">
      <p v-if="loading" class="empty-row">Chargement des donnees...</p>
      <p v-else-if="error" class="empty-row">{{ error }}</p>
      <div
        v-for="group in groupedRows"
        :key="group.theme"
        class="theme-block"
      >
        <h3>{{ group.theme }}</h3>
        <div class="table-wrap">
          <table class="facturation-table">
            <thead>
              <tr>
                <th>Sous-theme</th>
                <th>Difficulte</th>
                <th>Facturation paie</th>
                <th>Facturation GAP (jours)</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in group.items" :key="row.id">
                <td>{{ row.subTheme }}</td>
                <td>
                  <span v-if="row.level" :class="['badge', `level-${row.level}`]">
                    {{ formatLevel(row.level) }}
                  </span>
                  <span v-else>-</span>
                </td>
                <td>{{ row.pay || "-" }}</td>
                <td>{{ row.gapDays || "-" }}</td>
              </tr>
              <tr v-if="group.items.length === 0">
                <td colspan="4" class="empty-row">Aucun sous-theme.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <p v-if="!loading && !error && groupedRows.length === 0" class="empty-row">
        Aucun resultat pour ce filtre.
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import api from "../services/api";

const rows = ref([]);
const loading = ref(false);
const error = ref("");

const selectedTheme = ref("all");
const selectedSubTheme = ref("all");

const themeOptions = computed(() =>
  Array.from(new Set(rows.value.map((row) => row.theme))).sort()
);

const subThemeOptions = computed(() => {
  const subset =
    selectedTheme.value === "all"
      ? rows.value
      : rows.value.filter((row) => row.theme === selectedTheme.value);
  return Array.from(new Set(subset.map((row) => row.subTheme))).sort();
});

const filteredRows = computed(() =>
  rows.value.filter((row) => {
    const themeMatch =
      selectedTheme.value === "all" || row.theme === selectedTheme.value;
    const subThemeMatch =
      selectedSubTheme.value === "all" ||
      row.subTheme === selectedSubTheme.value;
    return themeMatch && subThemeMatch;
  })
);

const groupedRows = computed(() => {
  const groups = new Map();
  filteredRows.value.forEach((row) => {
    if (!groups.has(row.theme)) {
      groups.set(row.theme, []);
    }
    groups.get(row.theme).push(row);
  });
  return Array.from(groups.entries()).map(([theme, items]) => ({
    theme,
    items
  }));
});

const fetchFacturation = async () => {
  loading.value = true;
  error.value = "";
  try {
    const res = await api.get("/facturation");
    rows.value = Array.isArray(res.data) ? res.data : [];
  } catch (err) {
    console.error("[facturation] Erreur chargement:", err);
    error.value = "Impossible de charger les donnees de facturation.";
    rows.value = [];
  } finally {
    loading.value = false;
  }
};

watch(selectedTheme, () => {
  if (
    selectedSubTheme.value !== "all" &&
    !subThemeOptions.value.includes(selectedSubTheme.value)
  ) {
    selectedSubTheme.value = "all";
  }
});

onMounted(() => {
  fetchFacturation();
});

const formatLevel = (level) => {
  if (level === "simple") return "Simple";
  if (level === "classique") return "Classique";
  if (level === "complexe") return "Complexe";
  return "-";
};
</script>

<style scoped>
.page {
  padding: 24px;
  background-color: #ffffff;
  min-height: 100vh;
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
  margin-top: 20px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 16px;
  box-shadow: 0 10px 20px rgba(15, 23, 42, 0.05);
}

.filters {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
}

.filter-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-weight: 600;
  color: #1f2937;
}

.filter-field select {
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid #cbd5e1;
  background: #ffffff;
}

.table-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.theme-block h3 {
  margin: 0 0 8px;
  color: #0f172a;
}

.table-wrap {
  overflow-x: auto;
}

.facturation-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 14px;
  background: #ffffff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: inset 0 0 0 1px #e2e8f0;
}

.facturation-table th,
.facturation-table td {
  border-bottom: 1px solid #e2e8f0;
  padding: 10px 12px;
  text-align: left;
}

.facturation-table th {
  font-weight: 700;
  color: #f8fafc;
  background: #0f2742;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.facturation-table tbody tr:nth-child(even) {
  background: #f8fafc;
}

.facturation-table tbody tr:hover {
  background: #eef2f6;
}

.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.level-simple {
  background: #dcfce7;
  color: #166534;
}

.level-classique {
  background: #e0f2fe;
  color: #0c4a6e;
}

.level-complexe {
  background: #fee2e2;
  color: #991b1b;
}

.empty-row {
  text-align: center;
  color: #64748b;
  padding: 16px 8px;
}
</style>

<template>
  <div class="page">
    <div class="card legend">
      <div class="legend-title">Legende difficulte</div>
      <div class="legend-item">
        <span class="badge level-simple">Simple</span>
        <span>
          Paramétrage effectuable à n’importe quel moment du cycle de paie, sans impact perturbateur sur la paie du mois en cours
(peut nécessiter le recyclage d’un salarié pour prise en compte).
        </span>
      </div>
      <div class="legend-item">
        <span class="badge level-classique">Classique</span>
        <span>
          Paramétrage plus complexe, pouvant être effectué pour la paie du mois en cours, à condition notamment que la demande complète ait été recueillie avant la date de release et dans le respect du format attendu.
        </span>
      </div>
      <div class="legend-item">
        <span class="badge level-complexe">Complexe</span>
        <span>
          Paramétrage complexe dont la réalisation sera de préférence reportée au mois prochain, avec régularisation du M-1.
        </span>
      </div>
    </div>

    <div class="gta-card">
      <div class="gta-label">Client GTA</div>
      <div class="gta-control">
        <label class="switch">
          <input id="gta-filter" type="checkbox" v-model="hasGta" />
          <span class="slider" />
        </label>
        <span class="switch-label">
          {{ hasGta ? "Avec GTA" : "Sans GTA" }}
        </span>
      </div>
    </div>

    <div class="card filters">
      <div class="filter-field">
        <label for="theme-filter">Theme</label>
        <div ref="themeWrap" class="filter-select">
          <input
            id="theme-filter"
            v-model="themeQuery"
            type="text"
            placeholder="Tous les themes"
            autocomplete="off"
            @focus="openTheme"
            @click="openTheme"
            @input="openTheme"
          />
          <div v-if="showThemeDropdown" class="dropdown">
            <button type="button" class="dropdown-item" @click="selectTheme('')">
              Tous les themes
            </button>
            <button
              v-for="theme in filteredThemeOptions"
              :key="theme"
              type="button"
              class="dropdown-item"
              @click="selectTheme(theme)"
            >
              {{ theme }}
            </button>
            <div v-if="filteredThemeOptions.length === 0" class="dropdown-empty">
              Aucun resultat
            </div>
          </div>
        </div>
      </div>
      <div class="filter-field">
        <label for="subtheme-filter">Sous-theme</label>
        <div ref="subThemeWrap" class="filter-select">
          <input
            id="subtheme-filter"
            v-model="subThemeQuery"
            type="text"
            placeholder="Tous les sous-themes"
            autocomplete="off"
            @focus="openSubTheme"
            @click="openSubTheme"
            @input="openSubTheme"
          />
          <div v-if="showSubThemeDropdown" class="dropdown">
            <button
              type="button"
              class="dropdown-item"
              @click="selectSubTheme('')"
            >
              Tous les sous-themes
            </button>
            <button
              v-for="subTheme in filteredSubThemeOptions"
              :key="subTheme"
              type="button"
              class="dropdown-item"
              @click="selectSubTheme(subTheme)"
            >
              {{ subTheme }}
            </button>
            <div
              v-if="filteredSubThemeOptions.length === 0"
              class="dropdown-empty"
            >
              Aucun resultat
            </div>
          </div>
        </div>
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
                <th>Acteur</th>
                <th>Facturation PAIE (jours)</th>
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
                <td>
                  <span v-if="row.actors?.paie && row.actors?.gap">PAIE + GAP</span>
                  <span v-else-if="row.actors?.paie">PAIE</span>
                  <span v-else-if="row.actors?.gap">GAP</span>
                  <span v-else>-</span>
                </td>
                <td>{{ row.pay || "-" }}</td>
                <td>{{ row.gapDays || "-" }}</td>
              </tr>
              <tr v-if="group.items.length === 0">
                <td colspan="5" class="empty-row">Aucun sous-theme.</td>
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
import { ref, computed, onMounted, onBeforeUnmount, watch } from "vue";
import api from "../services/api";

const rows = ref([]);
const loading = ref(false);
const error = ref("");

const themeWrap = ref(null);
const subThemeWrap = ref(null);
const showThemeDropdown = ref(false);
const showSubThemeDropdown = ref(false);

const themeQuery = ref("");
const subThemeQuery = ref("");

const hasGta = ref(false);

const themeOptions = computed(() =>
  Array.from(new Set(rows.value.map((row) => row.theme))).sort()
);

const subThemeOptions = computed(() => {
  const themeFilter = themeQuery.value.trim().toLowerCase();
  const subset = themeFilter
    ? rows.value.filter((row) => row.theme.toLowerCase().includes(themeFilter))
    : rows.value;
  return Array.from(new Set(subset.map((row) => row.subTheme))).sort();
});

const filteredThemeOptions = computed(() => {
  const query = themeQuery.value.trim().toLowerCase();
  if (!query) return themeOptions.value;
  return themeOptions.value.filter((theme) =>
    theme.toLowerCase().includes(query)
  );
});

const filteredSubThemeOptions = computed(() => {
  const query = subThemeQuery.value.trim().toLowerCase();
  if (!query) return subThemeOptions.value;
  return subThemeOptions.value.filter((subTheme) =>
    subTheme.toLowerCase().includes(query)
  );
});

const filteredRows = computed(() =>
  rows.value.filter((row) => {
    const themeFilter = themeQuery.value.trim().toLowerCase();
    const subThemeFilter = subThemeQuery.value.trim().toLowerCase();
    const themeMatch = themeFilter
      ? row.theme.toLowerCase().includes(themeFilter)
      : true;
    const subThemeMatch = subThemeFilter
      ? row.subTheme.toLowerCase().includes(subThemeFilter)
      : true;
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

const openTheme = () => {
  showThemeDropdown.value = true;
};

const openSubTheme = () => {
  showSubThemeDropdown.value = true;
};

const selectTheme = (value) => {
  themeQuery.value = value || "";
  showThemeDropdown.value = false;
};

const selectSubTheme = (value) => {
  subThemeQuery.value = value || "";
  showSubThemeDropdown.value = false;
};

const handleClickOutside = (event) => {
  const themeEl = themeWrap.value;
  const subThemeEl = subThemeWrap.value;

  if (themeEl && !themeEl.contains(event.target)) {
    showThemeDropdown.value = false;
  }

  if (subThemeEl && !subThemeEl.contains(event.target)) {
    showSubThemeDropdown.value = false;
  }
};

watch(themeQuery, () => {
  const subThemeFilter = subThemeQuery.value.trim().toLowerCase();
  if (
    subThemeFilter &&
    !filteredSubThemeOptions.value.some(
      (subTheme) => subTheme.toLowerCase() === subThemeFilter
    )
  ) {
    subThemeQuery.value = "";
  }
});

onMounted(() => {
  fetchFacturation();
  document.addEventListener("click", handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleClickOutside);
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

.filter-field input,
.filter-field select {
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid #cbd5e1;
  background: #ffffff;
}

.filter-field input,
.filter-field select {
  font-weight: 500;
}

.switch {
  position: relative;
  display: inline-flex;
  width: 44px;
  height: 24px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  inset: 0;
  background: #e2e8f0;
  border-radius: 999px;
  transition: background 0.2s ease;
}

.slider::before {
  content: "";
  position: absolute;
  height: 18px;
  width: 18px;
  left: 3px;
  top: 3px;
  background: #ffffff;
  border-radius: 50%;
  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.2);
  transition: transform 0.2s ease;
}

.switch input:checked + .slider {
  background: #0f2742;
}

.switch input:checked + .slider::before {
  transform: translateX(20px);
}

.switch-label {
  font-size: 12px;
  color: #475569;
  font-weight: 600;
}

.filter-select {
  position: relative;
}

.dropdown {
  position: absolute;
  left: 0;
  top: calc(100% + 6px);
  width: 100%;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.12);
  padding: 6px;
  z-index: 10;
  max-height: 220px;
  overflow-y: auto;
}

.dropdown-item {
  width: 100%;
  text-align: left;
  border: none;
  background: transparent;
  padding: 8px 10px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  color: #0f172a;
}

.dropdown-item:hover {
  background: #f1f5f9;
}

.dropdown-empty {
  padding: 8px 10px;
  color: #64748b;
  font-size: 13px;
}

.table-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.legend {
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 12px;
}

.legend-title {
  font-weight: 700;
  color: #0f172a;
  text-transform: uppercase;
  font-size: 12px;
  letter-spacing: 0.06em;
}

.legend-item {
  display: grid;
  grid-template-columns: 90px 1fr;
  gap: 12px;
  font-size: 13px;
  color: #1f2937;
  line-height: 1.4;
}

.gta-card {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 16px;
  margin-top: 40px;
}

.gta-label {
  font-weight: 700;
  color: #0f172a;
}

.gta-control {
  display: inline-flex;
  align-items: center;
  gap: 10px;
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
  table-layout: fixed;
}

.facturation-table th,
.facturation-table td {
  border-bottom: 1px solid #e2e8f0;
  padding: 10px 12px;
  text-align: left;
}

.facturation-table th:nth-child(2),
.facturation-table td:nth-child(2) {
  width: 140px;
}

.facturation-table th:nth-child(3),
.facturation-table td:nth-child(3) {
  width: 140px;
}

.facturation-table th:nth-child(4),
.facturation-table td:nth-child(4) {
  width: 160px;
}

.facturation-table th:nth-child(5),
.facturation-table td:nth-child(5) {
  width: 170px;
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
  width: 90px;
}

.level-simple {
  background: #f8f2e9;
  color: #5c3b06;
}

.level-classique {
  background: #f3e7cf;
  color: #6b4e11;
}

.level-complexe {
  background: #f1d98f;
  color: #6b4c05;
}

.empty-row {
  text-align: center;
  color: #64748b;
  padding: 16px 8px;
}
</style>

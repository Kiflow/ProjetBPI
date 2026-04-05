<template>
  <div class="page">

    <!-- HEADER -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">Facturation</h1>
        <p class="page-sub">Grille de facturation PAIE &amp; GAP par thème</p>
      </div>
      <div class="header-right">
        <!-- GTA toggle -->
        <div class="gta-toggle">
          <span class="gta-label">Client GTA</span>
          <label class="switch">
            <input id="gta-filter" type="checkbox" v-model="hasGta" />
            <span class="slider" />
          </label>
          <span class="switch-text" :class="{ active: hasGta }">{{ hasGta ? 'Avec GTA' : 'Sans GTA' }}</span>
        </div>
      </div>
    </div>

    <!-- LEGEND -->
    <div class="legend-bar">
      <span class="legend-label">Légende</span>
      <div class="legend-items">
        <div class="legend-item">
          <span class="badge level-simple">Simple</span>
          <span class="legend-desc">Paramétrage effectuable à tout moment, sans impact sur la paie en cours.</span>
        </div>
        <div class="legend-item">
          <span class="badge level-classique">Classique</span>
          <span class="legend-desc">Paramétrage complexe réalisable dans le mois si la demande est reçue avant la date de release.</span>
        </div>
        <div class="legend-item">
          <span class="badge level-complexe">Complexe</span>
          <span class="legend-desc">Paramétrage à reporter au mois prochain avec régularisation M-1.</span>
        </div>
      </div>
    </div>

    <!-- FILTERS -->
    <div class="filters-bar">
      <div class="filter-field">
        <label class="filter-label" for="theme-filter">
          <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M2.628 1.601C5.028 1.206 7.49 1 10 1s4.973.206 7.372.601a.75.75 0 0 1 .628.74v2.288a2.25 2.25 0 0 1-.659 1.59l-4.682 4.683a2.25 2.25 0 0 0-.659 1.59v3.037c0 .684-.31 1.33-.844 1.757l-1.937 1.55A.75.75 0 0 1 8 18.25v-5.757a2.25 2.25 0 0 0-.659-1.591L2.659 6.22A2.25 2.25 0 0 1 2 4.629V2.34a.75.75 0 0 1 .628-.74Z" clip-rule="evenodd"/></svg>
          Thème
        </label>
        <div ref="themeWrap" class="filter-select">
          <input
            id="theme-filter"
            v-model="themeQuery"
            type="text"
            placeholder="Tous les thèmes"
            autocomplete="off"
            @focus="openTheme"
            @click="openTheme"
            @input="openTheme"
          />
          <div v-if="showThemeDropdown" class="dropdown">
            <button type="button" class="dropdown-item" @click="selectTheme('')">Tous les thèmes</button>
            <button v-for="theme in filteredThemeOptions" :key="theme" type="button" class="dropdown-item" @click="selectTheme(theme)">{{ theme }}</button>
            <div v-if="!filteredThemeOptions.length" class="dropdown-empty">Aucun résultat</div>
          </div>
        </div>
      </div>

      <div class="filter-field">
        <label class="filter-label" for="subtheme-filter">
          <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M2.628 1.601C5.028 1.206 7.49 1 10 1s4.973.206 7.372.601a.75.75 0 0 1 .628.74v2.288a2.25 2.25 0 0 1-.659 1.59l-4.682 4.683a2.25 2.25 0 0 0-.659 1.59v3.037c0 .684-.31 1.33-.844 1.757l-1.937 1.55A.75.75 0 0 1 8 18.25v-5.757a2.25 2.25 0 0 0-.659-1.591L2.659 6.22A2.25 2.25 0 0 1 2 4.629V2.34a.75.75 0 0 1 .628-.74Z" clip-rule="evenodd"/></svg>
          Sous-thème
        </label>
        <div ref="subThemeWrap" class="filter-select">
          <input
            id="subtheme-filter"
            v-model="subThemeQuery"
            type="text"
            placeholder="Tous les sous-thèmes"
            autocomplete="off"
            @focus="openSubTheme"
            @click="openSubTheme"
            @input="openSubTheme"
          />
          <div v-if="showSubThemeDropdown" class="dropdown">
            <button type="button" class="dropdown-item" @click="selectSubTheme('')">Tous les sous-thèmes</button>
            <button v-for="sub in filteredSubThemeOptions" :key="sub" type="button" class="dropdown-item" @click="selectSubTheme(sub)">{{ sub }}</button>
            <div v-if="!filteredSubThemeOptions.length" class="dropdown-empty">Aucun résultat</div>
          </div>
        </div>
      </div>

      <div class="filter-results">
        <span v-if="!loading">{{ totalRows }} résultat{{ totalRows !== 1 ? 's' : '' }}</span>
      </div>
    </div>

    <!-- CONTENT -->
    <div v-if="loading" class="state-msg">
      <svg class="spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#e2e8f0" stroke-width="3"/><path d="M12 2a10 10 0 0 1 10 10" stroke="#1a3a5c" stroke-width="3" stroke-linecap="round"/></svg>
      Chargement…
    </div>
    <div v-else-if="error" class="state-msg state-error">{{ error }}</div>
    <div v-else-if="!groupedRows.length" class="state-msg">Aucun résultat pour ce filtre.</div>

    <div v-else class="themes-list">
      <div v-for="group in groupedRows" :key="group.theme" class="theme-block">
        <div class="theme-header">
          <span class="theme-name">{{ group.theme }}</span>
          <span class="theme-count">{{ group.items.length }} ligne{{ group.items.length !== 1 ? 's' : '' }}</span>
        </div>
        <div class="table-wrap">
          <table class="fact-table">
            <thead>
              <tr>
                <th>Sous-thème</th>
                <th>Difficulté</th>
                <th>Acteur</th>
                <th>Facturation PAIE (j)</th>
                <th>Facturation GAP (j)</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in group.items" :key="row.id">
                <td class="col-sub">{{ row.subTheme }}</td>
                <td>
                  <span v-if="row.level" :class="['badge', `level-${row.level}`]">{{ formatLevel(row.level) }}</span>
                  <span v-else class="dash">—</span>
                </td>
                <td>
                  <span v-if="row.actors?.paie && row.actors?.gap" class="actor-chip both">PAIE + GAP</span>
                  <span v-else-if="row.actors?.paie" class="actor-chip paie">PAIE</span>
                  <span v-else-if="row.actors?.gap" class="actor-chip gap">GAP</span>
                  <span v-else class="dash">—</span>
                </td>
                <td class="col-num">{{ row.pay || '—' }}</td>
                <td class="col-num">{{ row.gapDays || '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
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
  return themeOptions.value.filter((theme) => theme.toLowerCase().includes(query));
});

const filteredSubThemeOptions = computed(() => {
  const query = subThemeQuery.value.trim().toLowerCase();
  if (!query) return subThemeOptions.value;
  return subThemeOptions.value.filter((subTheme) => subTheme.toLowerCase().includes(query));
});

const filteredRows = computed(() =>
  rows.value.filter((row) => {
    const themeFilter = themeQuery.value.trim().toLowerCase();
    const subThemeFilter = subThemeQuery.value.trim().toLowerCase();
    const themeMatch = themeFilter ? row.theme.toLowerCase().includes(themeFilter) : true;
    const subThemeMatch = subThemeFilter ? row.subTheme.toLowerCase().includes(subThemeFilter) : true;
    return themeMatch && subThemeMatch;
  })
);

const groupedRows = computed(() => {
  const groups = new Map();
  filteredRows.value.forEach((row) => {
    if (!groups.has(row.theme)) groups.set(row.theme, []);
    groups.get(row.theme).push(row);
  });
  return Array.from(groups.entries()).map(([theme, items]) => ({ theme, items }));
});

const totalRows = computed(() => filteredRows.value.length);

const fetchFacturation = async () => {
  loading.value = true;
  error.value = "";
  try {
    const res = await api.get("/facturation");
    rows.value = Array.isArray(res.data) ? res.data : [];
  } catch (err) {
    error.value = "Impossible de charger les données de facturation.";
    rows.value = [];
  } finally {
    loading.value = false;
  }
};

const openTheme = () => { showThemeDropdown.value = true; };
const openSubTheme = () => { showSubThemeDropdown.value = true; };
const selectTheme = (value) => { themeQuery.value = value || ""; showThemeDropdown.value = false; };
const selectSubTheme = (value) => { subThemeQuery.value = value || ""; showSubThemeDropdown.value = false; };

const handleClickOutside = (event) => {
  if (themeWrap.value && !themeWrap.value.contains(event.target)) showThemeDropdown.value = false;
  if (subThemeWrap.value && !subThemeWrap.value.contains(event.target)) showSubThemeDropdown.value = false;
};

watch(themeQuery, () => {
  const subThemeFilter = subThemeQuery.value.trim().toLowerCase();
  if (subThemeFilter && !filteredSubThemeOptions.value.some((s) => s.toLowerCase() === subThemeFilter)) {
    subThemeQuery.value = "";
  }
});

onMounted(() => { fetchFacturation(); document.addEventListener("click", handleClickOutside); });
onBeforeUnmount(() => { document.removeEventListener("click", handleClickOutside); });

const formatLevel = (level) => {
  if (level === "simple") return "Simple";
  if (level === "classique") return "Classique";
  if (level === "complexe") return "Complexe";
  return "-";
};
</script>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin: -24px;
  padding: 24px;
  min-height: calc(100% + 48px);
  background: #f8fafc;
  box-sizing: border-box;
}

/* ── HEADER ───────────── */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}
.page-title { font-size: 20px; font-weight: 700; color: #0f172a; margin: 0; }
.page-sub { font-size: 13px; color: #64748b; margin: 2px 0 0; }

.gta-toggle {
  display: flex; align-items: center; gap: 10px;
  background: #fff; border: 1px solid #e2e8f0; border-radius: 8px;
  padding: 8px 14px;
}
.gta-label { font-size: 12px; font-weight: 700; color: #475569; }
.switch { position: relative; display: inline-flex; width: 40px; height: 22px; flex-shrink: 0; }
.switch input { opacity: 0; width: 0; height: 0; }
.slider { position: absolute; inset: 0; background: #e2e8f0; border-radius: 999px; transition: background 0.2s; cursor: pointer; }
.slider::before { content: ""; position: absolute; width: 16px; height: 16px; left: 3px; top: 3px; background: #fff; border-radius: 50%; box-shadow: 0 1px 4px rgba(0,0,0,0.2); transition: transform 0.2s; }
.switch input:checked + .slider { background: #1a3a5c; }
.switch input:checked + .slider::before { transform: translateX(18px); }
.switch-text { font-size: 12px; font-weight: 600; color: #94a3b8; }
.switch-text.active { color: #1a3a5c; }

/* ── LEGEND ───────────── */
.legend-bar {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px 16px;
  flex-wrap: wrap;
}
.legend-label {
  font-size: 11px; font-weight: 700; color: #94a3b8;
  text-transform: uppercase; letter-spacing: 0.08em;
  white-space: nowrap; padding-top: 2px;
}
.legend-items { display: flex; flex-direction: column; gap: 8px; flex: 1; }
.legend-item { display: flex; align-items: baseline; gap: 12px; }
.legend-desc { font-size: 12px; color: #64748b; line-height: 1.5; }

/* ── FILTERS ──────────── */
.filters-bar {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px 16px;
  flex-wrap: wrap;
}
.filter-field { display: flex; flex-direction: column; gap: 5px; min-width: 200px; flex: 1; }
.filter-label {
  display: flex; align-items: center; gap: 5px;
  font-size: 12px; font-weight: 600; color: #475569;
}
.filter-label svg { width: 12px; height: 12px; }
.filter-select { position: relative; }
.filter-select input {
  width: 100%; padding: 7px 10px;
  border: 1px solid #e2e8f0; border-radius: 7px;
  font-size: 13px; background: #f8fafc; box-sizing: border-box;
}
.filter-select input:focus { outline: none; border-color: #93c5fd; background: #fff; }

.dropdown {
  position: absolute; left: 0; top: calc(100% + 4px); width: 100%;
  background: #fff; border: 1px solid #e2e8f0; border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.1); padding: 4px; z-index: 50;
  max-height: 220px; overflow-y: auto;
}
.dropdown-item {
  width: 100%; text-align: left; border: none; background: transparent;
  padding: 7px 10px; border-radius: 6px; cursor: pointer;
  font-size: 13px; color: #1e293b;
}
.dropdown-item:hover { background: #f1f5f9; }
.dropdown-empty { padding: 8px 10px; color: #94a3b8; font-size: 12px; }

.filter-results {
  font-size: 12px; color: #94a3b8; font-weight: 600;
  white-space: nowrap; padding-bottom: 8px;
}

/* ── STATE ────────────── */
.state-msg {
  display: flex; align-items: center; justify-content: center; gap: 10px;
  padding: 48px; color: #94a3b8; font-size: 14px;
  background: #fff; border: 1px solid #e2e8f0; border-radius: 8px;
}
.state-error { color: #dc2626; }
.spin { width: 20px; height: 20px; animation: spin 1s linear infinite; flex-shrink: 0; }
@keyframes spin { to { transform: rotate(360deg); } }

/* ── THEMES ───────────── */
.themes-list { display: flex; flex-direction: column; gap: 12px; }

.theme-block { background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }

.theme-header {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  padding: 10px 16px; background: #1a3a5c; border-bottom: 1px solid #e2e8f0;
}
.theme-name { font-size: 13px; font-weight: 700; color: #fff; text-transform: uppercase; letter-spacing: 0.04em; }
.theme-count { font-size: 11px; color: #93c5fd; font-weight: 600; }

.table-wrap { overflow-x: auto; }

.fact-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.fact-table th {
  padding: 8px 14px; text-align: left;
  font-size: 11px; font-weight: 700; color: #94a3b8;
  text-transform: uppercase; letter-spacing: 0.06em;
  border-bottom: 1px solid #f1f5f9; background: #f8fafc;
}
.fact-table td { padding: 10px 14px; border-bottom: 1px solid #f8fafc; color: #1e293b; }
.fact-table tbody tr:last-child td { border-bottom: none; }
.fact-table tbody tr:hover td { background: #f8fbff; }

.col-sub { font-weight: 500; max-width: 300px; }
.col-num { font-weight: 600; color: #1a3a5c; text-align: center; }
.dash { color: #cbd5e1; }

/* ── BADGES ───────────── */
.badge {
  display: inline-flex; align-items: center; justify-content: center;
  padding: 3px 10px; border-radius: 20px;
  font-size: 11px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.04em; white-space: nowrap;
}
.level-simple   { background: #f8f2e9; color: #5c3b06; }
.level-classique { background: #f3e7cf; color: #6b4e11; }
.level-complexe { background: #f1d98f; color: #6b4c05; }

/* ── ACTOR CHIPS ──────── */
.actor-chip {
  display: inline-flex; align-items: center;
  padding: 3px 8px; border-radius: 6px;
  font-size: 11px; font-weight: 700;
}
.actor-chip.both { background: #ede9fe; color: #5b21b6; }
.actor-chip.paie { background: #dbeafe; color: #1d4ed8; }
.actor-chip.gap  { background: #dcfce7; color: #166534; }
</style>

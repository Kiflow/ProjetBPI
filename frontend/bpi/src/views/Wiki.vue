<template>
  <div class="page">
    <div class="layout">
      <div class="stack">
        <form class="card group-card" @submit.prevent="saveGroup">
          <div class="card-header">
            <div>
              <h3>Creer un groupe</h3>
              <p class="hint">Organisez vos wikis par groupe.</p>
            </div>
            <span class="section-tag">Groupe</span>
          </div>

          <label class="field">
            <span>Nom du groupe</span>
            <input v-model="groupForm.name" type="text" placeholder="Ex: Sociétés" />
          </label>

          <p v-if="groupError" class="error">{{ groupError }}</p>

          <div class="actions">
            <button type="submit" class="primary">Ajouter le groupe</button>
          </div>
        </form>

        <form class="card add-card" @submit.prevent="saveWiki">
          <div class="card-header">
            <div>
              <h3>{{ isEditing ? "Modifier un wiki" : "Ajouter un wiki" }}</h3>
            </div>
            <span class="section-tag">Wiki</span>
          </div>

          <div class="form-grid">
            <label class="field">
              <span>Groupe</span>
              <select v-model="form.groupId">
                <option value="">Sans groupe</option>
                <option v-for="group in groups" :key="group.id" :value="group.id">
                  {{ group.name }}
                </option>
              </select>
            </label>

            <label class="field">
              <span>Nom du wiki</span>
              <input v-model="form.name" type="text" placeholder="Ex: Société par dupli" />
            </label>
          </div>

          <label class="field link-field">
            <span>Lien du wiki</span>
            <div class="link-input">
              <span class="link-prefix">https://</span>
              <input v-model="form.url" type="url" placeholder="lien du wiki..." />
            </div>
          </label>

          <p v-if="error" class="error">{{ error }}</p>

          <div class="actions">
            <button type="submit" class="primary">
              {{ isEditing ? "Enregistrer" : "Ajouter" }}
            </button>
            <button v-if="isEditing" type="button" class="ghost" @click="cancelEdit">
              Annuler
            </button>
          </div>
        </form>
      </div>

      <div class="card list-card">
        <div class="list-header">
          <h3>Mes wikis</h3>
          <p class="hint">{{ wikis.length }} lien(s)</p>
        </div>

        <div v-if="groupedWikis.length === 0" class="empty-row">
          Aucun wiki pour le moment.
        </div>

        <div class="wiki-list">
            <div
              v-for="group in groupedWikis"
              :key="group.key"
              class="group-block"
              @dragover.prevent
              @drop="handleDrop($event, group.id)"
            >
              <div class="group-header">
                <div class="group-title">
                  <h4>{{ group.label }}</h4>
                  <span class="group-count">{{ group.items.length }} lien(s)</span>
                </div>
                <span
                  v-if="group.canRemove"
                  class="icon-action icon-danger"
                  role="button"
                  tabindex="0"
                  title="Supprimer le groupe"
                  aria-label="Supprimer le groupe"
                  @click="removeGroup(group.id)"
                  @keydown.enter.prevent="removeGroup(group.id)"
                  @keydown.space.prevent="removeGroup(group.id)"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      d="M6 7h12l-1 13a2 2 0 01-2 2H9a2 2 0 01-2-2L6 7zm3-3h6l1 2H8l1-2zm2 6v8h2v-8h-2zm-4 0v8h2v-8H7zm8 0v8h2v-8h-2z"
                    />
                  </svg>
                </span>
              </div>
              <div class="table-wrap">
                <table class="wiki-table">
                  <tbody>
                    <tr
                      v-for="wiki in group.items"
                      :key="wiki.id"
                      draggable="true"
                      @dragstart="handleDragStart($event, wiki.id)"
                    >
                      <td class="name-cell">{{ wiki.name }}</td>
                      <td class="actions-cell">
                        <a
                          class="open-link"
                          :href="wiki.url"
                          target="_blank"
                          rel="noreferrer"
                        >
                          Ouvrir
                        </a>
                        <span
                          class="icon-action"
                          role="button"
                          tabindex="0"
                          title="Modifier"
                          aria-label="Modifier"
                          @click="editWiki(wiki)"
                          @keydown.enter.prevent="editWiki(wiki)"
                          @keydown.space.prevent="editWiki(wiki)"
                        >
                          <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path
                              d="M3 17.25V21h3.75l11-11.03-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"
                            />
                          </svg>
                        </span>
                        <span
                          class="icon-action icon-danger"
                          role="button"
                          tabindex="0"
                          title="Supprimer"
                          aria-label="Supprimer"
                          @click="removeWiki(wiki.id)"
                          @keydown.enter.prevent="removeWiki(wiki.id)"
                          @keydown.space.prevent="removeWiki(wiki.id)"
                        >
                          <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path
                              d="M6 7h12l-1 13a2 2 0 01-2 2H9a2 2 0 01-2-2L6 7zm3-3h6l1 2H8l1-2zm2 6v8h2v-8h-2zm-4 0v8h2v-8H7zm8 0v8h2v-8h-2z"
                            />
                          </svg>
                        </span>
                      </td>
                    </tr>
                    <tr v-if="group.items.length === 0">
                      <td colspan="2" class="empty-row">Deposez un wiki ici.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from "vue";
import api from "../services/api";

const STORAGE_KEY = "wiki-items";
const GROUP_STORAGE_KEY = "wiki-groups";

const wikis = ref([]);
const groups = ref([]);
const error = ref("");
const groupError = ref("");
const editingId = ref(null);

const form = ref({
  groupId: "",
  name: "",
  url: ""
});

const groupForm = ref({
  name: ""
});

const isEditing = computed(() => editingId.value !== null);
const DEFAULT_GROUP = "Sans groupe";

const groupedWikis = computed(() => {
  const groupMap = new Map(
    groups.value.map((group) => [
      group.id,
      {
        key: group.id,
        id: group.id,
        label: group.name,
        items: [],
        canRemove: true
      }
    ])
  );

  const ungrouped = {
    key: "ungrouped",
    id: null,
    label: DEFAULT_GROUP,
    items: [],
    canRemove: false
  };

  wikis.value.forEach((wiki) => {
    const target =
      wiki.groupId && groupMap.has(wiki.groupId)
        ? groupMap.get(wiki.groupId)
        : ungrouped;
    target.items.push(wiki);
  });

  const sortedGroups = Array.from(groupMap.values())
    .map((group) => ({
      ...group,
      items: group.items.slice().sort((a, b) => a.name.localeCompare(b.name))
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  if (ungrouped.items.length > 0 || sortedGroups.length === 0) {
    sortedGroups.push({
      ...ungrouped,
      items: ungrouped.items.slice().sort((a, b) => a.name.localeCompare(b.name))
    });
  }

  return sortedGroups;
});

const loadGroups = () => {
  const raw = localStorage.getItem(GROUP_STORAGE_KEY);
  if (!raw) {
    groups.value = [];
    return;
  }
  try {
    groups.value = JSON.parse(raw) ?? [];
  } catch {
    groups.value = [];
  }
};

const loadWikis = () => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    wikis.value = [];
    return;
  }
  try {
    wikis.value = JSON.parse(raw) ?? [];
  } catch {
    wikis.value = [];
  }

  migrateThemesToGroups();
};

onMounted(() => {
  loadGroups();
  loadWikis();
});

watch(
  wikis,
  (value) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  },
  { deep: true }
);

watch(
  groups,
  (value) => {
    localStorage.setItem(GROUP_STORAGE_KEY, JSON.stringify(value));
  },
  { deep: true }
);

const migrateThemesToGroups = () => {
  let updated = false;
  const existingGroupByName = new Map(
    groups.value.map((group) => [group.name.toLowerCase(), group])
  );

  const nextGroups = [...groups.value];
  const nextWikis = wikis.value.map((wiki) => {
    if (wiki.groupId || !wiki.theme) return wiki;
    const themeName = String(wiki.theme).trim();
    if (!themeName) return wiki;

    const key = themeName.toLowerCase();
    let group = existingGroupByName.get(key);
    if (!group) {
      group = {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        name: themeName
      };
      existingGroupByName.set(key, group);
      nextGroups.push(group);
    }

    updated = true;
    const { theme, ...rest } = wiki;
    return {
      ...rest,
      groupId: group.id
    };
  });

  if (updated) {
    groups.value = nextGroups;
    wikis.value = nextWikis;
  }
};

const resetForm = () => {
  form.value = {
    groupId: "",
    name: "",
    url: ""
  };
  editingId.value = null;
  error.value = "";
};

const resetGroupForm = () => {
  groupForm.value = { name: "" };
  groupError.value = "";
};

const normalizeUrl = (value) => (value || "").trim();

const saveGroup = () => {
  groupError.value = "";
  const name = (groupForm.value.name || "").trim();
  if (!name) {
    groupError.value = "Veuillez renseigner un nom de groupe.";
    return;
  }
  const exists = groups.value.some(
    (group) => group.name.toLowerCase() === name.toLowerCase()
  );
  if (exists) {
    groupError.value = "Ce groupe existe deja.";
    return;
  }

  groups.value = [
    ...groups.value,
    {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      name
    }
  ];
  resetGroupForm();
};

const fetchPageTitle = async (url) => {
  try {
    const res = await api.get("/metadata", { params: { url } });
    return res.data?.title || "";
  } catch {
    return "";
  }
};

const saveWiki = async () => {
  error.value = "";
  let name = (form.value.name || "").trim();
  let url = normalizeUrl(form.value.url);
  const groupId = form.value.groupId || null;

  if (!url) {
    error.value = "Veuillez renseigner le lien du wiki.";
    return;
  }

  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }

  if (!name) {
    const title = await fetchPageTitle(url);
    if (title) {
      name = title;
    } else {
      try {
        name = new URL(url).hostname.replace(/^www\./, "");
      } catch {
        name = url;
      }
    }
  }

  if (editingId.value) {
    wikis.value = wikis.value.map((wiki) => {
      if (wiki.id !== editingId.value) return wiki;
      return {
        ...wiki,
        name,
        url,
        groupId
      };
    });
  } else {
    wikis.value = [
      ...wikis.value,
      {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        name,
        url,
        groupId
      }
    ];
  }

  resetForm();
};

const editWiki = (wiki) => {
  form.value = {
    groupId: wiki.groupId || "",
    name: wiki.name || "",
    url: wiki.url || ""
  };
  editingId.value = wiki.id;
};

const cancelEdit = () => {
  resetForm();
};

const removeWiki = (id) => {
  const confirmRemove = window.confirm("Supprimer ce wiki ?");
  if (!confirmRemove) return;
  wikis.value = wikis.value.filter((wiki) => wiki.id !== id);
  if (editingId.value === id) {
    resetForm();
  }
};

const removeGroup = (groupId) => {
  const group = groups.value.find((item) => item.id === groupId);
  if (!group) return;
  const confirmRemove = window.confirm(
    `Supprimer le groupe "${group.name}" ? Les wikis seront deplaces en "Sans groupe".`
  );
  if (!confirmRemove) return;
  groups.value = groups.value.filter((item) => item.id !== groupId);
  wikis.value = wikis.value.map((wiki) => {
    if (wiki.groupId !== groupId) return wiki;
    return {
      ...wiki,
      groupId: null
    };
  });
};

const handleDragStart = (event, wikiId) => {
  event.dataTransfer.setData("text/wiki-id", wikiId);
  event.dataTransfer.effectAllowed = "move";
};

const handleDrop = (event, groupId) => {
  const wikiId = event.dataTransfer.getData("text/wiki-id");
  if (!wikiId) return;
  wikis.value = wikis.value.map((wiki) => {
    if (wiki.id !== wikiId) return wiki;
    return {
      ...wiki,
      groupId
    };
  });
};
</script>

<style scoped>
.page {
  padding: 24px;
  background: #ffffff;
  min-height: 100vh;
}

.layout {
  display: grid;
  grid-template-columns: minmax(260px, 340px) 1fr;
  gap: 20px;
  margin-top: 16px;
}

.card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.08);
}

.card h3 {
  margin: 0 0 6px;
  color: #0f172a;
  font-size: 18px;
}

.group-card,
.add-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.stack {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.add-card .card-header,
.group-card .card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
}

.group-card {
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
}

.add-card {
  background: linear-gradient(180deg, #ffffff 0%, #eef2f6 100%);
}

.section-tag {
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 6px 10px;
  border-radius: 999px;
  background: #0f2742;
  color: #ffffff;
  font-weight: 700;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.list-card h3 {
  margin-bottom: 0;
}

.list-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-weight: 600;
  color: #1f2937;
}

.field input,
.field select {
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid #cbd5e1;
  background: #ffffff;
}

.field input:focus,
.field select:focus {
  outline: none;
  border-color: #0f2742;
  box-shadow: 0 0 0 3px rgba(15, 39, 66, 0.12);
}

.link-field .link-input {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 2px 8px;
}

.link-field input {
  border: none;
  padding: 8px 4px;
  flex: 1;
}

.link-field input:focus {
  outline: none;
}

.link-prefix {
  font-size: 12px;
  color: #64748b;
  font-weight: 700;
}

.actions {
  display: flex;
  align-items: center;
  gap: 14px;
}

.primary {
  border: none;
  background: #0f2742;
  color: #ffffff;
  padding: 10px 14px;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 700;
  box-shadow: 0 8px 18px rgba(15, 39, 66, 0.2);
}

.primary:hover {
  filter: brightness(1.05);
}

.ghost {
  border: 1px solid #cbd5e1;
  background: #ffffff;
  color: #0f172a;
  padding: 8px 12px;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
}

.danger {
  border: 1px solid #f2caca;
  background: #fee2e2;
  color: #991b1b;
  padding: 8px 12px;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
}

.hint {
  font-size: 12px;
  color: #64748b;
  margin: 0;
}

.error {
  color: #d14343;
  font-weight: 600;
  margin: 0;
}

.table-wrap {
  overflow-x: auto;
}

.wiki-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.group-block {
  margin-top: 16px;
  border: 1px dashed #cbd5e1;
  border-radius: 12px;
  padding: 10px;
  background: #f8fafc;
}

.group-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: 8px 0 6px;
}

.group-title {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.group-header h4 {
  margin: 0;
  font-size: 14px;
  color: #0f172a;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.group-count {
  font-size: 12px;
  color: #64748b;
}

.wiki-table {
  width: 100%;
  margin-top: 8px;
  border-collapse: collapse;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: inset 0 0 0 1px #e2e8f0;
}

.wiki-table th,
.wiki-table td {
  text-align: left;
  border-bottom: 1px solid #e2e8f0;
  padding: 10px 12px;
}

.wiki-table thead {
  background: #0f2742;
  color: #ffffff;
}

.wiki-table th {
  font-size: 12px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  font-weight: 700;
}

.wiki-table tbody tr:nth-child(even) {
  background: #f8fafc;
}

.wiki-table tbody tr:hover {
  background: #eef2f6;
}

.wiki-table tbody tr[draggable="true"] {
  cursor: grab;
}

.name-cell {
  font-weight: 700;
  color: #0f172a;
}

.open-link {
  color: #0f2742;
  font-weight: 700;
  text-decoration: underline;
}

.actions-cell {
  display: flex;
  gap: 6px;
  align-items: center;
  justify-content: flex-end;
}

.icon-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #0f172a;
  background: transparent;
  border: none;
  padding: 0;
}

.icon-action svg {
  width: 18px;
  height: 18px;
  fill: currentColor;
}

.icon-action:focus-visible {
  outline: 2px solid #0f2742;
  outline-offset: 2px;
  border-radius: 6px;
}

.icon-action.icon-danger {
  color: #991b1b;
}

.icon-action.icon-danger svg {
  color: #991b1b;
}

.empty-row {
  text-align: center;
  color: #64748b;
  padding: 16px 8px;
}

@media (max-width: 1024px) {
  .layout {
    grid-template-columns: 1fr;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

}
</style>

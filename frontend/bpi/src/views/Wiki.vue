<template>
  <div class="page">
    <div class="page-inner">
      <header class="page-hero">
        <div class="hero-main">
          <div class="hero-text">
            <p class="hero-eyebrow">Utilitaire</p>
            <h1>Mes wikis</h1>
            <p class="hero-subtitle">
              Un espace organisé et intuitif pour centraliser vos liens, wiki et raccourcis internes .
            </p>
          </div>
          <div class="hero-stats">
            <div class="stat-card">
              <span class="stat-label">Liens</span>
              <strong class="stat-value">{{ wikis.length }}</strong>
            </div>
            <div class="stat-card">
              <span class="stat-label">Groupes</span>
              <strong class="stat-value">{{ groups.length }}</strong>
            </div>
            <div class="stat-card">
              <span class="stat-label">Raccourcis</span>
              <strong class="stat-value">{{ shortcuts.length }}</strong>
            </div>
          </div>
        </div>
        <div class="shortcut-inline">
          <div class="shortcut-band-header">
            <div>
              <p class="shortcut-eyebrow">Raccourcis</p>
            </div>
            <button
              class="ghost"
              type="button"
              @click="showShortcutEditor = !showShortcutEditor"
            >
              {{ showShortcutEditor ? "Fermer" : "Gerer" }}
            </button>
          </div>

          <div class="shortcut-actions">
            <div v-for="shortcut in shortcuts" :key="shortcut.id" class="shortcut-chip">
              <a
                class="shortcut-link"
                :href="shortcut.url"
                target="_blank"
                rel="noreferrer"
              >
                <img
                  v-if="getFaviconUrl(shortcut.url)"
                  class="shortcut-logo"
                  :src="getFaviconUrl(shortcut.url)"
                  :alt="`Logo ${shortcut.title}`"
                  loading="lazy"
                />
                {{ shortcut.title }}
              </a>
              <button
                v-if="showShortcutEditor"
                type="button"
                class="chip-remove"
                @click="removeShortcut(shortcut.id)"
                aria-label="Supprimer le raccourci"
              >
                ×
              </button>
            </div>
            <p v-if="!shortcuts.length" class="empty-row">
              Ajoutez vos liens utiles hors wiki.
            </p>
          </div>

          <form v-if="showShortcutEditor" class="shortcut-form" @submit.prevent="addShortcut">
            <input
              v-model="shortcutForm.title"
              type="text"
              placeholder="Nom du lien"
              required
            />
            <input
              v-model="shortcutForm.url"
              type="url"
              placeholder="https://"
              required
            />
            <button type="submit" class="primary">Ajouter</button>
          </form>
        </div>
      </header>

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
          <div>
            <h3>Mes wikis</h3>
            <p class="hint">Glissez-deposez pour reclasser rapidement.</p>
          </div>
          <div class="list-actions">
            <input
              v-model="searchQuery"
              class="search-input"
              type="search"
              placeholder="Rechercher un wiki..."
            />
          </div>
          <p class="hint">{{ wikis.length }} lien(s)</p>
        </div>

        <div v-if="groupedWikis.length === 0" class="empty-row">
          Aucun wiki pour le moment.
        </div>

        <div class="wiki-list" @click="closeActionMenu">
          <div
            v-for="group in groupedWikis"
            :key="group.key"
            class="group-block"
            @dragover.prevent
            @drop="handleDrop($event, group.id)"
          >
            <button
              class="accordion-header"
              type="button"
              @click="toggleGroup(group.key)"
            >
              <span class="accordion-arrow">
                {{ isGroupOpen(group.key) ? "▾" : "▸" }}
              </span>
              <span class="accordion-title">
                {{ group.label }}
              </span>
              <span class="accordion-count">{{ group.items.length }} lien(s)</span>
              <span
                v-if="group.canRemove"
                class="icon-action icon-danger group-remove"
                role="button"
                tabindex="0"
                title="Supprimer le groupe"
                aria-label="Supprimer le groupe"
                @click.stop="removeGroup(group.id)"
                @keydown.enter.prevent="removeGroup(group.id)"
                @keydown.space.prevent="removeGroup(group.id)"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M6 7h12l-1 13a2 2 0 01-2 2H9a2 2 0 01-2-2L6 7zm3-3h6l1 2H8l1-2zm2 6v8h2v-8h-2zm-4 0v8h2v-8H7zm8 0v8h2v-8h-2z"
                  />
                </svg>
              </span>
            </button>

            <div v-if="isGroupOpen(group.key)" class="accordion-body">
              <ul v-if="group.items.length" class="wiki-rows">
                <li
                  v-for="wiki in group.items"
                  :key="wiki.id"
                  class="wiki-row"
                  draggable="true"
                  @dragstart="handleDragStart($event, wiki.id)"
                  @click.stop
                >
                  <span class="wiki-name">{{ wiki.name }}</span>
                  <span class="wiki-url">{{ wiki.url }}</span>
                  <div class="wiki-right">
                    <a
                      class="open-link"
                      :href="wiki.url"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Ouvrir
                    </a>
                    <div class="wiki-actions">
                      <button
                        type="button"
                        class="action-ellipsis"
                        aria-label="Actions"
                        @click.stop="toggleActionMenu(wiki.id)"
                      >
                        ...
                      </button>
                      <div
                        v-if="actionMenuId === wiki.id"
                        class="action-menu"
                        @click.stop
                      >
                        <button
                          type="button"
                          class="icon-action"
                          title="Modifier"
                          aria-label="Modifier"
                          @click="editWiki(wiki)"
                        >
                          <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path
                              d="M3 17.25V21h3.75l11-11.03-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"
                            />
                          </svg>
                        </button>
                        <button
                          type="button"
                          class="icon-action icon-danger"
                          title="Supprimer"
                          aria-label="Supprimer"
                          @click="removeWiki(wiki.id)"
                        >
                          <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path
                              d="M6 7h12l-1 13a2 2 0 01-2 2H9a2 2 0 01-2-2L6 7zm3-3h6l1 2H8l1-2zm2 6v8h2v-8h-2zm-4 0v8h2v-8H7zm8 0v8h2v-8h-2z"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              </ul>
              <p v-else class="empty-row">Deposez un wiki ici.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import api from "../services/api";

const wikis = ref([]);
const groups = ref([]);
const shortcuts = ref([]);
const showShortcutEditor = ref(false);
const error = ref("");
const groupError = ref("");
const editingId = ref(null);
const openGroups = ref(new Set());
const searchQuery = ref("");
const actionMenuId = ref(null);

const form = ref({ groupId: "", name: "", url: "" });
const groupForm = ref({ name: "" });
const shortcutForm = ref({ title: "", url: "" });

const isEditing = computed(() => editingId.value !== null);
const DEFAULT_GROUP = "Sans groupe";

const groupedWikis = computed(() => {
  const query = (searchQuery.value || "").trim().toLowerCase();
  const filteredWikis = query
    ? wikis.value.filter((wiki) => (wiki.name || "").toLowerCase().includes(query))
    : wikis.value;

  const groupMap = new Map(
    groups.value.map((group) => [
      group.id,
      { key: group.id, id: group.id, label: group.name, items: [], canRemove: true }
    ])
  );

  const ungrouped = { key: "ungrouped", id: null, label: DEFAULT_GROUP, items: [], canRemove: false };

  filteredWikis.forEach((wiki) => {
    const target = wiki.groupId && groupMap.has(wiki.groupId) ? groupMap.get(wiki.groupId) : ungrouped;
    target.items.push(wiki);
  });

  const sortedGroups = Array.from(groupMap.values())
    .map((group) => ({ ...group, items: group.items.slice().sort((a, b) => a.name.localeCompare(b.name)) }))
    .sort((a, b) => a.label.localeCompare(b.label));

  if (ungrouped.items.length > 0 || sortedGroups.length === 0) {
    sortedGroups.push({ ...ungrouped, items: ungrouped.items.slice().sort((a, b) => a.name.localeCompare(b.name)) });
  }

  return sortedGroups;
});

const loadAll = async () => {
  try {
    const [gRes, wRes, sRes] = await Promise.all([
      api.get("/wiki/groups"),
      api.get("/wiki/items"),
      api.get("/wiki/shortcuts")
    ]);
    groups.value = gRes.data;
    wikis.value = wRes.data;
    shortcuts.value = sRes.data;
  } catch {
    groups.value = [];
    wikis.value = [];
    shortcuts.value = [];
  }
};

onMounted(loadAll);

const newId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const resetForm = () => {
  form.value = { groupId: "", name: "", url: "" };
  editingId.value = null;
  error.value = "";
};

const resetGroupForm = () => {
  groupForm.value = { name: "" };
  groupError.value = "";
};

const normalizeUrl = (value) => (value || "").trim();

const getFaviconUrl = (url) => {
  try {
    const { hostname } = new URL(url);
    if (!hostname) return "";
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`;
  } catch {
    return "";
  }
};

const addShortcut = async () => {
  let title = (shortcutForm.value.title || "").trim();
  let url = normalizeUrl(shortcutForm.value.url);
  if (!title || !url) return;
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
  const id = newId();
  try {
    await api.post("/wiki/shortcuts", { id, title, url });
    shortcuts.value = [...shortcuts.value, { id, title, url }];
    shortcutForm.value = { title: "", url: "" };
  } catch {
    // silently fail
  }
};

const removeShortcut = async (id) => {
  try {
    await api.delete(`/wiki/shortcuts/${id}`);
    shortcuts.value = shortcuts.value.filter((s) => s.id !== id);
  } catch {
    // silently fail
  }
};

const saveGroup = async () => {
  groupError.value = "";
  const name = (groupForm.value.name || "").trim();
  if (!name) { groupError.value = "Veuillez renseigner un nom de groupe."; return; }
  const exists = groups.value.some((g) => g.name.toLowerCase() === name.toLowerCase());
  if (exists) { groupError.value = "Ce groupe existe deja."; return; }
  const id = newId();
  try {
    await api.post("/wiki/groups", { id, name });
    groups.value = [...groups.value, { id, name }];
    resetGroupForm();
  } catch (e) {
    console.error("[wiki] createGroup error:", e?.response?.status, e?.response?.data, e?.message);
    groupError.value = "Erreur lors de la création du groupe.";
  }
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

  if (!url) { error.value = "Veuillez renseigner le lien du wiki."; return; }
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;

  if (!name) {
    const title = await fetchPageTitle(url);
    if (title) {
      name = title;
    } else {
      try { name = new URL(url).hostname.replace(/^www\./, ""); } catch { name = url; }
    }
  }

  try {
    if (editingId.value) {
      await api.put(`/wiki/items/${editingId.value}`, { name, url, groupId });
      wikis.value = wikis.value.map((w) => w.id !== editingId.value ? w : { ...w, name, url, groupId });
    } else {
      const id = newId();
      await api.post("/wiki/items", { id, name, url, groupId });
      wikis.value = [...wikis.value, { id, name, url, groupId }];
    }
    resetForm();
  } catch {
    error.value = "Erreur lors de l'enregistrement.";
  }
};

const editWiki = (wiki) => {
  form.value = { groupId: wiki.groupId || "", name: wiki.name || "", url: wiki.url || "" };
  editingId.value = wiki.id;
};

const cancelEdit = () => resetForm();

const removeWiki = async (id) => {
  const confirmRemove = window.confirm("Supprimer ce wiki ?");
  if (!confirmRemove) return;
  try {
    await api.delete(`/wiki/items/${id}`);
    wikis.value = wikis.value.filter((w) => w.id !== id);
    if (editingId.value === id) resetForm();
  } catch {
    // silently fail
  }
};

const removeGroup = async (groupId) => {
  const group = groups.value.find((g) => g.id === groupId);
  if (!group) return;
  const confirmRemove = window.confirm(`Supprimer le groupe "${group.name}" ? Les wikis seront deplaces en "Sans groupe".`);
  if (!confirmRemove) return;
  try {
    await api.delete(`/wiki/groups/${groupId}`);
    groups.value = groups.value.filter((g) => g.id !== groupId);
    wikis.value = wikis.value.map((w) => w.groupId !== groupId ? w : { ...w, groupId: null });
  } catch {
    // silently fail
  }
};

const handleDragStart = (event, wikiId) => {
  event.dataTransfer.setData("text/wiki-id", wikiId);
  event.dataTransfer.effectAllowed = "move";
};

const handleDrop = async (event, groupId) => {
  const wikiId = event.dataTransfer.getData("text/wiki-id");
  if (!wikiId) return;
  const wiki = wikis.value.find((w) => w.id === wikiId);
  if (!wiki) return;
  try {
    await api.put(`/wiki/items/${wikiId}`, { name: wiki.name, url: wiki.url, groupId });
    wikis.value = wikis.value.map((w) => w.id !== wikiId ? w : { ...w, groupId });
  } catch {
    // silently fail
  }
};

const isGroupOpen = (key) => openGroups.value.has(key);

const toggleGroup = (key) => {
  const next = new Set(openGroups.value);
  if (next.has(key)) { next.delete(key); } else { next.add(key); }
  openGroups.value = next;
};

const toggleActionMenu = (id) => {
  actionMenuId.value = actionMenuId.value === id ? null : id;
};

const closeActionMenu = () => {
  actionMenuId.value = null;
};
</script>

<style scoped>
.page {
    min-height: 100vh;
    font-family: "Manrope", sans-serif;
    background: #ffffff;
    position: relative;
    overflow: hidden;
}

.page-inner {
  padding: 24px;
  position: relative;
  z-index: 1;
}

.page-hero {
  display: flex;
  align-items: stretch;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
  background: #ffffff;
  border: none;
  border-radius: 0;
  padding: 0;
  box-shadow: none;
  position: relative;
  z-index: 1;
  flex-direction: column;
}

.hero-main {
  display: flex;
  align-items: stretch;
  justify-content: space-between;
  gap: 12px;
}

.hero-text h1 {
  font-family: "Space Grotesk", sans-serif;
  font-size: 36px;
  margin: 6px 0 8px;
  color: #1f2a2e;
}

.hero-subtitle {
  max-width: 520px;
  color: #394449;
  margin: 0;
}

.hero-eyebrow {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 2px;
  color: #5d6b6f;
  margin: 0;
}

.hero-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  min-width: 220px;
}

.stat-card {
  background: #ffffff;
  border: 1px solid #d7e6f8;
  border-radius: 12px;
  padding: 4px 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  justify-content: center;
  box-shadow:
    inset 0 0 0 1px rgba(15, 39, 66, 0.04),
    0 8px 16px rgba(15, 39, 66, 0.08);
  min-height: 80px;
  height: 80px;
}

.stat-label {
  font-size: 11px;
  line-height: 1;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #6b86a3;
  font-weight: 700;
}

.stat-value {
  font-size: 16px;
  line-height: 1;
  color: #0b2b4a;
}

.shortcut-inline {
  margin-top: 4px;
  background: transparent;
  border: none;
  padding: 0;
  box-shadow: none;
}

.shortcut-band-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 8px;
}

.shortcut-eyebrow {
  font-size: 10px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #64748b;
  margin: 0 0 4px;
  font-weight: 700;
}

.shortcut-band h3 {
  margin: 0;
  color: #0f172a;
  font-size: 18px;
}

.layout {
  display: grid;
  grid-template-columns: minmax(260px, 340px) 1fr;
  gap: 20px;
  margin-top: 16px;
  position: relative;
  z-index: 1;
}

.card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.06);
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
  background: #f8fafc;
  border: 1px solid #e2e8f0;
}

.add-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
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
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 10px;
}

.list-actions {
  margin-left: auto;
}

.search-input {
  width: 220px;
  padding: 8px 10px;
  border-radius: 10px;
  border: 1px solid #cbd5e1;
  background: #ffffff;
}

.search-input:focus {
  outline: none;
  border-color: #0f2742;
  box-shadow: 0 0 0 3px rgba(15, 39, 66, 0.12);
}

.shortcut-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.shortcut-form {
  display: grid;
  grid-template-columns: minmax(160px, 1fr) minmax(200px, 1fr) auto;
  gap: 10px;
  align-items: center;
}

.shortcut-form input {
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid #cbd5e1;
  background: #ffffff;
}

.shortcut-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.shortcut-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 999px;
  border: 1px solid #c7d8f2;
  background: linear-gradient(120deg, #ffffff 0%, #e8f1ff 100%);
  color: #0b2b4a;
  font-weight: 700;
  font-size: 12px;
  text-decoration: none;
}

.shortcut-logo {
  width: 18px;
  height: 18px;
  border-radius: 4px;
  background: #ffffff;
  border: 1px solid rgba(15, 39, 66, 0.12);
  object-fit: contain;
}

.chip-remove {
  width: 22px;
  height: 22px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.6);
  background: #ffffff;
  cursor: pointer;
  font-weight: 700;
  color: #7a8a8f;
  display: grid;
  place-items: center;
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
}

.group-block {
  margin-top: 12px;
  border: 1px solid #cddcf0;
  border-radius: 12px;
  background: #ffffff;
  overflow: hidden;
}

.accordion-header {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: none;
  background: #f8fafc;
  color: #0f172a;
  cursor: pointer;
  text-align: left;
}

.accordion-header:hover {
  background: #eef5ff;
}

.accordion-arrow {
  font-size: 14px;
  color: #0f2742;
}

.accordion-title {
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-size: 13px;
}

.accordion-count {
  font-size: 12px;
  color: #64748b;
}

.group-remove {
  margin-left: auto;
}

.accordion-body {
  padding: 6px 12px 12px;
}

.wiki-rows {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.wiki-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 10px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #ffffff;
}

.wiki-row:hover {
  background: #f8fbff;
}

.wiki-row[draggable="true"] {
  cursor: grab;
}

.wiki-name {
  font-weight: 700;
  color: #0f172a;
}

.wiki-url {
  flex: 1;
  font-size: 12px;
  color: #64748b;
  opacity: 0;
  max-width: 280px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: opacity 0.2s ease;
}

.wiki-row:hover .wiki-url {
  opacity: 1;
}

.wiki-right {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.open-link {
  color: #0f2742;
  font-weight: 700;
  text-decoration: underline;
}

.wiki-actions {
  display: inline-flex;
  gap: 8px;
  align-items: center;
}

.action-ellipsis {
  border: none;
  background: transparent;
  color: #0f2742;
  font-weight: 700;
  cursor: pointer;
  padding: 0 4px;
}

.action-menu {
  display: inline-flex;
  gap: 6px;
  padding: 4px 6px;
  border-radius: 999px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  box-shadow: 0 8px 16px rgba(15, 23, 42, 0.08);
}

.action-link {
  border: none;
  background: transparent;
  color: #0f2742;
  font-weight: 700;
  cursor: pointer;
  padding: 0;
}

.action-link.danger {
  color: #991b1b;
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

  .page-hero {
    flex-direction: column;
  }

  .hero-main {
    flex-direction: column;
  }

  .hero-stats {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .shortcut-form {
    grid-template-columns: 1fr;
  }

}

@media (max-width: 640px) {
  .hero-stats {
    grid-template-columns: 1fr;
  }
}
</style>



<template>
  <div class="page">

    <!-- TOP BAR -->
    <div class="top-bar">
      <div class="top-bar-left">
        <h1 class="page-title">Mes wikis</h1>
        <p class="page-sub">Centralisez vos liens, wikis et raccourcis internes</p>
      </div>
      <div class="top-stats">
        <div class="stat-pill">
          <span class="stat-num">{{ wikis.length }}</span>
          <span class="stat-lbl">Liens</span>
        </div>
        <div class="stat-pill">
          <span class="stat-num">{{ groups.length }}</span>
          <span class="stat-lbl">Groupes</span>
        </div>
        <div class="stat-pill">
          <span class="stat-num">{{ shortcuts.length }}</span>
          <span class="stat-lbl">Raccourcis</span>
        </div>
      </div>
    </div>

    <!-- SHORTCUTS BAR -->
    <div class="shortcuts-bar">
      <div class="shortcuts-left">
        <span class="shortcuts-label">Raccourcis</span>
        <div class="shortcuts-chips">
          <a
            v-for="sc in shortcuts" :key="sc.id"
            class="shortcut-chip"
            :href="sc.url" target="_blank" rel="noreferrer"
          >
            <img v-if="getFaviconUrl(sc.url)" class="shortcut-favicon" :src="getFaviconUrl(sc.url)" loading="lazy" />
            {{ sc.title }}
            <button v-if="showShortcutEditor" type="button" class="chip-del" @click.prevent="removeShortcut(sc.id)">✕</button>
          </a>
          <span v-if="!shortcuts.length" class="shortcuts-empty">Aucun raccourci.</span>
        </div>
      </div>
      <button class="btn-ghost-sm" type="button" @click="showShortcutEditor = !showShortcutEditor">
        {{ showShortcutEditor ? 'Fermer' : 'Gérer' }}
      </button>
    </div>

    <form v-if="showShortcutEditor" class="shortcut-form" @submit.prevent="addShortcut">
      <input v-model="shortcutForm.title" type="text" placeholder="Nom du lien" required />
      <input v-model="shortcutForm.url" type="url" placeholder="https://" required />
      <button type="submit" class="btn-primary">
        <svg viewBox="0 0 20 20" fill="currentColor"><path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z"/></svg>
        Ajouter
      </button>
    </form>

    <!-- MAIN LAYOUT -->
    <div class="layout">

      <!-- LEFT: FORMS -->
      <div class="forms-col">

        <!-- Create group -->
        <div class="form-card">
          <div class="form-card-head">
            <span class="form-card-title">Créer un groupe</span>
            <span class="form-tag">Groupe</span>
          </div>
          <form @submit.prevent="saveGroup">
            <label class="field">
              <span>Nom du groupe</span>
              <input v-model="groupForm.name" type="text" placeholder="Ex : Sociétés" />
            </label>
            <p v-if="groupError" class="form-error">{{ groupError }}</p>
            <div class="form-actions">
              <button type="submit" class="btn-primary">
                <svg viewBox="0 0 20 20" fill="currentColor"><path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z"/></svg>
                Ajouter le groupe
              </button>
            </div>
          </form>
        </div>

        <!-- Add / Edit wiki -->
        <div class="form-card">
          <div class="form-card-head">
            <span class="form-card-title">{{ isEditing ? 'Modifier un wiki' : 'Ajouter un wiki' }}</span>
            <span class="form-tag">Wiki</span>
          </div>
          <form @submit.prevent="saveWiki">
            <div class="form-grid">
              <label class="field">
                <span>Groupe</span>
                <select v-model="form.groupId">
                  <option value="">Sans groupe</option>
                  <option v-for="g in groups" :key="g.id" :value="g.id">{{ g.name }}</option>
                </select>
              </label>
              <label class="field">
                <span>Nom du wiki</span>
                <input v-model="form.name" type="text" placeholder="Ex : Société par dupli" />
              </label>
            </div>
            <label class="field">
              <span>Lien du wiki</span>
              <div class="url-input-wrap">
                <span class="url-prefix">https://</span>
                <input v-model="form.url" type="url" placeholder="lien du wiki…" />
              </div>
            </label>
            <p v-if="error" class="form-error">{{ error }}</p>
            <div class="form-actions">
              <button type="submit" class="btn-primary">
                <svg v-if="isEditing" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clip-rule="evenodd"/></svg>
                <svg v-else viewBox="0 0 20 20" fill="currentColor"><path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z"/></svg>
                {{ isEditing ? 'Enregistrer' : 'Ajouter' }}
              </button>
              <button v-if="isEditing" type="button" class="btn-ghost" @click="cancelEdit">
                <svg viewBox="0 0 20 20" fill="currentColor"><path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z"/></svg>
                Annuler
              </button>
            </div>
          </form>
        </div>

      </div>

      <!-- RIGHT: WIKI LIST -->
      <div class="list-card">
        <div class="list-head">
          <div>
            <h3 class="list-title">Mes wikis</h3>
            <p class="list-sub">Glissez-déposez pour reclasser. · {{ wikis.length }} lien(s)</p>
          </div>
          <div class="search-wrap">
            <svg class="search-icon" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clip-rule="evenodd"/></svg>
            <input v-model="searchQuery" type="search" class="search-input" placeholder="Rechercher un wiki…" />
          </div>
        </div>

        <div v-if="!groupedWikis.length" class="empty-state">Aucun wiki pour le moment.</div>

        <div class="wiki-list" @click="closeActionMenu">
          <div
            v-for="group in groupedWikis" :key="group.key"
            class="group-block"
            @dragover.prevent
            @drop="handleDrop($event, group.id)"
          >
            <button class="group-header" type="button" @click="toggleGroup(group.key)">
              <svg class="chevron-icon" :class="{ open: isGroupOpen(group.key) }" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd"/>
              </svg>
              <span class="group-name">{{ group.label }}</span>
              <span class="group-count">{{ group.items.length }}</span>
              <span
                v-if="group.canRemove"
                class="group-del"
                role="button" tabindex="0"
                title="Supprimer le groupe"
                @click.stop="removeGroup(group.id)"
                @keydown.enter.prevent="removeGroup(group.id)"
              >
                <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clip-rule="evenodd"/></svg>
              </span>
            </button>

            <div v-if="isGroupOpen(group.key)" class="group-body">
              <ul v-if="group.items.length" class="wiki-rows">
                <li
                  v-for="wiki in group.items" :key="wiki.id"
                  class="wiki-row"
                  draggable="true"
                  @dragstart="handleDragStart($event, wiki.id)"
                  @click.stop
                >
                  <img v-if="getFaviconUrl(wiki.url)" class="wiki-favicon" :src="getFaviconUrl(wiki.url)" loading="lazy" />
                  <span class="wiki-name">{{ wiki.name }}</span>
                  <span class="wiki-url">{{ wiki.url }}</span>
                  <div class="wiki-right">
                    <a class="btn-open" :href="wiki.url" target="_blank" rel="noreferrer">
                      <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4.25 5.5a.75.75 0 0 0-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 0 0 .75-.75v-4a.75.75 0 0 1 1.5 0v4A2.25 2.25 0 0 1 12.75 17h-8.5A2.25 2.25 0 0 1 2 14.75v-8.5A2.25 2.25 0 0 1 4.25 4h5a.75.75 0 0 1 0 1.5h-5Zm6.75-3a.75.75 0 0 1 .75-.75h4.5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0V4.06l-6.22 6.22a.75.75 0 0 1-1.06-1.06L14.44 3H11a.75.75 0 0 1-.75-.75Z" clip-rule="evenodd"/></svg>
                      Ouvrir
                    </a>
                    <div class="wiki-actions">
                      <button type="button" class="action-dots" @click.stop="toggleActionMenu(wiki.id)" aria-label="Actions">
                        <svg viewBox="0 0 20 20" fill="currentColor"><path d="M3 10a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0ZM8.5 10a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0ZM15.5 8.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z"/></svg>
                      </button>
                      <div v-if="actionMenuId === wiki.id" class="action-menu" @click.stop>
                        <button type="button" class="action-item" @click="editWiki(wiki)">
                          <svg viewBox="0 0 20 20" fill="currentColor"><path d="m5.433 13.917 1.262-3.155A4 4 0 0 1 7.58 9.42l6.92-6.918a2.121 2.121 0 0 1 3 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 0 1-.65-.65Z"/></svg>
                          Modifier
                        </button>
                        <button type="button" class="action-item action-item-danger" @click="removeWiki(wiki.id)">
                          <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clip-rule="evenodd"/></svg>
                          Supprimer
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              </ul>
              <p v-else class="empty-group">Déposez un wiki ici.</p>
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
  } catch {}
};

const removeShortcut = async (id) => {
  try {
    await api.delete(`/wiki/shortcuts/${id}`);
    shortcuts.value = shortcuts.value.filter((s) => s.id !== id);
  } catch {}
};

const saveGroup = async () => {
  groupError.value = "";
  const name = (groupForm.value.name || "").trim();
  if (!name) { groupError.value = "Veuillez renseigner un nom de groupe."; return; }
  const exists = groups.value.some((g) => g.name.toLowerCase() === name.toLowerCase());
  if (exists) { groupError.value = "Ce groupe existe déjà."; return; }
  const id = newId();
  try {
    await api.post("/wiki/groups", { id, name });
    groups.value = [...groups.value, { id, name }];
    resetGroupForm();
  } catch {
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
  if (!window.confirm("Supprimer ce wiki ?")) return;
  try {
    await api.delete(`/wiki/items/${id}`);
    wikis.value = wikis.value.filter((w) => w.id !== id);
    if (editingId.value === id) resetForm();
  } catch {}
};

const removeGroup = async (groupId) => {
  const group = groups.value.find((g) => g.id === groupId);
  if (!group) return;
  if (!window.confirm(`Supprimer le groupe "${group.name}" ? Les wikis seront déplacés en "Sans groupe".`)) return;
  try {
    await api.delete(`/wiki/groups/${groupId}`);
    groups.value = groups.value.filter((g) => g.id !== groupId);
    wikis.value = wikis.value.map((w) => w.groupId !== groupId ? w : { ...w, groupId: null });
  } catch {}
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
  } catch {}
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
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin: -24px;
  padding: 24px;
  min-height: calc(100% + 48px);
  background: #f8fafc;
  box-sizing: border-box;
}

/* ── TOP BAR ─────────────── */
.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}
.page-title { font-size: 20px; font-weight: 700; color: #0f172a; margin: 0; }
.page-sub { font-size: 13px; color: #64748b; margin: 2px 0 0; }
.top-stats { display: flex; gap: 8px; }
.stat-pill {
  display: flex; flex-direction: column; align-items: center;
  padding: 8px 16px; background: #fff; border: 1px solid #e2e8f0;
  border-radius: 8px; min-width: 70px;
}
.stat-num { font-size: 18px; font-weight: 700; color: #1a3a5c; line-height: 1; }
.stat-lbl { font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.06em; margin-top: 2px; }

/* ── SHORTCUTS ───────────── */
.shortcuts-bar {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  background: #fff; border: 1px solid #e2e8f0; border-radius: 8px;
  padding: 8px 14px;
}
.shortcuts-left { display: flex; align-items: center; gap: 12px; flex: 1; min-width: 0; flex-wrap: wrap; }
.shortcuts-label { font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.08em; white-space: nowrap; }
.shortcuts-chips { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
.shortcuts-empty { font-size: 12px; color: #94a3b8; }

.shortcut-chip {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 5px 10px; background: #f8fafc; border: 1px solid #e2e8f0;
  border-radius: 20px; font-size: 12px; font-weight: 600; color: #1e293b;
  text-decoration: none; transition: border-color 0.12s;
}
.shortcut-chip:hover { border-color: #1a3a5c; color: #1a3a5c; }
.shortcut-favicon { width: 14px; height: 14px; border-radius: 3px; object-fit: contain; }
.chip-del { border: none; background: transparent; color: #94a3b8; cursor: pointer; font-size: 12px; line-height: 1; padding: 0 0 0 2px; }
.chip-del:hover { color: #dc2626; }

.shortcut-form {
  display: flex; gap: 8px; align-items: center; flex-wrap: wrap;
  background: #fff; border: 1px solid #e2e8f0; border-radius: 8px;
  padding: 10px 14px;
}
.shortcut-form input {
  padding: 7px 10px; border: 1px solid #e2e8f0; border-radius: 7px;
  font-size: 13px; flex: 1; min-width: 140px;
}
.shortcut-form input:focus { outline: none; border-color: #93c5fd; }

.btn-ghost-sm {
  padding: 5px 12px; border: 1px solid #e2e8f0; background: #fff;
  border-radius: 7px; font-size: 12px; font-weight: 600; color: #475569; cursor: pointer; white-space: nowrap;
}
.btn-ghost-sm:hover { background: #f8fafc; }

/* ── LAYOUT ──────────────── */
.layout {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 16px;
  align-items: start;
}

/* ── FORM CARDS ──────────── */
.forms-col { display: flex; flex-direction: column; gap: 12px; }
.form-card {
  background: #fff; border: 1px solid #e2e8f0; border-radius: 8px;
  padding: 16px; display: flex; flex-direction: column; gap: 12px;
}
.form-card-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; }
.form-card-title { font-size: 13px; font-weight: 700; color: #0f172a; }
.form-tag {
  font-size: 10px; font-weight: 700; padding: 3px 8px;
  background: #1a3a5c; color: #fff; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.06em;
}

.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; min-width: 0; }
.form-grid .field { min-width: 0; }
.form-grid .field input, .form-grid .field select { width: 100%; box-sizing: border-box; min-width: 0; }

.field { display: flex; flex-direction: column; gap: 5px; }
.field span { font-size: 12px; font-weight: 600; color: #475569; }
.field input, .field select {
  padding: 7px 10px; border: 1px solid #e2e8f0; border-radius: 7px;
  font-size: 13px; background: #f8fafc; color: #1e293b;
}
.field input:focus, .field select:focus { outline: none; border-color: #93c5fd; background: #fff; }

.url-input-wrap {
  display: flex; align-items: center;
  border: 1px solid #e2e8f0; border-radius: 7px;
  background: #f8fafc; overflow: hidden;
}
.url-input-wrap:focus-within { border-color: #93c5fd; background: #fff; }
.url-prefix { padding: 7px 8px; font-size: 12px; color: #94a3b8; font-weight: 600; border-right: 1px solid #e2e8f0; white-space: nowrap; }
.url-input-wrap input { border: none; background: transparent; padding: 7px 10px; font-size: 13px; flex: 1; }
.url-input-wrap input:focus { outline: none; }

.form-actions { display: flex; gap: 8px; align-items: center; padding-top: 4px; }
.form-error { font-size: 12px; color: #dc2626; margin: 0; }

.btn-primary {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 16px; background: #1a3a5c; color: #fff;
  border: none; border-radius: 7px; font-size: 13px; font-weight: 600; cursor: pointer;
}
.btn-primary svg { width: 14px; height: 14px; flex-shrink: 0; }
.btn-primary:hover { background: #2e5f8a; }
.btn-ghost {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 7px 12px; border: 1px solid #e2e8f0; background: #fff;
  border-radius: 7px; font-size: 13px; color: #475569; cursor: pointer;
}
.btn-ghost svg { width: 14px; height: 14px; flex-shrink: 0; }
.btn-ghost:hover { background: #f8fafc; }

/* ── LIST CARD ───────────── */
.list-card {
  background: #fff; border: 1px solid #e2e8f0; border-radius: 8px;
  padding: 16px; display: flex; flex-direction: column; gap: 12px;
}
.list-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.list-title { font-size: 14px; font-weight: 700; color: #0f172a; margin: 0; }
.list-sub { font-size: 12px; color: #94a3b8; margin: 2px 0 0; }

.search-wrap { position: relative; }
.search-icon { position: absolute; left: 9px; top: 50%; transform: translateY(-50%); width: 13px; height: 13px; color: #94a3b8; pointer-events: none; }
.search-input { padding: 7px 10px 7px 28px; border: 1px solid #e2e8f0; border-radius: 7px; font-size: 13px; width: 200px; }
.search-input:focus { outline: none; border-color: #93c5fd; }

.empty-state { text-align: center; color: #94a3b8; font-size: 13px; padding: 32px; }
.wiki-list { display: flex; flex-direction: column; gap: 6px; }

/* ── GROUP ACCORDION ─────── */
.group-block { border: 1px solid #e2e8f0; border-radius: 7px; }
.group-header {
  width: 100%; display: flex; align-items: center; gap: 8px;
  padding: 9px 12px; border: none; background: #f8fafc; cursor: pointer; text-align: left;
  border-radius: 7px;
}
.group-block:has(.group-body) .group-header { border-radius: 7px 7px 0 0; }
.group-header:hover { background: #eff6ff; }
.chevron-icon { width: 14px; height: 14px; color: #94a3b8; transition: transform 0.2s; flex-shrink: 0; }
.chevron-icon.open { transform: rotate(180deg); }
.group-name { font-size: 12px; font-weight: 700; color: #1e293b; text-transform: uppercase; letter-spacing: 0.04em; flex: 1; }
.group-count {
  font-size: 11px; font-weight: 700; padding: 1px 7px;
  background: #e2e8f0; color: #475569; border-radius: 20px;
}
.group-del { margin-left: 4px; color: #94a3b8; display: flex; cursor: pointer; }
.group-del:hover { color: #dc2626; }
.group-del svg { width: 14px; height: 14px; }

.group-body { padding: 8px 10px; }
.empty-group { font-size: 12px; color: #94a3b8; text-align: center; padding: 10px; }
.wiki-rows { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 4px; }

.wiki-row {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 10px; border: 1px solid #f1f5f9; border-radius: 6px;
  background: #fff; cursor: grab;
}
.wiki-row:hover { background: #f8fbff; border-color: #e2e8f0; }
.wiki-favicon { width: 16px; height: 16px; border-radius: 3px; object-fit: contain; flex-shrink: 0; }
.wiki-name { font-size: 13px; font-weight: 600; color: #1e293b; white-space: nowrap; }
.wiki-url {
  flex: 1; font-size: 11px; color: #94a3b8;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  opacity: 0; transition: opacity 0.15s;
}
.wiki-row:hover .wiki-url { opacity: 1; }
.wiki-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }

.btn-open {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 12px; font-weight: 600; color: #1a3a5c;
  text-decoration: none; padding: 4px 8px;
  border: 1px solid #e2e8f0; border-radius: 6px;
}
.btn-open:hover { background: #eff6ff; border-color: #93c5fd; }
.btn-open svg { width: 12px; height: 12px; }

.wiki-actions { position: relative; display: flex; align-items: center; }
.action-dots {
  width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;
  border: none; background: transparent; border-radius: 6px; cursor: pointer; color: #94a3b8;
}
.action-dots:hover { background: #f1f5f9; color: #1e293b; }
.action-dots svg { width: 16px; height: 16px; }

.action-menu {
  position: absolute; right: 0; top: 100%; z-index: 50;
  background: #fff; border: 1px solid #e2e8f0; border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.1); padding: 4px; min-width: 130px;
  display: flex; flex-direction: column; gap: 2px;
}
.action-item {
  display: flex; align-items: center; gap: 8px;
  padding: 7px 10px; border: none; background: transparent;
  font-size: 13px; color: #1e293b; cursor: pointer; border-radius: 6px; text-align: left;
}
.action-item:hover { background: #f1f5f9; }
.action-item svg { width: 14px; height: 14px; }
.action-item-danger { color: #dc2626; }
.action-item-danger:hover { background: #fee2e2; }

@media (max-width: 900px) {
  .layout { grid-template-columns: 1fr; }
  .form-grid { grid-template-columns: 1fr; }
}
</style>

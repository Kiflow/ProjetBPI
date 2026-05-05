<template>
  <div class="page">

    <!-- HEADER -->
    <div class="page-head">
      <div>
        <div class="eyebrow">Info client</div>
        <h1>Suivi client</h1>
      </div>
      <button type="button" class="btn-primary" @click="openAddModal">
        <svg viewBox="0 0 20 20" fill="currentColor"><path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z"/></svg>
        Ajouter un client
      </button>
    </div>

    <!-- STATS BAR -->
    <div class="stats-bar">
      <div class="stat-card">
        <div class="stat-icon" style="background:#fffbeb;color:#d97706;">{{ sensiblesTotal }}</div>
        <div class="stat-lbl">Clients sensibles</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:#fff7ed;color:#ea580c;">{{ plansTotal }}</div>
        <div class="stat-lbl">Plan d'action</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:#fef3c7;color:#b45309;">{{ totalOpenTickets }}</div>
        <div class="stat-lbl">Tickets ouverts</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:#eff6ff;color:#1a3a5c;">{{ addedThisMonth }}</div>
        <div class="stat-lbl">Ajouts ce mois</div>
      </div>
    </div>

    <!-- MAIN 2-COLS -->
    <div class="main-layout">

      <!-- LEFT: LIST PANEL -->
      <section class="list-panel">

        <!-- Tabs -->
        <div class="tabs-row">
          <button
            type="button" class="tab-btn"
            :class="{ active: boardStatus === 'sensible' }"
            @click="boardStatus = 'sensible'"
          >
            <span class="tab-dot" style="background:#d97706;"></span>
            Sensible
            <span class="tab-count" :class="{ 'tab-count--active': boardStatus === 'sensible' }">{{ sensiblesTotal }}</span>
          </button>
          <button
            type="button" class="tab-btn"
            :class="{ active: boardStatus === 'plan', 'active--plan': boardStatus === 'plan' }"
            @click="boardStatus = 'plan'"
          >
            <span class="tab-dot" style="background:#ea580c;"></span>
            Plan d'action
            <span class="tab-count" :class="{ 'tab-count--active': boardStatus === 'plan' }">{{ plansTotal }}</span>
          </button>
        </div>

        <!-- Search -->
        <div class="list-search-wrap">
          <svg class="list-search-icon" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clip-rule="evenodd"/></svg>
          <input v-model="filterQuery" type="search" class="list-search-input" placeholder="Rechercher (nom, PAC, BU)…" />
        </div>

        <!-- Rows -->
        <div class="list-rows">
          <div v-if="!boardEntries.length" class="list-empty">
            {{ filterQuery ? 'Aucun résultat.' : 'Aucun client dans cette liste.' }}
          </div>
          <div
            v-for="entry in boardEntries" :key="entry.id"
            class="list-row"
            :class="{ 'list-row--selected': entry.id === selectedDetailId }"
            @click="selectEntry(entry)"
          >
            <div class="row-avatar" :style="{ background: avatarColor(entry.client.name) }">{{ initials(entry.client.name) }}</div>
            <div class="row-info">
              <div class="row-name-line">
                <span class="row-name">{{ entry.client.name }}</span>
                <span class="row-pac">{{ entry.client.pac }}</span>
                <span v-if="entry.client.bu" class="row-bu">· {{ entry.client.bu }}</span>
              </div>
              <div v-if="lastComment(entry)" class="row-comment">
                « {{ lastComment(entry).text }} »
              </div>
              <div v-else class="row-comment row-comment--empty">Aucun commentaire</div>
            </div>
            <div class="row-right">
              <span v-if="getOpenTickets(entry.client.pac).length" class="row-tickets">
                <svg viewBox="0 0 20 20" fill="currentColor"><path d="M3 7a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v2.5a1.5 1.5 0 0 0 0 3V15a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-2.5a1.5 1.5 0 0 0 0-3V7Z"/></svg>
                {{ getOpenTickets(entry.client.pac).length }} ticket{{ getOpenTickets(entry.client.pac).length > 1 ? 's' : '' }}
              </span>
              <span v-else class="row-no-ticket">—</span>
              <span class="row-age">{{ daysAgo(entry.addedAt) }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- RIGHT: DRAWER -->
      <aside class="drawer" v-if="selectedDetailEntry">

        <!-- Drawer head -->
        <div class="drawer-head">
          <div class="drawer-head-left">
            <div class="drawer-avatar" :style="{ background: avatarColor(selectedDetailEntry.client.name) }">
              {{ initials(selectedDetailEntry.client.name) }}
            </div>
            <div>
              <div class="drawer-name">{{ selectedDetailEntry.client.name }}</div>
              <div class="drawer-meta">
                <span><span class="meta-label">PAC</span> {{ selectedDetailEntry.client.pac }}</span>
                <span v-if="selectedDetailEntry.client.bu"><span class="meta-label">BU</span> {{ selectedDetailEntry.client.bu }}</span>
              </div>
            </div>
          </div>
          <div class="drawer-head-actions">
            <button type="button" class="btn-icon" title="Modifier" @click="openEditModal(selectedDetailEntry)">
              <svg viewBox="0 0 20 20" fill="currentColor"><path d="m5.433 13.917 1.262-3.155A4 4 0 0 1 7.58 9.42l6.92-6.918a2.121 2.121 0 0 1 3 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 0 1-.65-.65Z"/></svg>
            </button>
            <button type="button" class="btn-icon btn-icon--danger" title="Supprimer" @click="removeClient(selectedDetailEntry.id)">
              <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clip-rule="evenodd"/></svg>
            </button>
          </div>
        </div>

        <!-- Drawer tabs -->
        <div class="drawer-tabs">
          <button type="button" class="drawer-tab" :class="{ active: detailSection === 'overview' }" @click="detailSection = 'overview'">Aperçu</button>
          <button type="button" class="drawer-tab" :class="{ active: detailSection === 'comments' }" @click="detailSection = 'comments'">
            Commentaires <span class="drawer-tab-count">{{ selectedDetailEntry.comments.length }}</span>
          </button>
          <button type="button" class="drawer-tab" :class="{ active: detailSection === 'tickets' }" @click="detailSection = 'tickets'">
            Tickets <span class="drawer-tab-count">{{ getOpenTickets(selectedDetailEntry.client.pac).length }}</span>
          </button>
          <button type="button" class="drawer-tab" :class="{ active: detailSection === 'timeline' }" @click="detailSection = 'timeline'">Historique</button>
        </div>

        <!-- Drawer body -->
        <div class="drawer-body">

          <!-- Aperçu -->
          <template v-if="detailSection === 'overview'">
            <div class="overview-stats">
              <div class="ov-stat">
                <div class="ov-stat-num" style="color:#dc2626;">{{ getOpenTickets(selectedDetailEntry.client.pac).length }}</div>
                <div class="ov-stat-lbl">Tickets</div>
              </div>
              <div class="ov-stat">
                <div class="ov-stat-num" style="color:#0f2742;">{{ selectedDetailEntry.comments.length }}</div>
                <div class="ov-stat-lbl">Commentaires</div>
              </div>
              <div class="ov-stat">
                <div class="ov-stat-num" style="color:#1a3a5c;font-size:13px;">{{ selectedDetailEntry.status === 'sensible' ? 'Sensible' : "Plan d'action" }}</div>
                <div class="ov-stat-lbl">Statut</div>
              </div>
            </div>
            <div class="ov-info">
              <div class="ov-info-label">Suivi</div>
              <div class="ov-info-row">Ajouté le <strong>{{ formatDateOnly(selectedDetailEntry.addedAt) }}</strong> ({{ daysAgo(selectedDetailEntry.addedAt) }})</div>
              <div v-if="selectedDetailEntry.createdBy" class="ov-info-row">Par <strong>{{ selectedDetailEntry.createdBy }}</strong></div>
              <div v-if="lastComment(selectedDetailEntry)" class="ov-info-row">Dernier commentaire <strong>{{ daysAgo(lastComment(selectedDetailEntry).createdAt) }}</strong></div>
            </div>
            <div v-if="lastComment(selectedDetailEntry)" class="ov-last-comment">
              <div class="ov-info-label">Dernier commentaire</div>
              <div class="ov-comment-text">{{ lastComment(selectedDetailEntry).text }}</div>
              <div class="ov-comment-meta">{{ lastComment(selectedDetailEntry).by }} · {{ formatDate(lastComment(selectedDetailEntry).createdAt) }}</div>
            </div>
          </template>

          <!-- Commentaires -->
          <template v-else-if="detailSection === 'comments'">
            <ul v-if="selectedDetailEntry.comments.length" class="comment-list">
              <li v-for="c in [...selectedDetailEntry.comments].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt))" :key="c.id" class="comment-item">
                <div class="comment-text">{{ c.text }}</div>
                <div class="comment-meta">{{ c.by }} · {{ formatDate(c.createdAt) }}</div>
              </li>
            </ul>
            <p v-else class="drawer-empty">Aucun commentaire pour l'instant.</p>
            <div class="comment-add">
              <textarea v-model="detailComment" rows="3" class="comment-textarea" placeholder="Ajouter un commentaire…"></textarea>
              <div class="comment-add-foot">
                <button type="button" class="btn-primary" :disabled="!detailComment.trim()" @click="addCommentFromDetails">
                  <svg viewBox="0 0 20 20" fill="currentColor"><path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z"/></svg>
                  Ajouter
                </button>
              </div>
            </div>
          </template>

          <!-- Tickets -->
          <template v-else-if="detailSection === 'tickets'">
            <ul v-if="getOpenTickets(selectedDetailEntry.client.pac).length" class="ticket-list">
              <li v-for="t in getOpenTickets(selectedDetailEntry.client.pac)" :key="t.NumeroTicket" class="ticket-item">
                <span class="ticket-num">{{ t.NumeroTicket }}</span>
                <span class="ticket-objet">{{ t.Objet }}</span>
                <span class="ticket-statut">{{ t.Statut }}</span>
              </li>
            </ul>
            <p v-else class="drawer-empty">Aucun ticket ouvert pour ce client.</p>
          </template>

          <!-- Historique -->
          <template v-else-if="detailSection === 'timeline'">
            <p v-if="!selectedTimelineEvents.length" class="drawer-empty">Aucun événement.</p>
            <div v-else class="timeline">
              <div v-for="event in selectedTimelineEvents" :key="event.id" class="timeline-item">
                <div class="timeline-dot" :class="`timeline-dot--${event.type}`"></div>
                <div class="timeline-content">
                  <div class="timeline-action">{{ event.action }}</div>
                  <div class="timeline-detail">
                    <span v-if="event.previousStatus && event.previousStatus !== '-'">{{ event.previousStatus }}</span>
                    <span v-if="event.nextStatus"> → {{ event.nextStatus }}</span>
                  </div>
                  <div class="timeline-meta">{{ event.by }} · {{ formatTimelineDate(event.at) }}</div>
                </div>
              </div>
            </div>
          </template>

        </div>
      </aside>

      <!-- Drawer placeholder -->
      <aside v-else class="drawer drawer--empty">
        <svg viewBox="0 0 48 48" fill="none"><circle cx="24" cy="24" r="22" stroke="#e2e8f0" stroke-width="2"/><path d="M16 24h16M24 16v16" stroke="#cbd5e1" stroke-width="2.5" stroke-linecap="round"/></svg>
        <p>Sélectionnez un client pour voir le détail.</p>
      </aside>

    </div>

    <!-- MODAL -->
    <div v-if="isModalOpen" class="overlay" @click.self="closeModal">
      <div class="modal">
        <div class="modal-head">
          <div>
            <h3 class="modal-title">{{ modalMode === 'create' ? 'Ajouter un client au suivi' : 'Modifier le suivi' }}</h3>
          </div>
          <button type="button" class="close-btn" @click="closeModal">✕</button>
        </div>
        <div class="modal-body">
          <div class="field">
            <span>Client</span>
            <div ref="clientWrap" class="autocomplete-wrap">
              <input
                v-model="clientQuery"
                type="text"
                :disabled="modalMode === 'edit'"
                placeholder="Rechercher (PAC, nom, BU)…"
                autocomplete="off"
                @focus="openClient"
                @input="openClient"
              />
              <div v-if="showClientDropdown && modalMode === 'create'" class="autocomplete-drop">
                <button
                  v-for="client in filteredClients" :key="client.pac"
                  type="button" class="drop-item"
                  @click="selectClient(client)"
                >
                  <span class="drop-pac">{{ client.pac }}</span>
                  {{ client.name }}{{ client.bu ? ` (${client.bu})` : '' }}
                </button>
                <div v-if="!filteredClients.length" class="drop-empty">Aucun résultat</div>
              </div>
            </div>
          </div>

          <div class="field">
            <span>Liste cible</span>
            <div class="status-pick">
              <button
                type="button" class="status-pick-btn"
                :class="{ 'active--sensible': selectedCategory === 'sensible' }"
                @click="selectedCategory = 'sensible'"
              >
                <span class="status-dot" style="background:#d97706;"></span> Sensible
              </button>
              <button
                type="button" class="status-pick-btn"
                :class="{ 'active--plan': selectedCategory === 'plan' }"
                @click="selectedCategory = 'plan'"
              >
                <span class="status-dot" style="background:#ea580c;"></span> Plan d'action
              </button>
            </div>
          </div>

          <div class="field">
            <span>Commentaire <span class="optional">(optionnel)</span></span>
            <textarea v-model="initialComment" rows="3" placeholder="Contexte, risque, action attendue…"></textarea>
          </div>

          <p v-if="errorMessage" class="form-error">{{ errorMessage }}</p>
        </div>
        <div class="modal-foot">
          <button type="button" class="btn-primary" @click="submitModal">
            {{ modalMode === 'create' ? 'Ajouter' : 'Enregistrer' }}
          </button>
          <button type="button" class="btn-ghost" @click="closeModal">Annuler</button>
        </div>
      </div>
    </div>

    <!-- TOAST -->
    <Transition name="toast">
      <div v-if="toast" class="toast">{{ toast }}</div>
    </Transition>

  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import api from "../services/api";

// ── State ──────────────────────────────────────────────────────────────────
const clients       = ref([]);
const trackedEntries = ref([]);
const tickets       = ref([]);

const filterQuery   = ref("");
const boardStatus   = ref("sensible");

const isModalOpen   = ref(false);
const modalMode     = ref("create");
const selectedPac   = ref("");
const selectedCategory = ref("sensible");
const initialComment = ref("");
const clientQuery   = ref("");
const errorMessage  = ref("");
const clientWrap    = ref(null);
const showClientDropdown = ref(false);

const selectedDetailId = ref(null);
const detailSection    = ref("overview");
const detailComment    = ref("");

const toast = ref(null);
let toastTimer = null;

// ── Toast ──────────────────────────────────────────────────────────────────
const showToast = (msg) => {
  if (toastTimer) clearTimeout(toastTimer);
  toast.value = msg;
  toastTimer = setTimeout(() => { toast.value = null; }, 2400);
};

// ── Helpers ────────────────────────────────────────────────────────────────
const normalize = (v) => String(v || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
const statusLabel = (s) => s === "sensible" ? "Sensible" : s === "plan" ? "Plan d'action" : "-";

const avatarColor = () => "#1a3a5c";
const initials = (name) => (name || "?").split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase() || "").join("") || "?";

const formatDate = (v) => { const d = new Date(v); return isNaN(d) ? "-" : d.toLocaleString("fr-FR"); };
const formatDateOnly = (v) => { const d = new Date(v); return isNaN(d) ? "-" : d.toLocaleDateString("fr-FR"); };
const formatTimelineDate = (v) => {
  const d = new Date(v); if (isNaN(d)) return "-";
  return d.toLocaleString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
};
const daysAgo = (v) => {
  const d = new Date(v); if (isNaN(d)) return "-";
  const days = Math.floor((Date.now() - d) / 86400000);
  if (days <= 0) return "aujourd'hui";
  if (days === 1) return "hier";
  if (days < 30) return `il y a ${days} j`;
  if (days < 365) return `il y a ${Math.floor(days / 30)} mois`;
  return `il y a ${Math.floor(days / 365)} an${days >= 730 ? "s" : ""}`;
};

const lastComment = (entry) => {
  const cs = entry?.comments || [];
  if (!cs.length) return null;
  return [...cs].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
};

const isOpenStatus = (status) => {
  const v = normalize(status);
  return !v || !(v.includes("ferme") || v.includes("closed") || v.includes("resolu") || v.includes("annule") || v.includes("cancel"));
};
const getOpenTickets = (pac) => {
  const key = normalize(pac);
  return tickets.value.filter(t => normalize(t?.CodeClient) === key && isOpenStatus(t?.Statut));
};

const getCurrentActor = () => {
  try { const u = JSON.parse(localStorage.getItem("user") || "{}"); return `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.userId || "Système"; }
  catch { return "Système"; }
};

// ── Timeline ───────────────────────────────────────────────────────────────
const timelineEvents = (entry) => {
  if (!entry) return [];
  const evts = [];
  if (entry.addedAt) evts.push({ id: `${entry.id}-added`, type: "added", at: entry.addedAt, by: entry.createdBy || "Système" });
  (entry.statusHistory || []).forEach(h => { if (h?.at) evts.push({ id: h.id, type: "status", at: h.at, status: h.status, by: h.by || "Système" }); });
  (entry.comments || []).forEach(c => { if (c?.createdAt) evts.push({ id: c.id, type: "comment", at: c.createdAt, text: c.text, by: c.by || "Système" }); });
  evts.sort((a, b) => new Date(a.at) - new Date(b.at));
  let cur = "";
  return evts.map(ev => {
    if (ev.type === "added") { cur = entry.status; return { ...ev, action: "Ajout client", previousStatus: "-", nextStatus: statusLabel(cur) }; }
    if (ev.type === "status") { const p = cur ? statusLabel(cur) : "-"; cur = ev.status; return { ...ev, action: "Mise à jour du statut", previousStatus: p, nextStatus: statusLabel(cur) }; }
    return { ...ev, action: ev.text || "Commentaire", previousStatus: cur ? statusLabel(cur) : "-", nextStatus: "" };
  });
};

// ── Computed ───────────────────────────────────────────────────────────────
const mergedEntries = computed(() =>
  trackedEntries.value.filter(e => e.status === "sensible" || e.status === "plan").map(e => {
    const src = clients.value.find(c => c.pac === e.client.pac);
    return src ? { ...e, client: { pac: src.pac, name: src.name, bu: src.bu || "" } } : e;
  })
);

const filteredEntries = computed(() => {
  const q = normalize(filterQuery.value);
  return mergedEntries.value.filter(e =>
    !q || normalize(e.client.name).includes(q) || normalize(e.client.pac).includes(q) || normalize(e.client.bu).includes(q)
  );
});

const boardEntries = computed(() => filteredEntries.value.filter(e => e.status === boardStatus.value));

const sensiblesTotal  = computed(() => mergedEntries.value.filter(e => e.status === "sensible").length);
const plansTotal      = computed(() => mergedEntries.value.filter(e => e.status === "plan").length);
const totalOpenTickets = computed(() => mergedEntries.value.reduce((sum, e) => sum + getOpenTickets(e.client.pac).length, 0));
const addedThisMonth  = computed(() => {
  const now = new Date();
  return mergedEntries.value.filter(e => { const d = new Date(e.addedAt); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); }).length;
});

const selectedDetailEntry = computed(() => mergedEntries.value.find(e => e.id === selectedDetailId.value) || null);
const selectedTimelineEvents = computed(() => timelineEvents(selectedDetailEntry.value));

const filteredClients = computed(() => {
  const q = normalize(clientQuery.value);
  return (!q ? clients.value : clients.value.filter(c => normalize(c.pac).includes(q) || normalize(c.name).includes(q) || normalize(c.bu).includes(q))).slice(0, 50);
});

// ── API ────────────────────────────────────────────────────────────────────
const restoreTracked = async () => {
  try { trackedEntries.value = (await api.get("/suivi")).data ?? []; } catch { trackedEntries.value = []; }
};
const loadClients = async () => {
  try { clients.value = (await api.get("/clients")).data?.clients || []; } catch { clients.value = []; }
};
const loadTickets = async () => {
  try {
    const res = await api.get("/tickets/db", { params: { limit: 5000 } });
    tickets.value = res.data.tickets ?? (Array.isArray(res.data) ? res.data : []);
  } catch { tickets.value = []; }
};

// ── Actions ────────────────────────────────────────────────────────────────
const selectEntry = (entry) => { selectedDetailId.value = entry.id; detailSection.value = "overview"; };

const openClient = () => { showClientDropdown.value = true; };
const selectClient = (c) => {
  selectedPac.value = c.pac;
  clientQuery.value = `${c.pac} — ${c.name}${c.bu ? ` (${c.bu})` : ""}`;
  showClientDropdown.value = false;
};

const resetModalForm = () => { selectedPac.value = ""; selectedCategory.value = "sensible"; initialComment.value = ""; clientQuery.value = ""; errorMessage.value = ""; showClientDropdown.value = false; };
const openAddModal  = () => { modalMode.value = "create"; isModalOpen.value = true; resetModalForm(); };
const openEditModal = (entry) => {
  modalMode.value = "edit"; isModalOpen.value = true;
  selectedPac.value = entry.client.pac; selectedCategory.value = entry.status; initialComment.value = "";
  clientQuery.value = `${entry.client.pac} — ${entry.client.name}${entry.client.bu ? ` (${entry.client.bu})` : ""}`;
  showClientDropdown.value = false; errorMessage.value = "";
};
const closeModal = () => { isModalOpen.value = false; resetModalForm(); };

const upsertTrackedEntry = async ({ pac, status, commentText }) => {
  const src = clients.value.find(c => c.pac === pac);
  if (!src) return "";
  const actor = getCurrentActor();
  const existing = trackedEntries.value.find(e => e.client.pac === pac);
  const id = existing ? existing.id : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const addedAt = existing ? existing.addedAt : new Date().toISOString();
  const commentId = commentText ? `${Date.now()}-${Math.random().toString(16).slice(2)}` : null;
  const historyId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  try {
    const res = await api.post("/suivi", { id, pac, clientName: src.name, clientBu: src.bu || "", status, addedAt, createdBy: actor, comment: commentText || null, commentId, historyId });
    if (existing) { trackedEntries.value = trackedEntries.value.map(e => e.id === id ? res.data : e); }
    else { trackedEntries.value.unshift(res.data); }
    return id;
  } catch { return ""; }
};

const submitModal = async () => {
  errorMessage.value = "";
  if (!selectedPac.value) { errorMessage.value = "Sélectionnez un client."; return; }
  const updatedId = await upsertTrackedEntry({ pac: selectedPac.value, status: selectedCategory.value, commentText: (initialComment.value || "").trim() });
  if (!updatedId) { errorMessage.value = "Client introuvable dans la base."; return; }
  closeModal();
  showToast(modalMode.value === "create" ? "Client ajouté au suivi" : "Suivi mis à jour");
};

const removeClient = async (id) => {
  if (!confirm("Retirer ce client du suivi ?")) return;
  try {
    await api.delete(`/suivi/${id}`);
    trackedEntries.value = trackedEntries.value.filter(e => e.id !== id);
    if (selectedDetailId.value === id) selectedDetailId.value = null;
    showToast("Client retiré du suivi");
  } catch {}
};

const addCommentFromDetails = async () => {
  if (!selectedDetailEntry.value) return;
  const text = (detailComment.value || "").trim();
  if (!text) return;
  const updatedId = await upsertTrackedEntry({ pac: selectedDetailEntry.value.client.pac, status: selectedDetailEntry.value.status, commentText: text });
  if (updatedId) { selectedDetailId.value = updatedId; detailSection.value = "comments"; }
  detailComment.value = "";
  showToast("Commentaire ajouté");
};

// ── Click outside dropdown ─────────────────────────────────────────────────
const handleClickOutside = (e) => { if (clientWrap.value && !clientWrap.value.contains(e.target)) showClientDropdown.value = false; };
watch(clientQuery, (v) => { if (!selectedPac.value) return; if (!normalize(v).includes(normalize(selectedPac.value))) selectedPac.value = ""; });
watch(boardEntries, (entries) => {
  if (!entries.some(e => e.id === selectedDetailId.value)) {
    selectedDetailId.value = entries[0]?.id || null;
    detailSection.value = "overview";
  }
}, { immediate: true });

onMounted(async () => { await restoreTracked(); await loadTickets(); loadClients(); document.addEventListener("click", handleClickOutside); });
onBeforeUnmount(() => document.removeEventListener("click", handleClickOutside));
</script>

<style scoped>
.page {
  display: flex; flex-direction: column; gap: 16px;
  margin: -24px; padding: 24px 28px 48px;
  min-height: calc(100% + 48px); background: #f8fafc; box-sizing: border-box;
}

/* ── HEADER ──────────────────── */
.page-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; }
.eyebrow { font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #94a3b8; margin-bottom: 4px; }
h1 { font-size: 26px; font-weight: 800; color: #0f172a; letter-spacing: -0.02em; margin: 0; }

/* ── BUTTONS ─────────────────── */
.btn-primary {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 9px 16px; background: #1a3a5c; color: #fff;
  border: none; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit;
}
.btn-primary svg { width: 14px; height: 14px; }
.btn-primary:hover { background: #2e5f8a; }
.btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }
.btn-ghost {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 14px; border: 1px solid #e2e8f0; background: #fff;
  border-radius: 8px; font-size: 13px; color: #475569; cursor: pointer; font-family: inherit;
}
.btn-ghost:hover { background: #f8fafc; }
.btn-icon {
  width: 30px; height: 30px; display: flex; align-items: center; justify-content: center;
  border: 1px solid #e2e8f0; background: #fff; border-radius: 7px; cursor: pointer; color: #64748b;
  transition: background 0.12s, color 0.12s;
}
.btn-icon svg { width: 13px; height: 13px; }
.btn-icon:hover { background: #f1f5f9; color: #1e293b; }
.btn-icon--danger:hover { background: #fee2e2; color: #dc2626; border-color: #fecaca; }

/* ── STATS BAR ───────────────── */
.stats-bar { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
.stat-card {
  background: #fff; border: 1px solid #e2e8f0; border-radius: 10px;
  padding: 10px 14px; display: flex; align-items: center; gap: 12;
  box-shadow: 0 1px 2px rgba(15,23,42,0.04);
  display: flex; align-items: center; gap: 12px;
}
.stat-icon {
  width: 36px; height: 36px; border-radius: 8px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  font-size: 16px; font-weight: 700;
}
.stat-lbl { font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; line-height: 1.3; }

/* ── MAIN LAYOUT ─────────────── */
.main-layout { display: grid; grid-template-columns: 1fr 560px; gap: 14px; flex: 1; min-height: 0; height: calc(100vh - 260px); }

/* ── LIST PANEL ──────────────── */
.list-panel {
  background: #fff; border: 1px solid #e2e8f0; border-radius: 12px;
  display: flex; flex-direction: column; overflow: hidden;
  box-shadow: 0 4px 12px rgba(15,23,42,0.04);
}

.tabs-row {
  display: flex; padding: 12px 14px 0; border-bottom: 1px solid #f1f5f9;
}
.tab-btn {
  display: inline-flex; align-items: center; gap: 7px;
  padding: 8px 16px 11px; border: none; background: transparent;
  font-size: 14px; font-weight: 600; cursor: pointer; font-family: inherit;
  color: #64748b; border-bottom: 2px solid transparent; margin-bottom: -1px;
  transition: color 0.15s;
}
.tab-btn.active { color: #0f172a; border-bottom-color: #d97706; }
.tab-btn.active--plan { border-bottom-color: #ea580c; }
.tab-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.tab-count {
  font-size: 11px; font-weight: 700; background: #e2e8f0; color: #475569;
  border-radius: 10px; padding: 1px 7px;
}
.tab-count--active { background: #1a3a5c; color: #fff; }

.list-search-wrap { position: relative; padding: 10px 14px; border-bottom: 1px solid #f1f5f9; }
.list-search-icon { position: absolute; left: 24px; top: 50%; transform: translateY(-50%); width: 14px; height: 14px; color: #94a3b8; pointer-events: none; }
.list-search-input {
  width: 100%; padding: 8px 10px 8px 32px; border: 1px solid #e2e8f0;
  border-radius: 8px; font-size: 13px; background: #f8fafc; font-family: inherit; outline: none;
}
.list-search-input:focus { border-color: #1a3a5c; background: #fff; }

.list-rows { flex: 1; overflow-y: auto; }
.list-empty { padding: 48px 20px; text-align: center; font-size: 13px; color: #94a3b8; }

.list-row {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 16px; cursor: pointer; border-bottom: 1px solid #f1f5f9;
  border-left: 3px solid transparent;
  transition: background 0.1s;
}
.list-row:hover { background: #f8fafc; }
.list-row--selected { background: rgba(26,58,92,0.05); border-left-color: #1a3a5c; }

.row-avatar {
  width: 42px; height: 42px; border-radius: 50%; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  color: #fff; font-size: 15px; font-weight: 700; letter-spacing: 0.02em;
}
.row-info { flex: 1; min-width: 0; }
.row-name-line { display: flex; align-items: center; gap: 7px; flex-wrap: wrap; margin-bottom: 3px; }
.row-name { font-size: 14px; font-weight: 700; color: #0f172a; }
.row-pac { font-family: monospace; font-size: 11px; font-weight: 600; background: #f1f5f9; color: #475569; padding: 1px 6px; border-radius: 4px; }
.row-bu { font-size: 11.5px; color: #64748b; }
.row-comment { font-size: 12.5px; color: #64748b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.row-comment--empty { font-style: italic; color: #94a3b8; }
.row-right { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; flex-shrink: 0; }
.row-tickets {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 11px; font-weight: 700; color: #dc2626;
  background: #fee2e2; padding: 3px 8px; border-radius: 6px;
}
.row-tickets svg { width: 11px; height: 11px; }
.row-no-ticket { font-size: 11px; color: #94a3b8; }
.row-age { font-size: 11px; color: #94a3b8; }

/* ── DRAWER ──────────────────── */
.drawer {
  background: #fff; border: 1px solid #e2e8f0; border-radius: 12px;
  display: flex; flex-direction: column; overflow: hidden;
  box-shadow: 0 4px 12px rgba(15,23,42,0.04);
}
.drawer--empty {
  align-items: center; justify-content: center;
  gap: 12px; color: #94a3b8; font-size: 14px; text-align: center; padding: 40px;
}
.drawer--empty svg { width: 52px; height: 52px; }

.drawer-head { padding: 14px 16px 12px; border-bottom: 1px solid #f1f5f9; display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
.drawer-head-left { display: flex; align-items: center; gap: 12px; }
.drawer-avatar {
  width: 42px; height: 42px; border-radius: 50%; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  color: #fff; font-size: 15px; font-weight: 700;
}
.drawer-name { font-size: 15px; font-weight: 700; color: #0f172a; margin-bottom: 3px; }
.drawer-meta { display: flex; gap: 10px; font-size: 12px; color: #64748b; flex-wrap: wrap; }
.meta-label { color: #94a3b8; }
.drawer-head-actions { display: flex; gap: 4px; flex-shrink: 0; }

.drawer-tabs { display: flex; padding: 0 16px; border-bottom: 1px solid #f1f5f9; gap: 2px; }
.drawer-tab {
  padding: 10px 12px 8px; border: none; background: transparent;
  font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit;
  color: #64748b; border-bottom: 2px solid transparent; margin-bottom: -1px;
  display: inline-flex; align-items: center; gap: 5px;
}
.drawer-tab.active { color: #0f2742; border-bottom-color: #0f2742; }
.drawer-tab-count {
  font-size: 10.5px; font-weight: 700; background: #e2e8f0; color: #475569;
  border-radius: 8px; padding: 1px 6px; min-width: 18px; text-align: center;
}
.drawer-tab.active .drawer-tab-count { background: #0f2742; color: #fff; }

.drawer-body { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 14px; }
.drawer-empty { font-size: 13px; color: #94a3b8; text-align: center; padding: 24px 0; }

/* Overview */
.overview-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.ov-stat { border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px 12px; background: #f8fafc; }
.ov-stat-num { font-size: 20px; font-weight: 700; line-height: 1; }
.ov-stat-lbl { font-size: 10.5px; color: #64748b; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 700; margin-top: 5px; }
.ov-info { display: flex; flex-direction: column; gap: 4px; }
.ov-info-label { font-size: 10.5px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 4px; }
.ov-info-row { font-size: 13px; color: #475569; line-height: 1.6; }
.ov-last-comment { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 14px; }
.ov-comment-text { font-size: 13.5px; color: #0f172a; line-height: 1.5; margin-bottom: 6px; }
.ov-comment-meta { font-size: 11.5px; color: #94a3b8; }

/* Comments */
.comment-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 10px; }
.comment-item { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 11px 13px; }
.comment-text { font-size: 13.5px; color: #0f172a; line-height: 1.5; margin-bottom: 6px; }
.comment-meta { display: flex; justify-content: space-between; font-size: 11.5px; color: #94a3b8; }
.comment-add { border-top: 1px solid #f1f5f9; padding-top: 12px; display: flex; flex-direction: column; gap: 8px; }
.comment-textarea {
  width: 100%; padding: 9px 11px; border: 1px solid #e2e8f0; border-radius: 8px;
  font-size: 13px; font-family: inherit; resize: vertical; outline: none; box-sizing: border-box;
}
.comment-textarea:focus { border-color: #1a3a5c; }
.comment-add-foot { display: flex; justify-content: flex-end; }

/* Tickets */
.ticket-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px; }
.ticket-item {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px;
}
.ticket-num { font-family: monospace; font-size: 12px; font-weight: 600; color: #1a3a5c; background: #e0e7ef; padding: 3px 7px; border-radius: 5px; flex-shrink: 0; }
.ticket-objet { flex: 1; font-size: 13px; color: #0f172a; }
.ticket-statut { font-size: 11px; font-weight: 700; color: #dc2626; background: #fee2e2; padding: 2px 8px; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.04em; flex-shrink: 0; }

/* Timeline */
.timeline { display: flex; flex-direction: column; gap: 0; position: relative; padding-left: 18px; }
.timeline::before { content: ""; position: absolute; left: 5px; top: 8px; bottom: 8px; width: 2px; background: #e2e8f0; border-radius: 1px; }
.timeline-item { display: flex; gap: 12px; padding: 0 0 16px; position: relative; }
.timeline-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; margin-top: 4px; position: absolute; left: -18px; border: 2px solid #fff; }
.timeline-dot--added   { background: #1a3a5c; }
.timeline-dot--status  { background: #16a34a; }
.timeline-dot--comment { background: #94a3b8; }
.timeline-content { padding-left: 2px; }
.timeline-action { font-size: 13px; font-weight: 600; color: #0f172a; margin-bottom: 2px; }
.timeline-detail { font-size: 12px; color: #64748b; margin-bottom: 3px; }
.timeline-meta { font-size: 11.5px; color: #94a3b8; }

/* ── MODAL ───────────────────── */
.overlay { position: fixed; inset: 0; background: rgba(15,23,42,0.4); display: flex; align-items: center; justify-content: center; z-index: 200; padding: 24px; }
.modal { background: #fff; border-radius: 14px; width: 520px; max-width: 100%; box-shadow: 0 24px 60px rgba(15,23,42,0.25); display: flex; flex-direction: column; max-height: 90vh; }
.modal-head { display: flex; align-items: center; justify-content: space-between; padding: 20px 22px 14px; border-bottom: 1px solid #f1f5f9; }
.modal-title { font-size: 17px; font-weight: 700; color: #0f172a; margin: 0; }
.close-btn { border: none; background: none; font-size: 17px; color: #94a3b8; cursor: pointer; line-height: 1; }
.close-btn:hover { color: #1e293b; }
.modal-body { padding: 18px 22px; display: flex; flex-direction: column; gap: 14px; overflow-y: auto; }
.modal-foot { display: flex; gap: 8px; padding: 14px 22px; border-top: 1px solid #f1f5f9; }
.form-error { font-size: 12px; color: #dc2626; margin: 0; }

.field { display: flex; flex-direction: column; gap: 5px; }
.field > span { font-size: 12px; font-weight: 600; color: #475569; }
.field input, .field select, .field textarea {
  padding: 9px 12px; border: 1px solid #e2e8f0; border-radius: 8px;
  font-size: 13px; background: #f8fafc; color: #1e293b; font-family: inherit;
}
.field input:focus, .field select:focus, .field textarea:focus { outline: none; border-color: #1a3a5c; background: #fff; }
.field input:disabled { opacity: 0.6; cursor: not-allowed; }
.field textarea { resize: vertical; }
.optional { font-weight: 400; color: #94a3b8; }

.status-pick { display: flex; gap: 8px; }
.status-pick-btn {
  flex: 1; padding: 10px 14px; border: 1px solid #e2e8f0; background: #fff;
  border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 600;
  font-family: inherit; color: #475569; display: flex; align-items: center; justify-content: center; gap: 7px;
  transition: border-color 0.12s, background 0.12s, color 0.12s;
}
.status-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.active--sensible { border-color: #d97706; background: #fffbeb; color: #92400e; }
.active--plan     { border-color: #ea580c; background: #fff7ed; color: #9a3412; }

.autocomplete-wrap { position: relative; }
.autocomplete-wrap input { width: 100%; box-sizing: border-box; padding: 9px 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 13px; background: #f8fafc; color: #1e293b; font-family: inherit; }
.autocomplete-wrap input:focus { outline: none; border-color: #1a3a5c; background: #fff; }
.autocomplete-drop {
  position: absolute; top: calc(100% + 4px); left: 0; right: 0;
  background: #fff; border: 1px solid #e2e8f0; border-radius: 8px;
  max-height: 240px; overflow-y: auto; box-shadow: 0 8px 20px rgba(15,23,42,0.12); z-index: 10;
}
.drop-item {
  display: block; width: 100%; text-align: left; padding: 9px 12px;
  border: none; background: transparent; cursor: pointer;
  font-size: 13px; font-family: inherit; border-bottom: 1px solid #f1f5f9; color: #0f172a;
}
.drop-item:hover { background: #f8fafc; }
.drop-pac { font-family: monospace; font-weight: 600; color: #1a3a5c; margin-right: 6px; }
.drop-empty { padding: 12px; font-size: 13px; color: #94a3b8; text-align: center; }

/* ── TOAST ───────────────────── */
.toast {
  position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
  padding: 11px 20px; border-radius: 10px; font-size: 13px; font-weight: 600;
  background: #0f2742; color: #fff; box-shadow: 0 8px 24px rgba(0,0,0,0.15); z-index: 500; white-space: nowrap;
}
.toast-enter-active, .toast-leave-active { transition: opacity 0.25s, transform 0.25s; }
.toast-enter-from { opacity: 0; transform: translateX(-50%) translateY(8px); }
.toast-leave-to  { opacity: 0; transform: translateX(-50%) translateY(8px); }
</style>

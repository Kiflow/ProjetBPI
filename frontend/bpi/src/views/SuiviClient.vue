<template>
  <div class="page">
    <section class="page-head">
      <div>
        <p class="eyebrow">Info client</p>
        <h1>Suivi client</h1>
      </div>
      <button class="primary add-trigger" type="button" @click="openAddModal">
        + Ajouter un client
      </button>
    </section>

    <section class="toolbar card">
      <div class="filters">
        <label class="field">
          <span>Recherche client</span>
          <input v-model="filterQuery" type="search" placeholder="Nom, PAC, BU..." />
        </label>

        <label class="field">
          <span>Tickets ouverts</span>
          <select v-model="filterTickets">
            <option value="all">Tous</option>
            <option value="with">Avec tickets</option>
            <option value="without">Sans ticket</option>
          </select>
        </label>

        <label class="field">
          <span>Date d'ajout</span>
          <input v-model="filterAddedDate" type="date" />
        </label>
      </div>

      <div class="view-toggle">
        <button
          type="button"
          class="toggle-btn"
          :class="{ active: viewMode === 'compact' }"
          @click="viewMode = 'compact'"
        >
          Vue compacte
        </button>
        <button
          type="button"
          class="toggle-btn"
          :class="{ active: viewMode === 'detailed' }"
          @click="viewMode = 'detailed'"
        >
          Vue detaillee
        </button>
      </div>
    </section>

    <section class="kanban card">
      <div class="status-switch">
        <button
          type="button"
          class="status-tab"
          :class="{ active: boardStatus === 'sensible' }"
          @click="boardStatus = 'sensible'"
        >
          Sensible
        </button>
        <button
          type="button"
          class="status-tab"
          :class="{ active: boardStatus === 'plan' }"
          @click="boardStatus = 'plan'"
        >
          Plan d'action
        </button>
        <span
          class="status-switch-indicator"
          :style="{ transform: boardStatus === 'sensible' ? 'translateX(0%)' : 'translateX(100%)' }"
        />
      </div>

      <div class="kanban-layout">
        <article class="column">
          <div class="column-head">
            <h3>{{ boardStatus === "sensible" ? "Sensible" : "Plan d'action" }}</h3>
            <span class="count">{{ boardEntries.length }}</span>
          </div>

          <p v-if="!boardEntries.length" class="empty">Aucune carte.</p>

          <div v-for="entry in boardEntries" :key="entry.id" class="client-card" :class="`status-${entry.status}`">
            <div class="client-main">
              <div>
                <h4>{{ entry.client.name }}</h4>
                <p class="meta">
                  PAC {{ entry.client.pac }}
                  <span v-if="entry.client.bu">| BU {{ entry.client.bu }}</span>
                  <span v-if="entry.addedAt">| Ajoute le {{ formatDate(entry.addedAt) }}</span>
                </p>
              </div>
              <span class="status-chip" :class="`status-${entry.status}`">
                {{ statusLabel(entry.status) }}
              </span>
            </div>

            <div class="client-stats">
              <span class="ticket-indicator">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M4 7h16v4a2 2 0 0 0 0 4v4H4v-4a2 2 0 0 0 0-4V7zm5 2v8h2V9H9zm4 0v8h2V9h-2z" />
                </svg>
                {{ getOpenTickets(entry.client.pac).length }} tickets ouverts
              </span>
              <button class="comment-link" type="button" @click="openClientDetails(entry, 'comments')">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M4 5h16a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H8l-4 3v-3H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z" />
                </svg>
                commentaires ({{ entry.comments.length }})
              </button>
            </div>

            <div class="card-actions">
              <button type="button" class="ghost" @click="openClientDetails(entry, 'timeline')">Voir</button>
              <button type="button" class="ghost" @click="openEditModal(entry)">Modifier</button>
              <button type="button" class="danger" @click="removeClient(entry.id)">Supprimer</button>
            </div>

            <div v-if="viewMode === 'detailed'" class="timeline">
              <div class="timeline-row">
                <span class="dot" />
                <div>
                  <strong>Date d'ajout</strong>
                  <p>{{ entry.addedAt ? formatDate(entry.addedAt) : "Non ajoute via suivi" }}</p>
                </div>
              </div>
              <div class="timeline-row">
                <span class="dot" />
                <div>
                  <strong>Tickets ouverts</strong>
                  <p>{{ getOpenTickets(entry.client.pac).length }}</p>
                </div>
              </div>
              <div class="timeline-row">
                <span class="dot" />
                <div>
                  <strong>Passages de statut</strong>
                  <p>{{ entry.statusHistory.length }}</p>
                </div>
              </div>
            </div>
          </div>
        </article>

        <aside class="details-panel">
          <div class="drawer-head">
            <h3>{{ selectedDetailEntry?.client?.name || "Details client" }}</h3>
          </div>

          <p v-if="selectedDetailEntry" class="meta">
            PAC {{ selectedDetailEntry.client.pac }}
            <span v-if="selectedDetailEntry.client.bu">| BU {{ selectedDetailEntry.client.bu }}</span>
          </p>
          <p v-else class="empty">Cliquez sur Voir ou commentaires pour afficher les details.</p>

          <template v-if="selectedDetailEntry">
            <section class="drawer-section" :class="{ focused: detailSection === 'timeline' }">
              <h4>Timeline</h4>
              <div class="timeline">
                <div class="timeline-row">
                  <span class="dot" />
                  <div>
                    <strong>Date d'ajout</strong>
                    <p>{{ selectedDetailEntry.addedAt ? formatDate(selectedDetailEntry.addedAt) : "-" }}</p>
                  </div>
                </div>
                <div class="timeline-row">
                  <span class="dot" />
                  <div>
                    <strong>Tickets ouverts</strong>
                    <p>{{ getOpenTickets(selectedDetailEntry.client.pac).length }}</p>
                  </div>
                </div>
                <div class="timeline-row" v-for="history in selectedDetailEntry.statusHistory" :key="history.id">
                  <span class="dot" />
                  <div>
                    <strong>Statut: {{ statusLabel(history.status) }}</strong>
                    <p>{{ formatDate(history.at) }}</p>
                  </div>
                </div>
              </div>
            </section>

            <section class="drawer-section" :class="{ focused: detailSection === 'comments' }">
              <h4>Commentaires ({{ selectedDetailEntry.comments.length }})</h4>
              <ul v-if="selectedDetailEntry.comments.length" class="comment-list">
                <li v-for="comment in selectedDetailEntry.comments" :key="comment.id">
                  <p>{{ comment.text }}</p>
                  <small>{{ formatDate(comment.createdAt) }}</small>
                </li>
              </ul>
              <p v-else class="empty-mini">Aucun commentaire.</p>

              <label class="field">
                <span>Ajouter un commentaire</span>
                <textarea v-model="detailComment" rows="3" placeholder="Nouveau commentaire..." />
              </label>
              <button class="primary" type="button" @click="addCommentFromDetails">Ajouter</button>
            </section>
          </template>
        </aside>
      </div>
    </section>

    <div v-if="isModalOpen" class="overlay" @click="closeModal" />
    <div v-if="isModalOpen" class="modal card" role="dialog" aria-modal="true">
      <div class="modal-head">
        <h3>{{ modalMode === "create" ? "Ajouter un client" : "Modifier le client" }}</h3>
        <button type="button" class="close-x" @click="closeModal">x</button>
      </div>

      <div class="modal-grid">
        <label class="field">
          <span>Client</span>
          <div ref="clientWrap" class="filter-select">
            <input
              v-model="clientQuery"
              type="text"
              :disabled="modalMode === 'edit'"
              placeholder="Rechercher un client (PAC, nom, BU)..."
              autocomplete="off"
              @focus="openClient"
              @click="openClient"
              @input="openClient"
            />
            <div v-if="showClientDropdown && modalMode === 'create'" class="dropdown">
              <button
                v-for="client in filteredClients"
                :key="client.pac"
                type="button"
                class="dropdown-item"
                @click="selectClient(client)"
              >
                {{ client.pac }} - {{ client.name }}{{ client.bu ? ` (${client.bu})` : "" }}
              </button>
              <div v-if="filteredClients.length === 0" class="dropdown-empty">Aucun resultat</div>
            </div>
          </div>
        </label>

        <label class="field">
          <span>Liste cible</span>
          <select v-model="selectedCategory">
            <option value="sensible">Sensible</option>
            <option value="plan">Plan d'action</option>
          </select>
        </label>

        <label class="field field-wide">
          <span>Commentaire initial</span>
          <textarea
            v-model="initialComment"
            rows="3"
            placeholder="Contexte, risque, action attendue..."
          />
        </label>
      </div>

      <div class="modal-actions">
        <button class="primary" type="button" @click="submitModal">
          {{ modalMode === "create" ? "Ajouter" : "Enregistrer" }}
        </button>
        <button class="ghost" type="button" @click="closeModal">Annuler</button>
      </div>
      <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import api from "../services/api";

const TRACKED_KEY = "suivi-client-tracked-v2";
const LEGACY_KEY = "suivi-client-lists";

const clients = ref([]);
const trackedEntries = ref([]);
const tickets = ref([]);

const filterQuery = ref("");
const filterTickets = ref("all");
const filterAddedDate = ref("");
const viewMode = ref("compact");
const boardStatus = ref("sensible");

const isModalOpen = ref(false);
const modalMode = ref("create");
const editingId = ref(null);
const selectedPac = ref("");
const selectedCategory = ref("sensible");
const initialComment = ref("");
const clientQuery = ref("");
const errorMessage = ref("");

const clientWrap = ref(null);
const showClientDropdown = ref(false);

const selectedDetailId = ref(null);
const detailSection = ref("timeline");
const detailComment = ref("");

const normalize = (value) =>
  String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

const statusLabel = (status) => {
  if (status === "sensible") return "Sensible";
  if (status === "plan") return "Plan d'action";
  return "-";
};

const formatDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("fr-FR");
};

const isOpenStatus = (status) => {
  const value = normalize(status);
  if (!value) return true;
  return !(
    value.includes("ferme") ||
    value.includes("closed") ||
    value.includes("resolu") ||
    value.includes("resolved") ||
    value.includes("annule") ||
    value.includes("cancel")
  );
};

const getOpenTickets = (pac) => {
  const pacKey = normalize(pac);
  return tickets.value.filter((ticket) => {
    const codeClient = normalize(ticket?.CodeClient);
    return codeClient === pacKey && isOpenStatus(ticket?.Statut);
  });
};

const mergedEntries = computed(() => {
  return trackedEntries.value
    .filter((entry) => entry.status === "sensible" || entry.status === "plan")
    .map((entry) => {
      const sourceClient = clients.value.find((client) => client.pac === entry.client.pac);
      if (!sourceClient) return entry;
      return {
        ...entry,
        client: {
          pac: sourceClient.pac,
          name: sourceClient.name,
          bu: sourceClient.bu || ""
        }
      };
    });
});

const filteredEntries = computed(() => {
  return mergedEntries.value.filter((entry) => {
    const q = normalize(filterQuery.value);
    const textMatch =
      !q ||
      normalize(entry.client.name).includes(q) ||
      normalize(entry.client.pac).includes(q) ||
      normalize(entry.client.bu).includes(q);

    const ticketCount = getOpenTickets(entry.client.pac).length;
    const ticketMatch =
      filterTickets.value === "all" ||
      (filterTickets.value === "with" && ticketCount > 0) ||
      (filterTickets.value === "without" && ticketCount === 0);

    let dateMatch = true;
    if (filterAddedDate.value) {
      if (!entry.addedAt) {
        dateMatch = false;
      } else {
        const day = new Date(entry.addedAt).toISOString().slice(0, 10);
        dateMatch = day === filterAddedDate.value;
      }
    }

    return textMatch && ticketMatch && dateMatch;
  });
});

const boardEntries = computed(() => filteredEntries.value.filter((entry) => entry.status === boardStatus.value));

const selectedDetailEntry = computed(() =>
  mergedEntries.value.find((entry) => entry.id === selectedDetailId.value) || null
);

const filteredClients = computed(() => {
  const q = normalize(clientQuery.value);
  if (!q) return clients.value.slice(0, 250);
  return clients.value
    .filter((client) => {
      const pac = normalize(client.pac);
      const name = normalize(client.name);
      const bu = normalize(client.bu);
      return pac.includes(q) || name.includes(q) || bu.includes(q);
    })
    .slice(0, 250);
});

const persistTracked = () => {
  localStorage.setItem(TRACKED_KEY, JSON.stringify(trackedEntries.value));
};

const restoreTracked = () => {
  try {
    const raw = JSON.parse(localStorage.getItem(TRACKED_KEY) || "[]");
    if (Array.isArray(raw) && raw.length) {
      trackedEntries.value = raw;
      return;
    }
  } catch {
    trackedEntries.value = [];
  }

  // Migration depuis l'ancien format.
  try {
    const old = JSON.parse(localStorage.getItem(LEGACY_KEY) || "{}");
    const sensible = Array.isArray(old.sensibleList) ? old.sensibleList : [];
    const plan = Array.isArray(old.planList) ? old.planList : [];
    const merged = [...sensible.map((x) => ({ ...x, status: "sensible" })), ...plan.map((x) => ({ ...x, status: "plan" }))];

    trackedEntries.value = merged.map((entry) => ({
      id: entry.id || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      addedAt: entry.addedAt || new Date().toISOString(),
      status: entry.status,
      comments: entry.comment
        ? [
            {
              id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
              text: entry.comment,
              createdAt: entry.addedAt || new Date().toISOString()
            }
          ]
        : [],
      statusHistory: [
        {
          id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
          status: entry.status,
          at: entry.addedAt || new Date().toISOString()
        }
      ],
      client: {
        pac: entry.client?.pac || "",
        name: entry.client?.name || "",
        bu: entry.client?.bu || ""
      }
    }));
  } catch {
    trackedEntries.value = [];
  }
};

const loadClients = async () => {
  errorMessage.value = "";
  try {
    const response = await api.get("/clients");
    clients.value = response.data?.clients || [];
  } catch (error) {
    clients.value = [];
    errorMessage.value = error?.response?.data?.message || "Impossible de charger la base clients.";
  }
};

const loadTickets = () => {
  try {
    tickets.value = JSON.parse(localStorage.getItem("tickets") || "[]");
  } catch {
    tickets.value = [];
  }
};

const openClient = () => {
  showClientDropdown.value = true;
};

const selectClient = (client) => {
  selectedPac.value = client.pac;
  clientQuery.value = `${client.pac} - ${client.name}${client.bu ? ` (${client.bu})` : ""}`;
  showClientDropdown.value = false;
};

const resetModalForm = () => {
  editingId.value = null;
  selectedPac.value = "";
  selectedCategory.value = "sensible";
  initialComment.value = "";
  clientQuery.value = "";
  errorMessage.value = "";
  showClientDropdown.value = false;
};

const openAddModal = () => {
  modalMode.value = "create";
  isModalOpen.value = true;
  resetModalForm();
};

const openEditModal = (entry) => {
  modalMode.value = "edit";
  isModalOpen.value = true;
  editingId.value = entry.id;
  selectedPac.value = entry.client.pac;
  selectedCategory.value = entry.status;
  initialComment.value = "";
  clientQuery.value = `${entry.client.pac} - ${entry.client.name}${entry.client.bu ? ` (${entry.client.bu})` : ""}`;
  showClientDropdown.value = false;
  errorMessage.value = "";
};

const closeModal = () => {
  isModalOpen.value = false;
  resetModalForm();
};

const upsertTrackedEntry = ({ pac, status, commentText }) => {
  const sourceClient = clients.value.find((client) => client.pac === pac);
  if (!sourceClient) return "";

  const existing = trackedEntries.value.find((entry) => entry.client.pac === pac);
  if (!existing) {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    trackedEntries.value.unshift({
      id,
      addedAt: new Date().toISOString(),
      status,
      comments: commentText
        ? [
            {
              id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
              text: commentText,
              createdAt: new Date().toISOString()
            }
          ]
        : [],
      statusHistory: [
        {
          id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
          status,
          at: new Date().toISOString()
        }
      ],
      client: {
        pac: sourceClient.pac,
        name: sourceClient.name,
        bu: sourceClient.bu || ""
      }
    });
    return id;
  }

  const now = new Date().toISOString();
  trackedEntries.value = trackedEntries.value.map((entry) => {
    if (entry.client.pac !== pac) return entry;

    const nextComments = [...entry.comments];
    if (commentText) {
      nextComments.push({
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        text: commentText,
        createdAt: now
      });
    }

    const nextHistory = [...entry.statusHistory];
    if (entry.status !== status) {
      nextHistory.push({
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        status,
        at: now
      });
    }

    return {
      ...entry,
      status,
      comments: nextComments,
      statusHistory: nextHistory,
      client: {
        pac: sourceClient.pac,
        name: sourceClient.name,
        bu: sourceClient.bu || ""
      }
    };
  });
  return existing.id;
};

const submitModal = () => {
  errorMessage.value = "";
  if (!selectedPac.value) {
    errorMessage.value = "Selectionnez un client.";
    return;
  }
  const updatedId = upsertTrackedEntry({
    pac: selectedPac.value,
    status: selectedCategory.value,
    commentText: (initialComment.value || "").trim()
  });
  if (!updatedId) {
    errorMessage.value = "Client introuvable dans la base.";
    return;
  }
  closeModal();
};

const removeClient = (id) => {
  trackedEntries.value = trackedEntries.value.filter((entry) => entry.id !== id);
  if (selectedDetailId.value === id) {
    selectedDetailId.value = null;
    detailComment.value = "";
  }
};

const openClientDetails = (entry, section) => {
  selectedDetailId.value = entry.id;
  detailSection.value = section;
  detailComment.value = "";
};

const addCommentFromDetails = () => {
  if (!selectedDetailEntry.value) return;
  const text = (detailComment.value || "").trim();
  if (!text) return;

  const updatedId = upsertTrackedEntry({
    pac: selectedDetailEntry.value.client.pac,
    status: selectedDetailEntry.value.status,
    commentText: text
  });
  if (updatedId) {
    selectedDetailId.value = updatedId;
    detailSection.value = "comments";
  }
  detailComment.value = "";
};

const handleClickOutside = (event) => {
  const dropdownEl = clientWrap.value;
  if (dropdownEl && !dropdownEl.contains(event.target)) {
    showClientDropdown.value = false;
  }
};

watch(clientQuery, (value) => {
  if (!selectedPac.value) return;
  const q = normalize(value);
  if (!q.includes(normalize(selectedPac.value))) {
    selectedPac.value = "";
  }
});

watch(trackedEntries, persistTracked, { deep: true });

watch(
  boardEntries,
  (entries) => {
    if (!entries.some((entry) => entry.id === selectedDetailId.value)) {
      selectedDetailId.value = entries[0]?.id || null;
      detailSection.value = "timeline";
      detailComment.value = "";
    }
  },
  { immediate: true }
);

onMounted(() => {
  restoreTracked();
  loadTickets();
  loadClients();
  document.addEventListener("click", handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleClickOutside);
});
</script>

<style scoped>
.page {
  min-height: 100vh;
  padding: 24px;
  background: #ffffff;
  font-family: "Manrope", sans-serif;
}

.page-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 14px;
}

.eyebrow {
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-size: 11px;
  color: #64748b;
}

h1 {
  margin: 6px 0 0;
  font-size: 34px;
  color: #0f172a;
  font-family: "Space Grotesk", sans-serif;
}

.card {
  background: #f8fafc;
  border: 1px solid #dbe6f3;
  border-radius: 12px;
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.08);
}

.toolbar {
  padding: 12px;
  margin-bottom: 14px;
}

.filters {
  display: grid;
  grid-template-columns: 1.5fr repeat(2, minmax(160px, 1fr));
  gap: 10px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  color: #1f2937;
  font-weight: 700;
}

.field input,
.field select,
.field textarea {
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  padding: 8px 10px;
  background: #ffffff;
}

.view-toggle {
  margin-top: 10px;
  display: inline-flex;
  gap: 8px;
}

.toggle-btn {
  border: 1px solid #cbd5e1;
  background: #ffffff;
  color: #0f172a;
  border-radius: 10px;
  padding: 8px 12px;
  font-weight: 700;
  cursor: pointer;
}

.toggle-btn.active {
  background: #0f2742;
  border-color: #0f2742;
  color: #ffffff;
}

.kanban {
  padding: 12px;
}

.status-switch {
  position: relative;
  display: inline-grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin-bottom: 12px;
  border-bottom: 1px solid #dbe6f3;
}

.status-tab {
  border: none;
  background: transparent;
  color: #64748b;
  padding: 8px 14px 10px;
  font-weight: 700;
  cursor: pointer;
  transition: color 0.2s ease;
}

.status-tab.active {
  color: #0f2742;
}

.status-switch-indicator {
  position: absolute;
  left: 0;
  bottom: -1px;
  width: 50%;
  height: 2px;
  border-radius: 999px;
  background: #0f2742;
  transition: transform 0.25s ease;
}

.kanban-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 2fr);
  gap: 12px;
}

.column {
  padding: 10px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
}

.column-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.column-head h3 {
  margin: 0;
  color: #0f172a;
}

.count {
  min-width: 28px;
  height: 24px;
  border-radius: 999px;
  background: #e2e8f0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 12px;
  color: #0f172a;
}

.client-card {
  background: #ffffff;
  border-radius: 12px;
  padding: 10px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 6px 12px rgba(15, 23, 42, 0.06);
  margin-bottom: 10px;
}

.client-card.status-sensible {
  border-left: 4px solid #dc2626;
}

.client-card.status-plan {
  border-left: 4px solid #d97706;
}

.client-main {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.client-main h4 {
  margin: 0;
  font-size: 15px;
  color: #0f172a;
}

.meta {
  margin: 4px 0 0;
  font-size: 12px;
  color: #64748b;
}

.status-chip {
  border-radius: 999px;
  padding: 4px 8px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
}

.status-chip.status-sensible {
  background: #fee2e2;
  color: #991b1b;
}

.status-chip.status-plan {
  background: #ffedd5;
  color: #9a3412;
}

.client-stats {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: 8px;
}

.ticket-indicator {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #334155;
  font-weight: 700;
}

.comment-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: none;
  background: transparent;
  color: #0f2742;
  font-weight: 700;
  cursor: pointer;
  font-size: 12px;
}

.ticket-indicator svg,
.comment-link svg {
  width: 14px;
  height: 14px;
  fill: currentColor;
}

.card-actions {
  margin-top: 8px;
  display: flex;
  gap: 8px;
}

.primary,
.ghost,
.danger {
  border-radius: 10px;
  padding: 8px 10px;
  font-weight: 700;
  cursor: pointer;
}

.primary {
  border: none;
  background: #0f2742;
  color: #ffffff;
}

.ghost {
  border: 1px solid #cbd5e1;
  background: #ffffff;
  color: #0f172a;
}

.danger {
  border: 1px solid #fecaca;
  background: #fee2e2;
  color: #991b1b;
}

.timeline {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.timeline-row {
  display: flex;
  gap: 8px;
  align-items: flex-start;
}

.timeline-row p {
  margin: 2px 0 0;
  color: #475569;
  font-size: 12px;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: #0f2742;
  margin-top: 6px;
}

.empty {
  color: #64748b;
  text-align: center;
  padding: 10px 6px;
  margin: 0;
}

.empty-mini {
  color: #64748b;
  font-size: 13px;
  margin: 0;
}

.overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.35);
  z-index: 40;
}

.modal {
  position: fixed;
  z-index: 50;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) scale(1);
  width: min(760px, calc(100vw - 24px));
  padding: 14px;
  animation: popIn 0.2s ease-out;
}

.modal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.modal-head h3 {
  margin: 0;
}

.close-x {
  border: none;
  background: transparent;
  font-size: 24px;
  line-height: 1;
  cursor: pointer;
  color: #334155;
}

.modal-grid {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 10px;
}

.field-wide {
  grid-column: 1 / -1;
}

.modal-actions {
  margin-top: 10px;
  display: flex;
  gap: 8px;
}

.error {
  margin: 8px 0 0;
  color: #b91c1c;
  font-weight: 700;
}

.filter-select {
  position: relative;
}

.dropdown {
  position: absolute;
  left: 0;
  top: calc(100% + 6px);
  width: 100%;
  max-height: 220px;
  overflow-y: auto;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.16);
  padding: 6px;
  z-index: 70;
}

.dropdown-item {
  width: 100%;
  text-align: left;
  border: none;
  background: transparent;
  border-radius: 8px;
  padding: 8px 10px;
  cursor: pointer;
  color: #0f172a;
  font-weight: 600;
}

.dropdown-item:hover {
  background: #f1f5f9;
}

.dropdown-empty {
  padding: 8px 10px;
  color: #64748b;
  font-size: 13px;
}

.details-panel {
  padding: 10px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #ffffff;
}

.drawer-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.drawer-head h3 {
  margin: 0;
}

.drawer-section {
  margin-top: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #f8fafc;
  padding: 10px;
}

.drawer-section.focused {
  border-color: #93c5fd;
  box-shadow: 0 0 0 1px #bfdbfe;
}

.drawer-section h4 {
  margin: 0 0 8px;
}

.comment-list {
  list-style: none;
  margin: 0 0 10px;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.comment-list li {
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #ffffff;
  padding: 8px;
}

.comment-list p {
  margin: 0 0 4px;
  color: #1f2937;
}

.comment-list small {
  color: #64748b;
}

.add-trigger {
  margin-top: 4px;
}

@keyframes popIn {
  from {
    opacity: 0;
    transform: translate(-50%, -48%) scale(0.97);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}

@media (max-width: 1200px) {
  .kanban-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 900px) {
  .filters {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .page-head {
    flex-direction: column;
    align-items: stretch;
  }

  .modal-grid {
    grid-template-columns: 1fr;
  }

  .field-wide {
    grid-column: auto;
  }

  .filters {
    grid-template-columns: 1fr;
  }
}
</style>

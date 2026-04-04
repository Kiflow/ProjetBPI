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
                <h4 class="client-name-link" @click="openClientDetails(entry, 'timeline')">{{ entry.client.name }}</h4>
                <p class="meta">
                  PAC: {{ entry.client.pac }}
                  <span v-if="entry.client.bu">| BU: {{ entry.client.bu }}</span>
                </p>
                <p v-if="entry.addedAt" class="meta meta-added">Ajoute le {{ formatDateOnly(entry.addedAt) }}</p>
              </div>
              <div class="card-actions">
                <button type="button" class="ghost card-action-btn" @click="openClientDetails(entry, 'timeline')">
                  <svg class="btn-icon" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      d="M12 8v5l3 2m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="1.8"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                  Historique
                </button>
                <button
                  type="button"
                  class="ghost card-action-btn icon-only"
                  aria-label="Modifier"
                  title="Modifier"
                  @click="openEditModal(entry)"
                >
                  <svg class="btn-icon" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      d="m4 20 4.2-1 9.1-9.1a2 2 0 0 0 0-2.8l-.4-.4a2 2 0 0 0-2.8 0L5 15.8 4 20Z"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="1.8"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                </button>
                <button
                  type="button"
                  class="danger card-action-btn icon-only"
                  aria-label="Supprimer"
                  title="Supprimer"
                  @click="removeClient(entry.id)"
                >
                  <svg class="btn-icon" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      d="M4 7h16M10 11v6m4-6v6M8 7l1-2h6l1 2m-9 0 1 12h8l1-12"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="1.8"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div class="client-stats">
              <button type="button" class="ticket-indicator ticket-indicator-btn" @click="openClientDetails(entry, 'tickets')">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M4 7h16v4a2 2 0 0 0 0 4v4H4v-4a2 2 0 0 0 0-4V7zm5 2v8h2V9H9zm4 0v8h2V9h-2z" />
                </svg>
                {{ getOpenTickets(entry.client.pac).length }} tickets ouverts
              </button>
              <button class="comment-link" type="button" @click="openClientDetails(entry, 'comments')">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M4 5h16a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H8l-4 3v-3H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z" />
                </svg>
                commentaires ({{ entry.comments.length }})
              </button>
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
          <p v-else class="empty">Cliquez sur Historique ou commentaires pour afficher les details.</p>

          <template v-if="selectedDetailEntry">
            <section
              v-if="detailSection === 'comments'"
              class="drawer-section"
            >
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

            <section
              v-else-if="detailSection === 'tickets'"
              class="drawer-section"
            >
              <h4>Tickets ouverts ({{ getOpenTickets(selectedDetailEntry.client.pac).length }})</h4>
              <ul v-if="getOpenTickets(selectedDetailEntry.client.pac).length" class="ticket-detail-list">
                <li v-for="ticket in getOpenTickets(selectedDetailEntry.client.pac)" :key="ticket.NumeroTicket" class="ticket-detail-item">
                  <span class="ticket-detail-num">{{ ticket.NumeroTicket }}</span>
                  <span class="ticket-detail-objet">{{ ticket.Objet }}</span>
                </li>
              </ul>
              <p v-else class="empty-mini">Aucun ticket ouvert.</p>
            </section>

            <section
              v-else-if="detailSection === 'timeline'"
              class="drawer-section"
            >
              <h4>Historique</h4>
              <div class="timeline">
                <p v-if="selectedTimelineEvents.length === 0" class="empty-mini">Aucun evenement.</p>
                <div v-else class="timeline-table-wrap">
                  <table class="timeline-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Changement</th>
                        <th>Action</th>
                        <th>Ancienne valeur</th>
                        <th>Nouvelle valeur</th>
                        <th>Auteur</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="event in selectedTimelineEvents" :key="event.id">
                        <td>{{ formatTimelineDate(event.at) }}</td>
                        <td>{{ event.kind }}</td>
                        <td>{{ event.action }}</td>
                        <td>{{ event.previousStatus }}</td>
                        <td>{{ event.nextStatus || "-" }}</td>
                        <td>{{ event.by }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
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


const clients = ref([]);
const trackedEntries = ref([]);
const tickets = ref([]);

const filterQuery = ref("");
const filterTickets = ref("all");
const boardStatus = ref("sensible");

const isModalOpen = ref(false);
const modalMode = ref("create");
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

const formatDateOnly = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("fr-FR");
};

const getCurrentActor = () => {
  try {
    const raw = JSON.parse(localStorage.getItem("user") || "{}");
    const fullName = `${raw.firstName || ""} ${raw.lastName || ""}`.trim();
    if (fullName) return fullName;
    return raw.userId || "Systeme";
  } catch {
    return "Systeme";
  }
};

const toTimestamp = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
};

const formatTimelineDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
};

const timelineEvents = (entry) => {
  if (!entry) return [];
  const rawEvents = [];
  const typeOrder = { added: 0, status: 1, comment: 2 };

  if (entry.addedAt) {
    rawEvents.push({
      id: `${entry.id}-added`,
      type: "added",
      at: entry.addedAt,
      by: entry.createdBy || "Systeme"
    });
  }

  const history = Array.isArray(entry.statusHistory) ? entry.statusHistory : [];
  history.forEach((item) => {
    if (!item?.at) return;
    rawEvents.push({
      id: item.id || `${entry.id}-status-${item.at}`,
      type: "status",
      at: item.at,
      status: item.status,
      by: item.by || "Systeme"
    });
  });

  const comments = Array.isArray(entry.comments) ? entry.comments : [];
  comments.forEach((comment) => {
    if (!comment?.createdAt) return;
    rawEvents.push({
      id: comment.id || `${entry.id}-comment-${comment.createdAt}`,
      type: "comment",
      at: comment.createdAt,
      text: comment.text || "",
      by: comment.by || "Systeme"
    });
  });

  rawEvents.sort((a, b) => {
    const timeDiff = toTimestamp(a.at) - toTimestamp(b.at);
    if (timeDiff !== 0) return timeDiff;
    return (typeOrder[a.type] || 99) - (typeOrder[b.type] || 99);
  });

  let currentStatus = "";
  return rawEvents.map((event) => {
    if (event.type === "added") {
      currentStatus = entry.status || currentStatus;
      return {
        ...event,
        kind: "Action",
        action: "Ajout client",
        previousStatus: "-",
        nextStatus: currentStatus ? statusLabel(currentStatus) : "-"
      };
    }

    if (event.type === "status") {
      const previousStatus = currentStatus ? statusLabel(currentStatus) : "-";
      currentStatus = event.status || currentStatus;
      return {
        ...event,
        kind: "Changement",
        action: "Mise a jour du statut",
        previousStatus,
        nextStatus: currentStatus ? statusLabel(currentStatus) : "-"
      };
    }

    return {
      ...event,
      kind: "Commentaire",
      action: event.text ? `Ajout commentaire: ${event.text}` : "Ajout commentaire",
      previousStatus: currentStatus ? statusLabel(currentStatus) : "-",
      nextStatus: ""
    };
  });
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

    return textMatch && ticketMatch;
  });
});

const boardEntries = computed(() => filteredEntries.value.filter((entry) => entry.status === boardStatus.value));

const selectedDetailEntry = computed(() =>
  mergedEntries.value.find((entry) => entry.id === selectedDetailId.value) || null
);
const selectedTimelineEvents = computed(() => timelineEvents(selectedDetailEntry.value));

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

const restoreTracked = async () => {
  try {
    const res = await api.get("/suivi");
    trackedEntries.value = res.data ?? [];
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

const loadTickets = async () => {
  try {
    const res = await api.get("/tickets/db", { params: { limit: 5000 } });
    tickets.value = res.data.tickets ?? (Array.isArray(res.data) ? res.data : []);
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

const upsertTrackedEntry = async ({ pac, status, commentText }) => {
  const sourceClient = clients.value.find((client) => client.pac === pac);
  if (!sourceClient) return "";
  const actor = getCurrentActor();

  const existing = trackedEntries.value.find((entry) => entry.client.pac === pac);
  const id = existing ? existing.id : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const addedAt = existing ? existing.addedAt : new Date().toISOString();
  const commentId = commentText ? `${Date.now()}-${Math.random().toString(16).slice(2)}` : null;
  const historyId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  try {
    const res = await api.post("/suivi", {
      id,
      pac,
      clientName: sourceClient.name,
      clientBu: sourceClient.bu || "",
      status,
      addedAt,
      createdBy: actor,
      comment: commentText || null,
      commentId,
      historyId
    });
    if (existing) {
      trackedEntries.value = trackedEntries.value.map((e) => e.id === id ? res.data : e);
    } else {
      trackedEntries.value.unshift(res.data);
    }
    return id;
  } catch {
    return "";
  }
};

const submitModal = async () => {
  errorMessage.value = "";
  if (!selectedPac.value) {
    errorMessage.value = "Selectionnez un client.";
    return;
  }
  const updatedId = await upsertTrackedEntry({
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

const removeClient = async (id) => {
  try {
    await api.delete(`/suivi/${id}`);
    trackedEntries.value = trackedEntries.value.filter((entry) => entry.id !== id);
    if (selectedDetailId.value === id) {
      selectedDetailId.value = null;
      detailComment.value = "";
    }
  } catch {
    // silently fail
  }
};

const openClientDetails = (entry, section) => {
  selectedDetailId.value = entry.id;
  detailSection.value = section;
  detailComment.value = "";
};

const addCommentFromDetails = async () => {
  if (!selectedDetailEntry.value) return;
  const text = (detailComment.value || "").trim();
  if (!text) return;

  const updatedId = await upsertTrackedEntry({
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

onMounted(async () => {
  await restoreTracked();
  await loadTickets();
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
  border-radius: 8px;
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.08);
}

.toolbar {
  padding: 12px;
  margin-bottom: 14px;
}

.filters {
  display: grid;
  grid-template-columns: 1.5fr minmax(160px, 1fr);
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
  border-radius: 8px;
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
  border-radius: 8px;
  padding: 10px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 6px 12px rgba(15, 23, 42, 0.06);
  margin-bottom: 10px;
}

.client-card.status-sensible {
  border-left: 4px solid #0f2742;
}

.client-card.status-plan {
  border-left: 4px solid #0f2742;
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

.meta-added {
  margin-top: 2px;
}

.client-stats {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: 8px;
}

.client-name-link {
  cursor: pointer;
  transition: color 0.15s;
}

.client-name-link:hover {
  color: #1a3a5c;
  text-decoration: underline;
}

.ticket-indicator {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #334155;
  font-weight: 700;
}

.ticket-indicator-btn {
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 0;
  font-family: inherit;
}

.ticket-indicator-btn:hover {
  color: #1a3a5c;
  text-decoration: underline;
}

.ticket-detail-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 8px;
}

.ticket-detail-item {
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding: 6px 10px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 13px;
}

.ticket-detail-num {
  font-weight: 700;
  color: #1a3a5c;
  white-space: nowrap;
  flex-shrink: 0;
}

.ticket-detail-objet {
  color: #334155;
  line-height: 1.3;
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
  margin-top: 6px;
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.client-main .card-actions {
  margin-top: 0;
  justify-content: flex-end;
}

.card-actions .card-action-btn {
  padding: 5px 8px;
  font-size: 11px;
  line-height: 1.1;
  border-radius: 7px;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.card-actions .card-action-btn.icon-only {
  width: 28px;
  height: 26px;
  padding: 0;
  justify-content: center;
}

.card-actions .btn-icon {
  width: 13px;
  height: 13px;
  flex: 0 0 auto;
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
}

.timeline-table-wrap {
  overflow-x: auto;
  border: 1px solid #dbe6f3;
  border-radius: 8px;
  background: #ffffff;
}

.timeline-table {
  width: 100%;
  min-width: 760px;
  border-collapse: collapse;
  font-size: 12px;
}

.timeline-table th,
.timeline-table td {
  padding: 7px 8px;
  text-align: left;
  vertical-align: top;
  border-bottom: 1px solid #e2e8f0;
}

.timeline-table thead th {
  background: #f8fafc;
  color: #0f2742;
  font-weight: 800;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  border-bottom: 1px solid #cbd5e1;
}

.timeline-table tbody tr:last-child td {
  border-bottom: none;
}

.timeline-table td:first-child {
  color: #0f2742;
  font-weight: 700;
  white-space: nowrap;
}

.timeline-table td:nth-child(3) {
  color: #0f172a;
  font-weight: 600;
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
  border-radius: 8px;
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
  border-radius: 8px;
  background: #f8fafc;
  padding: 10px;
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
  border-radius: 8px;
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

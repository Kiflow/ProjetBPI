<template>
  <div class="page">

    <!-- LEFT PANEL : clients -->
    <aside class="left-panel">
      <div class="panel-head">
        <h2>Clients</h2>
      </div>

      <div class="panel-filters">
        <div class="search-wrap">
          <svg class="search-icon" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clip-rule="evenodd"/></svg>
          <input v-model="clientSearch" type="search" placeholder="PAC, nom client..." class="search-input" />
        </div>
      </div>

      <div class="client-list">
        <p v-if="!filteredClients.length" class="empty-group">Aucun client trouvé.</p>
        <button
          v-for="c in filteredClients" :key="c.pac"
          type="button"
          class="client-item"
          :class="{ active: selectedPac === c.pac && !showTemplates }"
          @click="selectClient(c)"
        >
          <span class="client-info">
            <span class="client-name">{{ c.name }}</span>
            <span class="client-pac">{{ c.pac }}</span>
          </span>
          <span v-if="customCountByPac[c.pac]" class="badge-count">{{ customCountByPac[c.pac] }}</span>
        </button>
      </div>

      <div class="panel-footer">
        <button class="btn-manage-tpl" :class="{ active: showTemplates }" type="button" @click="toggleTemplates">
          <svg viewBox="0 0 20 20" fill="currentColor"><path d="M3.5 2A1.5 1.5 0 0 0 2 3.5v13A1.5 1.5 0 0 0 3.5 18h13a1.5 1.5 0 0 0 1.5-1.5V8.621a1.5 1.5 0 0 0-.44-1.06l-4.622-4.622A1.5 1.5 0 0 0 11.879 2H3.5Zm7 1.5v3.75c0 .414.336.75.75.75h3.75L10.5 3.5Z"/></svg>
          Gérer les modèles
        </button>
      </div>
    </aside>

    <!-- MAIN PANEL -->
    <main class="main-panel">

      <!-- Templates management view -->
      <template v-if="showTemplates">
        <div class="main-header">
          <div>
            <h1 class="main-title">Modèles de sujets</h1>
            <p class="main-sub">Liste des sujets prédéfinis disponibles pour tous les clients</p>
          </div>
          <button class="btn-new" type="button" @click="openTplModal(null)">
            <svg viewBox="0 0 20 20" fill="currentColor"><path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z"/></svg>
            Nouveau modèle
          </button>
        </div>
        <p v-if="!templates.length" class="empty-main">Aucun modèle. Cliquez sur "Nouveau modèle" pour commencer.</p>
        <div v-else class="tpl-list">
          <div v-for="t in templates" :key="t.id" class="tpl-row">
            <div class="tpl-row-info">
              <span class="tpl-name">{{ t.name }}</span>
              <span v-if="t.description" class="tpl-desc">{{ t.description }}</span>
            </div>
            <div class="tpl-row-actions">
              <button class="icon-btn" title="Modifier" @click="openTplModal(t)">
                <svg viewBox="0 0 20 20" fill="currentColor"><path d="m5.433 13.917 1.262-3.155A4 4 0 0 1 7.58 9.42l6.92-6.918a2.121 2.121 0 0 1 3 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 0 1-.65-.65Z"/></svg>
              </button>
              <button class="icon-btn icon-btn-danger" title="Supprimer" @click="deleteTemplate(t.id)">
                <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clip-rule="evenodd"/></svg>
              </button>
            </div>
          </div>
        </div>
      </template>

      <!-- Client view -->
      <template v-else-if="selectedClient">
        <div class="main-header">
          <div class="client-header-badge">
            <span class="client-avatar-lg">{{ initials(selectedClient.name) }}</span>
            <div>
              <h1 class="main-title">{{ selectedClient.name }}</h1>
              <p class="main-sub">PAC : {{ selectedClient.pac }}<span v-if="selectedClient.bu"> · BU : {{ selectedClient.bu }}</span></p>
            </div>
          </div>
          <div class="header-right">
            <div class="subject-search-wrap">
              <svg class="search-icon" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clip-rule="evenodd"/></svg>
              <input v-model="subjectSearch" type="search" placeholder="Rechercher un sujet..." class="subject-search-input" />
            </div>
            <button class="btn-new" type="button" @click="openAddSubjectModal">
              <svg viewBox="0 0 20 20" fill="currentColor"><path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z"/></svg>
              Ajouter un sujet
            </button>
          </div>
        </div>

        <p v-if="!filteredSubjects.length" class="empty-main">{{ subjectSearch ? 'Aucun sujet correspondant.' : 'Aucun sujet pour ce client. Cliquez sur "Ajouter un sujet".' }}</p>

        <div v-else class="subjects-grid">
          <div v-for="s in filteredSubjects" :key="s.id" class="subject-card" :class="{ expanded: expandedId === s.id }">
            <div class="subject-card-head" @click="toggleExpand(s.id)">
              <div class="subject-card-left">
                <div class="subject-name-row">
                  <span class="subject-card-name">{{ s.name }}</span>
                </div>
                <span v-if="s.description" class="subject-card-desc">{{ s.description }}</span>
              </div>
              <div class="subject-card-right">
                <span v-if="s.handler_name" class="handler-chip">
                  <span class="handler-avatar-sm">{{ initials(s.handler_name) }}</span>{{ s.handler_name }}
                </span>
                <span v-else class="unassigned-chip">Non assigné</span>
                <span class="badge-count">{{ s.ticket_count }} ticket{{ s.ticket_count !== 1 ? 's' : '' }}</span>
                <span v-if="s.initial_ticket" class="ref-chip">Réf: {{ s.initial_ticket }}</span>
                <span class="ref-chip">Création : {{ formatDate(s.created_at) }}</span>
                <div class="card-actions-row">
                  <button class="icon-btn" title="Modifier" @click.stop="openEditSubject(s)">
                    <svg viewBox="0 0 20 20" fill="currentColor"><path d="m5.433 13.917 1.262-3.155A4 4 0 0 1 7.58 9.42l6.92-6.918a2.121 2.121 0 0 1 3 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 0 1-.65-.65Z"/></svg>
                  </button>
                  <button class="icon-btn icon-btn-danger" title="Supprimer" @click.stop="deleteSubject(s.id)">
                    <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clip-rule="evenodd"/></svg>
                  </button>
                  <svg class="chevron" :class="{ open: expandedId === s.id }" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd"/></svg>
                </div>
              </div>
            </div>
            <div v-if="expandedId === s.id" class="subject-card-body">
              <TicketsPanel :subject-id="s.id" :filter-pac="selectedPac" :all-tickets="allTickets" @updated="reloadSubjectCount(s.id)" />
            </div>
          </div>
        </div>
      </template>

      <!-- Empty state -->
      <div v-else class="empty-state">
        <svg viewBox="0 0 48 48" fill="none"><circle cx="24" cy="24" r="22" stroke="#e2e8f0" stroke-width="2"/><path d="M16 24h16M24 16v16" stroke="#cbd5e1" stroke-width="2.5" stroke-linecap="round"/></svg>
        <p>Sélectionnez un client pour voir ses sujets</p>
      </div>
    </main>

    <!-- MODAL: Ajouter un sujet (depuis modèle ou personnalisé) -->
    <div v-if="showAddModal" class="overlay" @click.self="showAddModal = false">
      <div class="modal modal-wide">
        <div class="modal-head">
          <h3>Ajouter un sujet — {{ selectedClient?.name }}</h3>
          <button class="close-btn" @click="showAddModal = false">✕</button>
        </div>
        <div class="modal-tabs">
          <button :class="{ active: addTab === 'template' }" @click="addTab = 'template'">
            <svg viewBox="0 0 20 20" fill="currentColor"><path d="M3.5 2A1.5 1.5 0 0 0 2 3.5v13A1.5 1.5 0 0 0 3.5 18h13a1.5 1.5 0 0 0 1.5-1.5V8.621a1.5 1.5 0 0 0-.44-1.06l-4.622-4.622A1.5 1.5 0 0 0 11.879 2H3.5Zm7 1.5v3.75c0 .414.336.75.75.75h3.75L10.5 3.5Z"/></svg>
            Depuis un modèle
          </button>
          <button :class="{ active: addTab === 'custom' }" @click="addTab = 'custom'">
            <svg viewBox="0 0 20 20" fill="currentColor"><path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z"/></svg>
            Sujet personnalisé
          </button>
        </div>

        <!-- Tab: depuis modèle -->
        <div v-if="addTab === 'template'" class="modal-body">
          <p v-if="!templates.length" class="tp-empty">Aucun modèle disponible. Fermez cette fenêtre et cliquez sur <strong>"Gérer les modèles"</strong> en bas du panneau gauche.</p>
          <template v-else>
            <label class="field">
              <span>Modèle *</span>
              <select v-if="availableTemplates.length" v-model="selectedTplId" @change="onTplSelect">
                <option value="">— Choisir un modèle</option>
                <option v-for="t in availableTemplates" :key="t.id" :value="t.id">{{ t.name }}</option>
              </select>
              <p v-else class="tp-empty">Tous les modèles ont déjà été ajoutés pour ce client.</p>
            </label>
            <div v-if="selectedTplId" class="tpl-config">
              <label class="field">
                <span>Géré par</span>
                <select v-model="form.handler_id" @change="syncHandlerName">
                  <option value="">— Non assigné</option>
                  <option v-for="m in teamMembers" :key="m.userId" :value="m.userId">{{ m.firstName }} {{ m.lastName }}</option>
                </select>
              </label>
              <label class="field">
                <span>Ticket initial</span>
                <input v-model="form.initial_ticket" type="text" placeholder="Numéro du ticket de référence" />
              </label>
            </div>
          </template>
        </div>

        <!-- Tab: sujet personnalisé -->
        <div v-else class="modal-body">
          <label class="field">
            <span>Nom *</span>
            <input v-model="form.name" type="text" placeholder="Ex: Problème spécifique comptable" />
          </label>
          <label class="field">
            <span>Description</span>
            <textarea v-model="form.description" rows="2" placeholder="Contexte, objectif..." />
          </label>
          <label class="field">
            <span>Géré par</span>
            <select v-model="form.handler_id" @change="syncHandlerName">
              <option value="">— Non assigné</option>
              <option v-for="m in teamMembers" :key="m.userId" :value="m.userId">{{ m.firstName }} {{ m.lastName }}</option>
            </select>
          </label>
          <label class="field">
            <span>Ticket initial</span>
            <input v-model="form.initial_ticket" type="text" placeholder="Numéro du ticket de référence" />
          </label>
        </div>

        <div class="modal-foot">
          <button class="btn-primary" @click="submitAddModal" :disabled="addTab === 'template' && !selectedTplId">Ajouter</button>
          <button class="btn-ghost" @click="showAddModal = false">Annuler</button>
        </div>
        <p v-if="formError" class="form-error">{{ formError }}</p>
      </div>
    </div>

    <!-- MODAL: Modifier un sujet existant -->
    <div v-if="showEditModal" class="overlay" @click.self="showEditModal = false">
      <div class="modal">
        <div class="modal-head">
          <h3>Modifier le sujet</h3>
          <button class="close-btn" @click="showEditModal = false">✕</button>
        </div>
        <div class="modal-body">
          <label class="field">
            <span>Nom *</span>
            <input v-model="form.name" type="text" />
          </label>
          <label class="field">
            <span>Description</span>
            <textarea v-model="form.description" rows="2" />
          </label>
          <label class="field">
            <span>Géré par</span>
            <select v-model="form.handler_id" @change="syncHandlerName">
              <option value="">— Non assigné</option>
              <option v-for="m in teamMembers" :key="m.userId" :value="m.userId">{{ m.firstName }} {{ m.lastName }}</option>
            </select>
          </label>
          <label class="field">
            <span>Ticket initial</span>
            <input v-model="form.initial_ticket" type="text" placeholder="Numéro du ticket de référence" />
          </label>
        </div>
        <div class="modal-foot">
          <button class="btn-primary" @click="submitEditModal">Enregistrer</button>
          <button class="btn-ghost" @click="showEditModal = false">Annuler</button>
        </div>
        <p v-if="formError" class="form-error">{{ formError }}</p>
      </div>
    </div>

    <!-- MODAL: Créer / Modifier un modèle -->
    <div v-if="showTplModal" class="overlay" @click.self="showTplModal = false">
      <div class="modal">
        <div class="modal-head">
          <h3>{{ editTpl ? 'Modifier le modèle' : 'Nouveau modèle' }}</h3>
          <button class="close-btn" @click="showTplModal = false">✕</button>
        </div>
        <div class="modal-body">
          <label class="field">
            <span>Nom *</span>
            <input v-model="tplForm.name" type="text" placeholder="Ex: PNM 1 - Prime non mensuel 1" />
          </label>
          <label class="field">
            <span>Description</span>
            <textarea v-model="tplForm.description" rows="2" placeholder="Contexte, objectif..." />
          </label>
        </div>
        <div class="modal-foot">
          <button class="btn-primary" @click="submitTplModal">{{ editTpl ? 'Enregistrer' : 'Créer' }}</button>
          <button class="btn-ghost" @click="showTplModal = false">Annuler</button>
        </div>
        <p v-if="tplError" class="form-error">{{ tplError }}</p>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, defineComponent, h } from "vue";
import api from "../services/api";

// ── Inline TicketsPanel component ─────────────────────────────────────────
const TicketsPanel = defineComponent({
  props: { subjectId: String, filterPac: String, allTickets: Array },
  emits: ["updated"],
  setup(props, { emit }) {
    const tickets = ref([]);
    const loading = ref(false);
    const linkQuery = ref("");
    const linkNumber = ref("");
    const showDrop = ref(false);
    const showLinkRow = ref(false);
    const linkError = ref("");

    const normalize = (v) => String(v || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

    const load = async () => {
      loading.value = true;
      try { tickets.value = await api.get(`/subjects/${props.subjectId}/tickets`).then(r => r.data); }
      catch { tickets.value = []; }
      finally { loading.value = false; }
    };

    const displayed = computed(() => tickets.value);

    const dropOptions = computed(() => {
      const q = normalize(linkQuery.value);
      if (!q) return [];
      return (props.allTickets || []).filter(t => normalize(t.NumeroTicket).includes(q) || normalize(t.Objet).includes(q)).slice(0, 40);
    });

    const selectTicket = (t) => { linkNumber.value = t.NumeroTicket; linkQuery.value = `${t.NumeroTicket} — ${t.Objet}`; showDrop.value = false; };

    const link = async () => {
      linkError.value = "";
      if (!linkNumber.value) { linkError.value = "Sélectionnez un ticket."; return; }
      try {
        await api.post(`/subjects/${props.subjectId}/tickets`, { ticket_number: linkNumber.value });
        linkQuery.value = ""; linkNumber.value = ""; showLinkRow.value = false;
        await load();
        emit("updated");
      } catch (e) { linkError.value = e?.response?.data?.message || "Erreur."; }
    };

    const unlink = async (linkId) => {
      try { await api.delete(`/subjects/${props.subjectId}/tickets/${linkId}`); await load(); emit("updated"); }
      catch {}
    };

    const prioBadgeClass = (p) => {
      const v = normalize(p);
      if (v.includes("critique") || v.includes("urgent") || v === "p1") return "prio-critique";
      if (v.includes("haute") || v === "p2") return "prio-haute";
      return "prio-normal";
    };

    onMounted(load);

    return () => h("div", { class: "tickets-panel" }, [
      h("div", { class: "tp-add-row" }, [
        !showLinkRow.value
          ? h("button", { type: "button", class: "btn-add-ticket", onClick: () => { showLinkRow.value = true; linkError.value = ""; } }, [
              h("span", {}, "+ Ajouter un ticket")
            ])
          : h("div", { class: "tp-link-wrap" }, [
              h("div", { class: "autocomplete-wrap" }, [
                h("input", { class: "tp-link-input", placeholder: "Numéro ou objet du ticket…", value: linkQuery.value,
                  onInput: (e) => { linkQuery.value = e.target.value; showDrop.value = true; },
                  onFocus: () => { showDrop.value = true; }
                }),
                showDrop.value && dropOptions.value.length ? h("div", { class: "autocomplete-drop" },
                  dropOptions.value.map(t => h("button", { type: "button", class: "drop-item", onClick: () => selectTicket(t) }, [
                    h("span", { class: "drop-num" }, t.NumeroTicket),
                    h("span", { class: "drop-objet" }, t.Objet)
                  ]))
                ) : null
              ]),
              h("button", { class: "btn-link-sm", disabled: !linkNumber.value, onClick: link }, "Lier"),
              h("button", { class: "btn-cancel-sm", onClick: () => { showLinkRow.value = false; linkQuery.value = ""; linkNumber.value = ""; linkError.value = ""; } }, "Annuler")
            ])
      ]),
      linkError.value ? h("p", { class: "tp-error" }, linkError.value) : null,
      loading.value ? h("p", { class: "tp-empty" }, "Chargement…") :
      !displayed.value.length ? h("p", { class: "tp-empty" }, "Aucun ticket lié.") :
      h("table", { class: "tickets-table" }, [
        h("thead", {}, [h("tr", {}, [
          h("th", {}, "Numéro"),
          h("th", {}, "Statut"),
          h("th", {}, "Traité par"),
          h("th", {}, "Objet"),
          h("th", {}, "Date ouverture"),
          h("th", {}, "Date clôture"),
          h("th", {})
        ])]),
        h("tbody", {}, displayed.value.map(t => h("tr", { key: t.link_id }, [
          h("td", { class: "col-num" }, t.ticket_number),
          h("td", { class: "col-statut" }, t.statut || "—"),
          h("td", { class: "col-handler" }, t.login_adesi || "—"),
          h("td", { class: "col-objet", title: t.objet }, t.objet || "—"),
          h("td", { class: "col-date" }, t.date_ouverture || ""),
          h("td", { class: "col-date" }, t.date_cloture || ""),
          h("td", { class: "col-action" }, h("button", { class: "unlink-btn", onClick: () => unlink(t.link_id) }, "✕"))
        ])))
      ])
    ]);
  }
});

// ── State ──────────────────────────────────────────────────────────────────
const subjects = ref([]);
const templates = ref([]);
const allClients = ref([]);
const allTickets = ref([]);
const teamMembers = ref([]);

const clientSearch = ref("");
const subjectSearch = ref("");
const selectedPac = ref(null);
const showTemplates = ref(false);
const expandedId = ref(null);

// Add subject modal
const showAddModal = ref(false);
const addTab = ref("template");
const selectedTplId = ref(null);
const form = ref({ name: "", description: "", handler_id: "", handler_name: "", initial_ticket: "" });
const formError = ref("");

// Edit subject modal
const showEditModal = ref(false);
const editSubjectRef = ref(null);

// Template management modal
const showTplModal = ref(false);
const editTpl = ref(null);
const tplForm = ref({ name: "", description: "" });
const tplError = ref("");

// ── Computed ───────────────────────────────────────────────────────────────
const normalize = (v) => String(v || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

const filteredClients = computed(() => {
  const q = normalize(clientSearch.value);
  return allClients.value.filter(c => !q || normalize(c.pac).includes(q) || normalize(c.name).includes(q)).slice(0, 120);
});

const selectedClient = computed(() => allClients.value.find(c => c.pac === selectedPac.value) || null);

const clientSubjects = computed(() => subjects.value.filter(s => s.pac === selectedPac.value));
const filteredSubjects = computed(() => {
  const q = normalize(subjectSearch.value);
  if (!q) return clientSubjects.value;
  return clientSubjects.value.filter(s => normalize(s.name).includes(q) || normalize(s.description).includes(q));
});

const customCountByPac = computed(() => {
  const map = {};
  subjects.value.filter(s => s.pac).forEach(s => { map[s.pac] = (map[s.pac] || 0) + 1; });
  return map;
});

// Templates not yet added for current client
const availableTemplates = computed(() => templates.value);

// ── Helpers ────────────────────────────────────────────────────────────────
const initials = (name) => String(name || "?").split(" ").filter(Boolean).map(p => p[0].toUpperCase()).slice(0, 2).join("");
const formatDate = (d) => d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }) : "";

// ── API ────────────────────────────────────────────────────────────────────
const loadSubjects = async () => {
  try { subjects.value = await api.get("/subjects").then(r => r.data); }
  catch { subjects.value = []; }
};

const loadTemplates = async () => {
  try { templates.value = await api.get("/subject-templates").then(r => r.data); }
  catch { templates.value = []; }
};

const loadClients = async () => {
  try { allClients.value = (await api.get("/clients")).data?.clients ?? []; }
  catch { allClients.value = []; }
};

const loadTickets = async () => {
  try {
    const res = await api.get("/tickets/db", { params: { limit: 5000 } });
    allTickets.value = res.data.tickets ?? (Array.isArray(res.data) ? res.data : []);
  } catch { allTickets.value = []; }
};

const loadTeamMembers = async () => {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (!user.group) return;
    teamMembers.value = (await api.get("/employees", { params: { group: user.group } })).data?.employees ?? [];
  } catch { teamMembers.value = []; }
};

onMounted(() => { loadSubjects(); loadTemplates(); loadClients(); loadTickets(); loadTeamMembers(); });

// ── Actions ────────────────────────────────────────────────────────────────
const selectClient = (c) => { selectedPac.value = c.pac; showTemplates.value = false; expandedId.value = null; subjectSearch.value = ""; };
const toggleTemplates = () => { showTemplates.value = !showTemplates.value; if (showTemplates.value) { selectedPac.value = null; expandedId.value = null; } };
const toggleExpand = (id) => { expandedId.value = expandedId.value === id ? null : id; };

const syncHandlerName = () => {
  const m = teamMembers.value.find(x => x.userId === form.value.handler_id);
  form.value.handler_name = m ? `${m.firstName} ${m.lastName}`.trim() : "";
};

// Open "add subject" modal
const openAddSubjectModal = () => {
  addTab.value = "template";
  selectedTplId.value = null;
  form.value = { name: "", description: "", handler_id: "", handler_name: "", initial_ticket: "" };
  formError.value = "";
  showAddModal.value = true;
};

const onTplSelect = () => {
  const t = templates.value.find(x => x.id === selectedTplId.value);
  if (t) { form.value.name = t.name; form.value.description = t.description; }
};

const submitAddModal = async () => {
  formError.value = "";
  const payload = {
    pac: selectedPac.value,
    client_name: selectedClient.value?.name || "",
    handler_id: form.value.handler_id,
    handler_name: form.value.handler_name,
    initial_ticket: form.value.initial_ticket,
  };

  if (addTab.value === "template") {
    if (!selectedTplId.value) { formError.value = "Sélectionnez un modèle."; return; }
    const tpl = templates.value.find(t => t.id === selectedTplId.value);
    payload.name = tpl.name;
    payload.description = tpl.description;
    payload.template_id = tpl.id;
  } else {
    if (!form.value.name.trim()) { formError.value = "Le nom est requis."; return; }
    payload.name = form.value.name.trim();
    payload.description = form.value.description;
    payload.template_id = "";
  }

  try {
    const res = await api.post("/subjects", payload);
    subjects.value.unshift(res.data);
    showAddModal.value = false;
  } catch (e) { formError.value = e?.response?.data?.message || "Erreur."; }
};

// Edit existing subject
const openEditSubject = (s) => {
  editSubjectRef.value = s;
  form.value = { name: s.name, description: s.description, handler_id: s.handler_id, handler_name: s.handler_name, initial_ticket: s.initial_ticket };
  formError.value = "";
  showEditModal.value = true;
};

const submitEditModal = async () => {
  formError.value = "";
  if (!form.value.name.trim()) { formError.value = "Le nom est requis."; return; }
  try {
    const res = await api.put(`/subjects/${editSubjectRef.value.id}`, {
      ...form.value,
      pac: editSubjectRef.value.pac,
      client_name: editSubjectRef.value.client_name
    });
    subjects.value = subjects.value.map(s => s.id === editSubjectRef.value.id ? res.data : s);
    showEditModal.value = false;
  } catch (e) { formError.value = e?.response?.data?.message || "Erreur."; }
};

const deleteSubject = async (id) => {
  if (!confirm("Supprimer ce sujet et tous ses liens ?")) return;
  try {
    await api.delete(`/subjects/${id}`);
    subjects.value = subjects.value.filter(s => s.id !== id);
    if (expandedId.value === id) expandedId.value = null;
  } catch {}
};

const reloadSubjectCount = async (id) => {
  try {
    const res = await api.get("/subjects").then(r => r.data);
    const updated = res.find(s => s.id === id);
    if (updated) subjects.value = subjects.value.map(s => s.id === id ? updated : s);
  } catch {}
};

// Templates CRUD
const openTplModal = (t) => {
  editTpl.value = t;
  tplForm.value = { name: t?.name || "", description: t?.description || "" };
  tplError.value = "";
  showTplModal.value = true;
};

const submitTplModal = async () => {
  tplError.value = "";
  if (!tplForm.value.name.trim()) { tplError.value = "Le nom est requis."; return; }
  try {
    if (editTpl.value) {
      const res = await api.put(`/subject-templates/${editTpl.value.id}`, tplForm.value);
      templates.value = templates.value.map(t => t.id === editTpl.value.id ? res.data : t);
    } else {
      const res = await api.post("/subject-templates", tplForm.value);
      templates.value.push(res.data);
      templates.value.sort((a, b) => a.name.localeCompare(b.name));
    }
    showTplModal.value = false;
  } catch (e) { tplError.value = e?.response?.data?.message || "Erreur."; }
};

const deleteTemplate = async (id) => {
  if (!confirm("Supprimer ce modèle ? Les sujets clients déjà créés depuis ce modèle ne seront pas supprimés.")) return;
  try {
    await api.delete(`/subject-templates/${id}`);
    templates.value = templates.value.filter(t => t.id !== id);
  } catch {}
};
</script>

<style scoped>
.page { display: flex; margin: -24px; width: calc(100% + 48px); height: calc(100% + 48px); background: #f8fafc; overflow: hidden; }

/* ── LEFT PANEL ─────────────────── */
.left-panel {
  width: 270px; flex-shrink: 0;
  background: #fff; border-right: 1px solid #e2e8f0;
  display: flex; flex-direction: column; overflow: hidden;
}

.panel-head {
  padding: 18px 14px 10px; border-bottom: 1px solid #f1f5f9;
}
.panel-head h2 { font-size: 14px; font-weight: 700; color: #0f172a; margin: 0; }

.panel-filters { padding: 8px 12px; border-bottom: 1px solid #f1f5f9; }
.search-wrap { position: relative; }
.search-icon { position: absolute; left: 9px; top: 50%; transform: translateY(-50%); width: 13px; height: 13px; color: #94a3b8; pointer-events: none; }
.search-input { width: 100%; padding: 6px 8px 6px 28px; border: 1px solid #e2e8f0; border-radius: 7px; font-size: 12px; background: #f8fafc; box-sizing: border-box; }

.client-list { flex: 1; overflow-y: auto; padding: 6px 0; }
.empty-group { padding: 8px 14px; font-size: 12px; color: #94a3b8; }

.client-item {
  width: 100%; display: flex; align-items: center; gap: 10px;
  padding: 8px 14px; border: none; background: transparent;
  cursor: pointer; text-align: left; transition: background 0.12s;
  border-left: 3px solid transparent;
}
.client-item:hover { background: #f8fafc; }
.client-item.active { background: #eff6ff; border-left-color: #1a3a5c; }

.client-avatar {
  width: 32px; height: 32px; border-radius: 50%;
  background: #1a3a5c; color: #fff;
  font-size: 11px; font-weight: 700;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.client-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1px; }
.client-name { font-size: 12px; font-weight: 600; color: #1e293b; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.client-pac { font-size: 11px; color: #94a3b8; }

.panel-footer { border-top: 1px solid #f1f5f9; padding: 10px 12px; }
.btn-manage-tpl {
  width: 100%; display: flex; align-items: center; gap: 7px;
  padding: 7px 10px; border: 1px solid #e2e8f0;
  background: #f8fafc; color: #64748b; border-radius: 7px;
  font-size: 12px; font-weight: 600; cursor: pointer;
}
.btn-manage-tpl svg { width: 13px; height: 13px; flex-shrink: 0; }
.btn-manage-tpl:hover, .btn-manage-tpl.active { background: #1a3a5c; color: #fff; border-color: #1a3a5c; }

/* ── MAIN PANEL ─────────────────── */
.main-panel { flex: 1; min-width: 0; overflow-y: auto; padding: 24px 28px; display: flex; flex-direction: column; gap: 18px; }

.main-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
.main-title { font-size: 20px; font-weight: 700; color: #0f172a; margin: 0; }
.main-sub { font-size: 13px; color: #64748b; margin: 3px 0 0; }

.client-header-badge { display: flex; align-items: center; gap: 14px; }
.client-avatar-lg {
  width: 44px; height: 44px; border-radius: 50%;
  background: #1a3a5c; color: #fff;
  font-size: 15px; font-weight: 700;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}

.btn-new {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 7px 14px; background: #1a3a5c; color: #fff;
  border: none; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer; white-space: nowrap;
}
.btn-new svg { width: 14px; height: 14px; }
.btn-new:hover { background: #2e5f8a; }

.empty-state { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; color: #94a3b8; font-size: 14px; }
.empty-state svg { width: 56px; height: 56px; }
.empty-main { color: #94a3b8; font-size: 13px; }
.header-right { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
.subject-search-wrap { position: relative; width: 240px; }
.subject-search-wrap .search-icon { position: absolute; left: 9px; top: 50%; transform: translateY(-50%); width: 13px; height: 13px; color: #94a3b8; pointer-events: none; }
.subject-search-input { width: 100%; padding: 7px 10px 7px 30px; border: 1px solid #e2e8f0; border-radius: 7px; font-size: 13px; background: #fff; box-sizing: border-box; }
.subject-search-input:focus { outline: none; border-color: #93c5fd; }

/* ── Templates management list ── */
.tpl-list { display: flex; flex-direction: column; gap: 6px; }
.tpl-row {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  padding: 12px 16px; background: #fff; border: 1px solid #e2e8f0; border-radius: 10px;
}
.tpl-row-info { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.tpl-name { font-size: 13px; font-weight: 600; color: #1e293b; }
.tpl-desc { font-size: 12px; color: #64748b; }
.tpl-row-actions { display: flex; gap: 4px; flex-shrink: 0; }

/* ── Subject cards ── */
.subjects-grid { display: flex; flex-direction: column; gap: 8px; }
.subject-card {
  background: #fff; border: 1px solid #e2e8f0; border-radius: 6px; overflow: hidden;
  transition: box-shadow 0.15s;
}
.subject-card:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.07); }
.subject-card.expanded { border-color: #93c5fd; }

.subject-card-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 16px; cursor: pointer; gap: 12px;
}
.subject-card-left { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
.subject-name-row { display: flex; align-items: center; gap: 8px; }
.subject-card-name { font-size: 14px; font-weight: 600; color: #1e293b; }
.subject-card-desc { font-size: 12px; color: #64748b; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 400px; }

.subject-card-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }

.tpl-badge {
  font-size: 10px; font-weight: 700; padding: 2px 7px;
  background: #eff6ff; color: #1d4ed8; border-radius: 20px; border: 1px solid #bfdbfe;
  white-space: nowrap;
}

.handler-chip {
  display: inline-flex; align-items: center; gap: 5px;
  font-size: 12px; color: #1e293b; font-weight: 500;
  background: #f1f5f9; border-radius: 20px; padding: 3px 8px;
}
.handler-avatar-sm {
  width: 18px; height: 18px; border-radius: 50%;
  background: #1a3a5c; color: #fff; font-size: 9px; font-weight: 700;
  display: inline-flex; align-items: center; justify-content: center;
}
.unassigned-chip { font-size: 11px; color: #94a3b8; font-style: italic; }

.badge-count {
  font-size: 11px; font-weight: 700; padding: 2px 8px;
  background: #f1f5f9; color: #475569; border-radius: 20px;
  white-space: nowrap;
}
.ref-chip { font-size: 11px; color: #64748b; background: #f8fafc; padding: 2px 7px; border-radius: 6px; border: 1px solid #e2e8f0; }
.subject-card-date { font-size: 11px; color: #64748b; background: #f8fafc; padding: 2px 7px; border-radius: 6px; border: 1px solid #e2e8f0; width: fit-content; }

.card-actions-row { display: flex; align-items: center; gap: 4px; }
.chevron { width: 16px; height: 16px; color: #94a3b8; transition: transform 0.2s; }
.chevron.open { transform: rotate(180deg); }

.icon-btn {
  width: 28px; height: 28px; display: inline-flex; align-items: center; justify-content: center;
  border: none; background: transparent; border-radius: 6px; cursor: pointer; color: #64748b;
}
.icon-btn:hover { background: #f1f5f9; color: #1e293b; }
.icon-btn svg { width: 14px; height: 14px; }
.icon-btn-danger:hover { background: #fee2e2; color: #dc2626; }

.subject-card-body { border-top: 1px solid #f1f5f9; padding: 14px 16px; background: #fafbfc; }

/* ── Modal ─────────────────────── */
.overlay { position: fixed; inset: 0; background: rgba(15,23,42,0.4); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal { background: #fff; border-radius: 14px; width: 480px; max-width: 96vw; box-shadow: 0 20px 60px rgba(0,0,0,0.2); display: flex; flex-direction: column; max-height: 90vh; }
.modal-wide { width: 580px; }
.modal-head { display: flex; align-items: center; justify-content: space-between; padding: 18px 20px 12px; border-bottom: 1px solid #f1f5f9; }
.modal-head h3 { font-size: 15px; font-weight: 700; color: #0f172a; margin: 0; }
.close-btn { border: none; background: none; font-size: 16px; color: #94a3b8; cursor: pointer; line-height: 1; }
.close-btn:hover { color: #1e293b; }

.modal-tabs { display: flex; gap: 0; border-bottom: 1px solid #f1f5f9; padding: 0 20px; }
.modal-tabs button {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 10px 14px; border: none; background: transparent;
  font-size: 13px; font-weight: 500; color: #64748b; cursor: pointer;
  border-bottom: 2px solid transparent; margin-bottom: -1px;
}
.modal-tabs button svg { width: 13px; height: 13px; }
.modal-tabs button.active { color: #1a3a5c; border-bottom-color: #1a3a5c; font-weight: 600; }

.modal-body { padding: 16px 20px; display: flex; flex-direction: column; gap: 12px; overflow-y: auto; }
.modal-hint { font-size: 12px; color: #64748b; margin: 0; }
.modal-foot { display: flex; gap: 8px; padding: 14px 20px; border-top: 1px solid #f1f5f9; }
.form-error { font-size: 12px; color: #dc2626; padding: 0 20px 12px; margin: 0; }

.field { display: flex; flex-direction: column; gap: 5px; }
.field span { font-size: 12px; font-weight: 600; color: #475569; }
.field input, .field select, .field textarea {
  padding: 7px 10px; border: 1px solid #e2e8f0; border-radius: 7px;
  font-size: 13px; background: #f8fafc; color: #1e293b;
}
.field input:focus, .field select:focus, .field textarea:focus { outline: none; border-color: #93c5fd; background: #fff; }
.field textarea { resize: vertical; }

.btn-primary {
  padding: 8px 18px; background: #1a3a5c; color: #fff;
  border: none; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer;
}
.btn-primary:hover { background: #2e5f8a; }
.btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }
.btn-ghost { padding: 8px 14px; background: transparent; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 13px; color: #64748b; cursor: pointer; }
.btn-ghost:hover { background: #f8fafc; }

/* Template pick list in modal */
.tpl-pick-list { display: flex; flex-direction: column; gap: 6px; max-height: 260px; overflow-y: auto; }
.tpl-pick-item {
  display: flex; flex-direction: column; gap: 2px; align-items: flex-start;
  padding: 10px 12px; border: 1px solid #e2e8f0; border-radius: 8px;
  background: #f8fafc; cursor: pointer; text-align: left; position: relative;
  transition: border-color 0.12s, background 0.12s;
}
.tpl-pick-item:hover { border-color: #93c5fd; background: #eff6ff; }
.tpl-pick-item.selected { border-color: #1a3a5c; background: #eff6ff; }
.tpl-pick-name { font-size: 13px; font-weight: 600; color: #1e293b; }
.tpl-pick-desc { font-size: 12px; color: #64748b; }
.tpl-check { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); width: 16px; height: 16px; color: #1a3a5c; }

.tpl-config { display: flex; flex-direction: column; gap: 12px; padding-top: 12px; border-top: 1px solid #f1f5f9; margin-top: 4px; }

/* ── TicketsPanel (rendered via h()) ── */
:deep(.tickets-panel) { display: flex; flex-direction: column; gap: 10px; }
:deep(.tp-add-row) { display: flex; align-items: center; }
:deep(.btn-add-ticket) { display: inline-flex; align-items: center; gap: 4px; padding: 5px 12px; background: transparent; border: 1px dashed #cbd5e1; border-radius: 7px; font-size: 12px; color: #64748b; cursor: pointer; }
:deep(.btn-add-ticket:hover) { border-color: #1a3a5c; color: #1a3a5c; background: #f8fafc; }
:deep(.tp-link-wrap) { display: flex; gap: 6px; flex: 1; min-width: 240px; }
:deep(.btn-cancel-sm) { padding: 6px 10px; background: transparent; border: 1px solid #e2e8f0; border-radius: 7px; font-size: 12px; color: #64748b; cursor: pointer; white-space: nowrap; }
:deep(.btn-cancel-sm:hover) { background: #f8fafc; }
:deep(.autocomplete-wrap) { position: relative; flex: 1; }
:deep(.tp-link-input) { width: 100%; padding: 6px 10px; border: 1px solid #e2e8f0; border-radius: 7px; font-size: 12px; box-sizing: border-box; }
:deep(.autocomplete-drop) { position: absolute; top: 100%; left: 0; right: 0; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; box-shadow: 0 8px 24px rgba(0,0,0,0.12); z-index: 50; max-height: 220px; overflow-y: auto; }
:deep(.drop-item) { width: 100%; display: flex; gap: 8px; padding: 7px 10px; border: none; background: transparent; cursor: pointer; text-align: left; font-size: 12px; }
:deep(.drop-item:hover) { background: #f1f5f9; }
:deep(.drop-num) { font-weight: 600; color: #1a3a5c; white-space: nowrap; }
:deep(.drop-objet) { color: #475569; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
:deep(.btn-link-sm) { padding: 6px 12px; background: #1a3a5c; color: #fff; border: none; border-radius: 7px; font-size: 12px; font-weight: 600; cursor: pointer; white-space: nowrap; }
:deep(.btn-link-sm:disabled) { opacity: 0.4; cursor: not-allowed; }
:deep(.tp-error) { font-size: 12px; color: #dc2626; margin: 0; }
:deep(.tp-empty) { font-size: 12px; color: #94a3b8; margin: 0; }
:deep(.tickets-table) { width: 100%; border-collapse: collapse; font-size: 12px; }
:deep(.tickets-table th) { padding: 6px 10px; text-align: left; color: #94a3b8; font-weight: 600; border-bottom: 1px solid #f1f5f9; }
:deep(.tickets-table td) { padding: 7px 10px; border-bottom: 1px solid #f8fafc; color: #1e293b; }
:deep(.col-num) { font-weight: 600; color: #1a3a5c; white-space: nowrap; }
:deep(.col-objet) { max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
:deep(.col-statut) { white-space: nowrap; color: #475569; font-size: 11px; }
:deep(.col-date) { white-space: nowrap; color: #64748b; font-size: 11px; }
:deep(.prio-badge) { font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; }
:deep(.prio-critique) { background: #fee2e2; color: #dc2626; }
:deep(.prio-haute) { background: #fef3c7; color: #d97706; }
:deep(.prio-normal) { background: #f1f5f9; color: #64748b; }
:deep(.unlink-btn) { border: none; background: transparent; color: #94a3b8; cursor: pointer; font-size: 13px; line-height: 1; }
:deep(.unlink-btn:hover) { color: #dc2626; }
</style>

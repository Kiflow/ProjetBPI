<template>
  <div class="page">

    <!-- ══ HUB VIEW ══════════════════════════════════════════════════════ -->
    <div v-if="!selectedPac" class="hub">
      <div class="hub-inner">

        <div class="hub-hero">
          <div class="hub-eyebrow">Centralisation demande</div>
          <h1 class="hub-title">Quel client cherchez-vous ?</h1>
          <p class="hub-sub">Recherchez un client pour accéder à ses sujets et tickets centralisés.</p>
        </div>

        <div class="hub-search-row">
          <div class="hub-search-wrap">
            <svg class="hub-search-icon" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clip-rule="evenodd"/></svg>
            <input v-model="clientSearch" type="search" class="hub-search-input" placeholder="Rechercher par nom ou PAC…" autofocus @keydown.escape="clientSearch = ''" />
            <button v-if="clientSearch" type="button" class="hub-search-clear" @click="clientSearch = ''">✕</button>
          </div>

          <div class="hub-bu-row" v-if="buList.length" v-click-outside="() => buDropdownOpen = false">
          <button class="bu-trigger" type="button" @click="buDropdownOpen = !buDropdownOpen">
            <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M2.628 1.601C5.028 1.206 7.49 1 10 1s4.973.206 7.372.601a.75.75 0 0 1 .628.74v2.288a2.25 2.25 0 0 1-.659 1.59l-4.682 4.683a2.25 2.25 0 0 0-.659 1.59v3.037c0 .684-.31 1.33-.844 1.757l-1.937 1.55A.75.75 0 0 1 8 18.25v-5.757a2.25 2.25 0 0 0-.659-1.591L2.659 6.22A2.25 2.25 0 0 1 2 4.629V2.34a.75.75 0 0 1 .628-.74Z" clip-rule="evenodd"/></svg>
            <span>{{ selectedBus.size ? `${selectedBus.size} BU sélectionnée${selectedBus.size > 1 ? 's' : ''}` : 'Filtrer par BU' }}</span>
            <svg class="bu-chevron" :class="{ open: buDropdownOpen }" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd"/></svg>
          </button>
          <div v-if="buDropdownOpen" class="bu-dropdown">
            <label v-for="bu in buList" :key="bu" class="bu-option">
              <input type="checkbox" :checked="selectedBus.has(bu)" @change="toggleBu(bu)" />
              <span>{{ bu }}</span>
            </label>
            <div v-if="selectedBus.size" class="bu-reset" @click="selectedBus = new Set(); buDropdownOpen = false">Réinitialiser</div>
          </div>
        </div>
        </div>

        <div class="hub-grid-label">
          {{ isSearching ? `${displayedClients.length} résultat${displayedClients.length > 1 ? 's' : ''}` : `Récemment consultés · ${displayedClients.length}` }}
        </div>

        <div v-if="!displayedClients.length" class="hub-empty">Aucun client trouvé.</div>

        <div class="client-grid">
          <button
            v-for="c in displayedClients" :key="c.pac"
            type="button"
            class="client-card"
            @click="selectClient(c)"
          >
            <div class="cc-top">
              <span class="cc-avatar" :style="{ background: avatarColor(c.name) }">{{ initials(c.name) }}</span>
              <div class="cc-info">
                <div class="cc-name">{{ c.name }}</div>
                <div class="cc-meta">
                  <span class="cc-pac">{{ c.pac }}</span>
                  <span v-if="c.bu" class="cc-bu">{{ c.bu }}</span>
                </div>
              </div>
            </div>
            <div class="cc-bottom">
              <span class="cc-badge cc-badge--neutral">
                <svg viewBox="0 0 20 20" fill="currentColor"><path d="M3.75 3A1.75 1.75 0 0 0 2 4.75v10.5C2 16.216 2.784 17 3.75 17h12.5A1.75 1.75 0 0 0 18 15.25v-8.5A1.75 1.75 0 0 0 16.25 5h-4.836a.25.25 0 0 1-.177-.073L9.823 3.513A1.75 1.75 0 0 0 8.586 3H3.75Z"/></svg>
                {{ subjectCountByPac[c.pac] || 0 }} sujet{{ (subjectCountByPac[c.pac] || 0) > 1 ? 's' : '' }}
              </span>
              <span v-if="openTicketCountByPac[c.pac]" class="cc-badge cc-badge--red">
                <svg viewBox="0 0 20 20" fill="currentColor"><path d="M3 7a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v2.5a1.5 1.5 0 0 0 0 3V15a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-2.5a1.5 1.5 0 0 0 0-3V7Z"/></svg>
                {{ openTicketCountByPac[c.pac] }} ouvert{{ openTicketCountByPac[c.pac] > 1 ? 's' : '' }}
              </span>
            </div>
          </button>
        </div>

      </div>
    </div>

    <!-- ══ CLIENT VIEW ════════════════════════════════════════════════════ -->
    <div v-else class="client-view">
      <div class="cv-inner">

        <!-- Bouton retour -->
        <button type="button" class="btn-back" @click="backToHub">
          <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z" clip-rule="evenodd"/></svg>
          Tous les clients
        </button>

        <!-- Carte client -->
        <div class="cv-client-bar">
          <div class="cv-client-left">
            <span class="cv-avatar" :style="{ background: avatarColor(selectedClient?.name || '') }">{{ initials(selectedClient?.name || '') }}</span>
            <div>
              <div class="cv-client-eyebrow">Client</div>
              <div class="cv-client-name">{{ selectedClient?.name }}</div>
              <div class="cv-client-meta">
                <span class="cv-pac">{{ selectedClient?.pac }}</span>
                <span v-if="selectedClient?.bu" class="cv-bu">{{ selectedClient?.bu }}</span>
              </div>
            </div>
          </div>
          <div class="cv-header-right">
            <div class="cv-subject-search-wrap">
              <svg class="cv-search-icon" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clip-rule="evenodd"/></svg>
              <input v-model="subjectSearch" type="search" class="cv-search-input" placeholder="Rechercher un sujet…" />
            </div>
            <button type="button" class="btn-primary" @click="openAddSubjectModal">
              <svg viewBox="0 0 20 20" fill="currentColor"><path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z"/></svg>
              Ajouter un sujet
            </button>
          </div>
        </div>

        <!-- Sujets -->
        <div class="cv-count">{{ filteredSubjects.length }} sujet{{ filteredSubjects.length > 1 ? 's' : '' }}</div>

        <div v-if="!filteredSubjects.length" class="cv-empty">
          {{ subjectSearch ? 'Aucun sujet correspondant.' : 'Aucun sujet pour ce client.' }}
        </div>

        <div class="subject-grid">
          <article
            v-for="s in filteredSubjects" :key="s.id"
            class="subject-card"
            :class="{ expanded: expandedId === s.id }"
          >
            <!-- Card header -->
            <div class="sc-head" @click="toggleExpand(s.id)">
              <div class="sc-head-top">
                <h3 class="sc-name">{{ s.name }}</h3>
                <div class="sc-actions">
                  <button type="button" class="icon-btn" title="Modifier" @click.stop="openEditSubject(s)">
                    <svg viewBox="0 0 20 20" fill="currentColor"><path d="m5.433 13.917 1.262-3.155A4 4 0 0 1 7.58 9.42l6.92-6.918a2.121 2.121 0 0 1 3 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 0 1-.65-.65Z"/></svg>
                  </button>
                  <button type="button" class="icon-btn icon-btn--danger" title="Supprimer" @click.stop="deleteSubject(s.id)">
                    <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clip-rule="evenodd"/></svg>
                  </button>
                  <svg class="sc-chevron" :class="{ open: expandedId === s.id }" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd"/></svg>
                </div>
              </div>

              <div class="sc-badges">
                <div class="sc-badges-left">
                  <span v-if="s.handler_name" class="sc-handler">
                    <span class="sc-handler-av" :style="{ background: avatarColor(s.handler_name) }">{{ initials(s.handler_name) }}</span>
                    {{ s.handler_name }}
                  </span>
                  <span v-else class="sc-unassigned">Non assigné</span>
                </div>
                <div class="sc-badges-right">
                  <span v-if="s.project_number" class="sc-badge sc-badge--mono">N° Projet : {{ s.project_number }}</span>
                  <span v-if="s.initial_ticket" class="sc-badge sc-badge--light">Ticket initial : {{ s.initial_ticket }}</span>
                </div>
              </div>

              <div class="sc-footer">
                <div class="sc-ticket-badges">
                  <template v-if="subjectTickets[s.id]">
                    <span v-if="ticketStats(s.id).open" class="sc-tbadge sc-tbadge--open">{{ ticketStats(s.id).open }} ouvert{{ ticketStats(s.id).open > 1 ? 's' : '' }}</span>
                    <span v-if="ticketStats(s.id).closed" class="sc-tbadge sc-tbadge--closed">{{ ticketStats(s.id).closed }} fermé{{ ticketStats(s.id).closed > 1 ? 's' : '' }}</span>
                    <span v-if="!ticketStats(s.id).total" class="sc-tbadge sc-tbadge--none">Aucun ticket</span>
                  </template>
                  <span v-else-if="s.ticket_count" class="sc-tbadge sc-tbadge--none">{{ s.ticket_count }} ticket{{ s.ticket_count > 1 ? 's' : '' }}</span>
                  <span v-else class="sc-tbadge sc-tbadge--none">Aucun ticket</span>
                </div>
                <span class="sc-date">{{ formatDate(s.created_at) }}</span>
              </div>
            </div>

            <!-- Expanded body -->
            <div v-if="expandedId === s.id" class="sc-body">

              <!-- Notes -->
              <div v-if="s.notes" class="sc-extra">
                <div class="sc-extra-row">
                  <span class="sc-extra-key">Notes</span>
                  <span class="sc-extra-val sc-extra-val--pre">{{ s.notes }}</span>
                </div>
              </div>

              <!-- Ticket link row -->
              <div class="ticket-add-row">
                <template v-if="linkingId === s.id">
                  <div class="autocomplete-wrap" v-click-outside="() => showLinkDrop = false">
                    <input
                      v-model="linkQuery"
                      class="link-input"
                      placeholder="Numéro ou objet du ticket…"
                      @input="showLinkDrop = true"
                      @focus="showLinkDrop = true"
                    />
                    <div v-if="showLinkDrop && linkOptions.length" class="link-drop">
                      <button
                        v-for="t in linkOptions" :key="t.NumeroTicket"
                        type="button" class="link-drop-item"
                        @click="pickTicket(t)"
                      >
                        <span class="drop-num">{{ t.NumeroTicket }}</span>
                        <span class="drop-obj">{{ t.Objet }}</span>
                      </button>
                    </div>
                  </div>
                  <button type="button" class="btn-link" :disabled="!linkNumber" @click="linkTicket(s.id)">Lier</button>
                  <button type="button" class="btn-cancel-link" @click="cancelLinking">Annuler</button>
                </template>
                <button v-else type="button" class="btn-add-ticket" @click="startLinking(s.id)">
                  <svg viewBox="0 0 20 20" fill="currentColor"><path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z"/></svg>
                  Ajouter un ticket
                </button>
              </div>

              <!-- Ticket table -->
              <div v-if="subjectTickets[s.id]" class="ticket-table-wrap">
                <div v-if="!subjectTickets[s.id].length" class="ticket-empty">Aucun ticket lié.</div>
                <table v-else class="ticket-table">
                  <thead>
                    <tr>
                      <th>Numéro</th>
                      <th>Statut</th>
                      <th>Traité par</th>
                      <th>Objet</th>
                      <th>Ouverture</th>
                      <th v-if="allClosed(s.id)">Clôture</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="t in subjectTickets[s.id]" :key="t.link_id">
                      <td class="td-num">{{ t.ticket_number }}</td>
                      <td><span class="status-badge" :style="statusStyle(t.statut)">{{ t.statut || '—' }}</span></td>
                      <td class="td-handler">{{ t.login_adesi || '—' }}</td>
                      <td class="td-objet" :title="t.objet">{{ t.objet || '—' }}</td>
                      <td class="td-date">{{ t.date_ouverture || '' }}</td>
                      <td v-if="allClosed(s.id)" class="td-date">{{ t.date_cloture || '—' }}</td>
                      <td><button type="button" class="btn-unlink" @click.stop="unlinkTicket(s.id, t.link_id)">✕</button></td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div v-else class="ticket-empty">Chargement…</div>

            </div>
          </article>
        </div>
      </div>
    </div>

    <!-- ══ MODAL: Ajouter un sujet ══════════════════════════════════════ -->
    <div v-if="showAddModal" class="overlay" @click.self="showAddModal = false">
      <div class="modal modal-wide">
        <div class="modal-head">
          <h3 class="modal-title">Ajouter un sujet — {{ selectedClient?.name }}</h3>
          <button type="button" class="close-btn" @click="showAddModal = false">✕</button>
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
        <div v-if="addTab === 'template'" class="modal-body">
          <p v-if="!templates.length" class="tp-empty">Aucun modèle disponible. Vérifiez que le fichier <strong>Sujets_modele.csv</strong> est présent dans le dossier data.</p>
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
              <label class="field"><span>Géré par</span><select v-model="form.handler_id" @change="syncHandlerName"><option value="">— Non assigné</option><option v-for="m in teamMembers" :key="m.userId" :value="m.userId">{{ m.firstName }} {{ m.lastName }}</option></select></label>
              <label class="field"><span>Ticket initial</span><input v-model="form.initial_ticket" type="text" placeholder="Numéro du ticket de référence" /></label>
              <label class="field"><span>N° Projet</span><input v-model="form.project_number" type="text" placeholder="Ex: PRJ-2024-001 (optionnel)" /></label>
              <label class="field"><span>Notes</span><textarea v-model="form.notes" rows="3" placeholder="Ce qui a été fait, rubriques touchées… (optionnel)" /></label>
            </div>
          </template>
        </div>
        <div v-else class="modal-body">
          <label class="field"><span>Nom *</span><input v-model="form.name" type="text" placeholder="Ex: Problème spécifique comptable" /></label>
          <label class="field"><span>Géré par</span><select v-model="form.handler_id" @change="syncHandlerName"><option value="">— Non assigné</option><option v-for="m in teamMembers" :key="m.userId" :value="m.userId">{{ m.firstName }} {{ m.lastName }}</option></select></label>
          <label class="field"><span>Ticket initial</span><input v-model="form.initial_ticket" type="text" placeholder="Numéro du ticket de référence" /></label>
          <label class="field"><span>N° Projet</span><input v-model="form.project_number" type="text" placeholder="Ex: PRJ-2024-001 (optionnel)" /></label>
          <label class="field"><span>Notes</span><textarea v-model="form.notes" rows="3" placeholder="Ce qui a été fait, rubriques touchées… (optionnel)" /></label>
        </div>
        <div class="modal-foot">
          <button class="btn-primary" @click="submitAddModal" :disabled="addTab === 'template' && !selectedTplId">Ajouter</button>
          <button class="btn-ghost" @click="showAddModal = false">Annuler</button>
        </div>
        <p v-if="formError" class="form-error">{{ formError }}</p>
      </div>
    </div>

    <!-- ══ MODAL: Modifier un sujet ════════════════════════════════════ -->
    <div v-if="showEditModal" class="overlay" @click.self="showEditModal = false">
      <div class="modal">
        <div class="modal-head">
          <h3 class="modal-title">Modifier le sujet</h3>
          <button type="button" class="close-btn" @click="showEditModal = false">✕</button>
        </div>
        <div class="modal-body">
          <label class="field"><span>Nom *</span><input v-model="form.name" type="text" /></label>
          <label class="field"><span>Géré par</span><select v-model="form.handler_id" @change="syncHandlerName"><option value="">— Non assigné</option><option v-for="m in teamMembers" :key="m.userId" :value="m.userId">{{ m.firstName }} {{ m.lastName }}</option></select></label>
          <label class="field"><span>Ticket initial</span><input v-model="form.initial_ticket" type="text" placeholder="Numéro du ticket de référence" /></label>
          <label class="field"><span>N° Projet</span><input v-model="form.project_number" type="text" placeholder="Ex: PRJ-2024-001 (optionnel)" /></label>
          <label class="field"><span>Notes</span><textarea v-model="form.notes" rows="3" placeholder="Ce qui a été fait, rubriques touchées… (optionnel)" /></label>
        </div>
        <div class="modal-foot">
          <button class="btn-primary" @click="submitEditModal">Enregistrer</button>
          <button class="btn-ghost" @click="showEditModal = false">Annuler</button>
        </div>
        <p v-if="formError" class="form-error">{{ formError }}</p>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import api from "../services/api";

// ── Click-outside directive ────────────────────────────────────────────────
const vClickOutside = {
  mounted(el, b) { el._co = (e) => { if (!el.contains(e.target)) b.value(); }; document.addEventListener("click", el._co); },
  unmounted(el) { document.removeEventListener("click", el._co); }
};

// ── State ──────────────────────────────────────────────────────────────────
const subjects     = ref([]);
const templates    = ref([]);
const allClients   = ref([]);
const allTickets   = ref([]);
const teamMembers  = ref([]);

const clientSearch  = ref("");
const subjectSearch = ref("");
const selectedBus    = ref(new Set());
const buDropdownOpen = ref(false);
const selectedPac   = ref(null);
const expandedId    = ref(null);

const subjectTickets = ref({}); // { [subjectId]: [...tickets] }

// Recents
const recents = ref(JSON.parse(localStorage.getItem("cd_recents") || "[]").slice(0, 9));
watch(recents, (v) => { localStorage.setItem("cd_recents", JSON.stringify(v)); }, { deep: true });

// Ticket linking
const linkingId    = ref(null);
const linkQuery    = ref("");
const linkNumber   = ref("");
const showLinkDrop = ref(false);

// Add subject modal
const showAddModal  = ref(false);
const addTab        = ref("template");
const selectedTplId = ref(null);
const form = ref({ name: "", handler_id: "", handler_name: "", initial_ticket: "", project_number: "", notes: "" });
const formError = ref("");

// Edit subject modal
const showEditModal  = ref(false);
const editSubjectRef = ref(null);

// ── Avatar ─────────────────────────────────────────────────────────────────
const avatarPalette = ["#1a3a5c","#2e5f8a","#0f2742","#7c3aed","#0891b2","#b45309","#16a34a","#db2777","#475569","#0f766e"];
const avatarColor = (name) => { let h = 0; for (let i = 0; i < (name||"").length; i++) h = (h*31 + name.charCodeAt(i))|0; return avatarPalette[Math.abs(h) % avatarPalette.length]; };
const initials = (name) => String(name||"?").split(/\s+/).filter(Boolean).slice(0,2).map(w=>w[0]?.toUpperCase()||"").join("") || "?";

// ── Helpers ────────────────────────────────────────────────────────────────
const normalize = (v) => String(v||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").trim();
const formatDate = (d) => d ? new Date(d).toLocaleDateString("fr-FR", { day:"2-digit", month:"short", year:"numeric" }) : "";

const isOpenStatus = (s) => {
  const v = normalize(s||"");
  return !(v.includes("ferm") || v.includes("closed") || v.includes("resolu") || v.includes("annule") || v.includes("cancel"));
};

const ticketStats = (subjectId) => {
  const ts = subjectTickets.value[subjectId] || [];
  const open = ts.filter(t => isOpenStatus(t.statut)).length;
  return { total: ts.length, open, closed: ts.length - open };
};

const allClosed = (subjectId) => {
  const ts = subjectTickets.value[subjectId];
  if (!ts || !ts.length) return false;
  return ts.every(t => !isOpenStatus(t.statut));
};

const statusStyle = (statut) => {
  const v = normalize(statut||"");
  let bg="#f1f5f9", color="#64748b";
  if (v.includes("ouvert")) { bg="#fee2e2"; color="#dc2626"; }
  else if (v.includes("cours")||v.includes("attente")) { bg="#fef3c7"; color="#b45309"; }
  else if (v.includes("ferm")||v.includes("resolu")) { bg="#dcfce7"; color="#15803d"; }
  return { background: bg, color };
};

// ── Computed ───────────────────────────────────────────────────────────────
const buList = computed(() => [...new Set(allClients.value.map(c=>c.bu).filter(Boolean))].sort());

const toggleBu = (bu) => {
  const s = new Set(selectedBus.value);
  s.has(bu) ? s.delete(bu) : s.add(bu);
  selectedBus.value = s;
};

const isSearching = computed(() => clientSearch.value.trim().length > 0 || selectedBus.value.size > 0);

const displayedClients = computed(() => {
  if (!isSearching.value) {
    return recents.value.map(p => allClients.value.find(c=>c.pac===p)).filter(Boolean);
  }
  const q = normalize(clientSearch.value);
  return allClients.value.filter(c => {
    if (selectedBus.value.size && !selectedBus.value.has(c.bu)) return false;
    if (!q) return true;
    return normalize(c.name).includes(q) || normalize(c.pac).includes(q);
  });
});

const subjectCountByPac = computed(() => {
  const m = {};
  subjects.value.forEach(s => { if (s.pac) m[s.pac] = (m[s.pac]||0)+1; });
  return m;
});

const openTicketCountByPac = computed(() => {
  const m = {};
  Object.entries(subjectTickets.value).forEach(([sid, ts]) => {
    const s = subjects.value.find(x => x.id === sid);
    if (!s) return;
    const open = ts.filter(t => isOpenStatus(t.statut)).length;
    if (open) m[s.pac] = (m[s.pac]||0) + open;
  });
  return m;
});

const selectedClient = computed(() => allClients.value.find(c=>c.pac===selectedPac.value) || null);

const clientSubjects = computed(() => subjects.value.filter(s=>s.pac===selectedPac.value));
const filteredSubjects = computed(() => {
  const q = normalize(subjectSearch.value);
  if (!q) return clientSubjects.value;
  return clientSubjects.value.filter(s => normalize(s.name).includes(q));
});

const availableTemplates = computed(() => templates.value);

const linkOptions = computed(() => {
  const q = normalize(linkQuery.value);
  if (!q) return [];
  return allTickets.value.filter(t => normalize(t.NumeroTicket).includes(q) || normalize(t.Objet).includes(q)).slice(0, 40);
});

// ── API ────────────────────────────────────────────────────────────────────
const loadSubjects  = async () => { try { subjects.value  = await api.get("/subjects").then(r=>r.data); } catch { subjects.value = []; } };
const loadTemplates = async () => { try { templates.value = await api.get("/subject-templates").then(r=>r.data); } catch { templates.value = []; } };
const loadClients   = async () => { try { allClients.value = (await api.get("/clients")).data?.clients ?? []; } catch { allClients.value = []; } };
const loadTickets   = async () => {
  try {
    const res = await api.get("/tickets/db", { params: { limit: 5000 } });
    allTickets.value = res.data.tickets ?? (Array.isArray(res.data) ? res.data : []);
  } catch { allTickets.value = []; }
};
const loadTeamMembers = async () => {
  try {
    const user = JSON.parse(localStorage.getItem("user")||"{}");
    if (!user.group) return;
    teamMembers.value = (await api.get("/employees", { params: { group: user.group } })).data?.employees ?? [];
  } catch { teamMembers.value = []; }
};

const loadSubjectTickets = async (subjectId) => {
  if (subjectTickets.value[subjectId]) return;
  try {
    const data = await api.get(`/subjects/${subjectId}/tickets`).then(r=>r.data);
    subjectTickets.value = { ...subjectTickets.value, [subjectId]: data };
  } catch { subjectTickets.value = { ...subjectTickets.value, [subjectId]: [] }; }
};

onMounted(() => { loadSubjects(); loadTemplates(); loadClients(); loadTickets(); loadTeamMembers(); });

// ── Actions ────────────────────────────────────────────────────────────────
const selectClient = (c) => {
  recents.value = [c.pac, ...recents.value.filter(p=>p!==c.pac)].slice(0,9);
  selectedPac.value = c.pac;
  expandedId.value = null;
  subjectSearch.value = "";
  cancelLinking();
};

const backToHub = () => { selectedPac.value = null; expandedId.value = null; subjectSearch.value = ""; cancelLinking(); };

const toggleExpand = async (id) => {
  expandedId.value = expandedId.value === id ? null : id;
  if (expandedId.value) await loadSubjectTickets(id);
};

// ── Ticket linking ─────────────────────────────────────────────────────────
const startLinking = (subjectId) => { linkingId.value = subjectId; linkQuery.value = ""; linkNumber.value = ""; showLinkDrop.value = false; };
const cancelLinking = () => { linkingId.value = null; linkQuery.value = ""; linkNumber.value = ""; showLinkDrop.value = false; };
const pickTicket = (t) => { linkNumber.value = t.NumeroTicket; linkQuery.value = `${t.NumeroTicket} — ${t.Objet}`; showLinkDrop.value = false; };

const linkTicket = async (subjectId) => {
  if (!linkNumber.value) return;
  try {
    await api.post(`/subjects/${subjectId}/tickets`, { ticket_number: linkNumber.value });
    const data = await api.get(`/subjects/${subjectId}/tickets`).then(r=>r.data);
    subjectTickets.value = { ...subjectTickets.value, [subjectId]: data };
    const updated = subjects.value.map(s => s.id===subjectId ? { ...s, ticket_count: data.length } : s);
    subjects.value = updated;
    cancelLinking();
  } catch {}
};

const unlinkTicket = async (subjectId, linkId) => {
  try {
    await api.delete(`/subjects/${subjectId}/tickets/${linkId}`);
    const data = await api.get(`/subjects/${subjectId}/tickets`).then(r=>r.data);
    subjectTickets.value = { ...subjectTickets.value, [subjectId]: data };
    subjects.value = subjects.value.map(s => s.id===subjectId ? { ...s, ticket_count: data.length } : s);
  } catch {}
};

// ── Subject CRUD ───────────────────────────────────────────────────────────
const syncHandlerName = () => {
  const m = teamMembers.value.find(x=>x.userId===form.value.handler_id);
  form.value.handler_name = m ? `${m.firstName} ${m.lastName}`.trim() : "";
};

const openAddSubjectModal = () => {
  addTab.value = "template"; selectedTplId.value = null;
  form.value = { name:"", handler_id:"", handler_name:"", initial_ticket:"", project_number:"", notes:"" };
  formError.value = ""; showAddModal.value = true;
};

const onTplSelect = () => {
  const t = templates.value.find(x=>x.id===selectedTplId.value);
  if (t) form.value.name = t.name;
};

const submitAddModal = async () => {
  formError.value = "";
  const payload = { pac: selectedPac.value, client_name: selectedClient.value?.name||"", handler_id: form.value.handler_id, handler_name: form.value.handler_name, initial_ticket: form.value.initial_ticket, project_number: form.value.project_number, notes: form.value.notes };
  if (addTab.value === "template") {
    if (!selectedTplId.value) { formError.value = "Sélectionnez un modèle."; return; }
    const tpl = templates.value.find(t=>t.id===selectedTplId.value);
    payload.name = tpl.name; payload.template_id = tpl.id;
  } else {
    if (!form.value.name.trim()) { formError.value = "Le nom est requis."; return; }
    payload.name = form.value.name.trim(); payload.template_id = "";
  }
  try { const res = await api.post("/subjects", payload); subjects.value.unshift(res.data); showAddModal.value = false; }
  catch (e) { formError.value = e?.response?.data?.message || "Erreur."; }
};

const openEditSubject = (s) => {
  editSubjectRef.value = s;
  form.value = { name: s.name, handler_id: s.handler_id, handler_name: s.handler_name, initial_ticket: s.initial_ticket, project_number: s.project_number||"", notes: s.notes||"" };
  formError.value = ""; showEditModal.value = true;
};

const submitEditModal = async () => {
  formError.value = "";
  if (!form.value.name.trim()) { formError.value = "Le nom est requis."; return; }
  try {
    const res = await api.put(`/subjects/${editSubjectRef.value.id}`, { ...form.value, pac: editSubjectRef.value.pac, client_name: editSubjectRef.value.client_name });
    subjects.value = subjects.value.map(s => s.id===editSubjectRef.value.id ? res.data : s);
    showEditModal.value = false;
  } catch (e) { formError.value = e?.response?.data?.message || "Erreur."; }
};

const deleteSubject = async (id) => {
  if (!confirm("Supprimer ce sujet et tous ses liens ?")) return;
  try {
    await api.delete(`/subjects/${id}`);
    subjects.value = subjects.value.filter(s=>s.id!==id);
    if (expandedId.value === id) expandedId.value = null;
  } catch {}
};
</script>

<style scoped>
.page { margin: -24px; width: calc(100% + 48px); height: calc(100% + 48px); background: #f8fafc; overflow-y: auto; }

/* ══ HUB ══════════════════════════════════════════════════════════ */
.hub { min-height: 100%; padding: 40px 32px 60px; }
.hub-inner { max-width: 1080px; margin: 0 auto; display: flex; flex-direction: column; gap: 20px; }

.hub-hero { display: flex; flex-direction: column; gap: 4px; }
.hub-eyebrow { font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; }
.hub-title { font-size: 28px; font-weight: 800; color: #0f172a; letter-spacing: -0.02em; margin: 0; }
.hub-sub { font-size: 14px; color: #64748b; margin: 0; }

.hub-search-row { display: flex; gap: 10px; align-items: center; }
.hub-search-wrap { position: relative; flex: 1; }
.hub-search-icon { position: absolute; left: 18px; top: 50%; transform: translateY(-50%); width: 18px; height: 18px; color: #94a3b8; pointer-events: none; }
.hub-search-input {
  width: 100%; padding: 16px 48px 16px 48px; font-size: 16px;
  border: 1px solid #e2e8f0; border-radius: 14px; background: #fff;
  font-family: inherit; color: #0f172a; outline: none;
  box-shadow: 0 4px 14px rgba(15,23,42,0.04); box-sizing: border-box;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.hub-search-input:focus { border-color: #1a3a5c; box-shadow: 0 0 0 3px rgba(26,58,92,0.1); }
.hub-search-clear {
  position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
  border: none; background: #f1f5f9; border-radius: 6px;
  width: 28px; height: 28px; cursor: pointer; color: #64748b; font-size: 14px;
  display: inline-flex; align-items: center; justify-content: center;
}

.hub-bu-row { position: relative; flex-shrink: 0; }
.bu-trigger {
  display: flex; align-items: center; gap: 7px;
  padding: 16px 20px; background: #fff; border: 1px solid #e2e8f0;
  border-radius: 14px; font-size: 13px; font-weight: 600; color: #334155;
  cursor: pointer; font-family: inherit; transition: border-color 0.15s, background 0.15s;
  white-space: nowrap; min-width: 220px;
}
.bu-trigger:hover { background: #f8fafc; border-color: #cbd5e0; }
.bu-trigger svg:first-child { width: 14px; height: 14px; color: #64748b; flex-shrink: 0; }
.bu-trigger span { flex: 1; text-align: left; }
.bu-chevron { width: 14px; height: 14px; color: #94a3b8; transition: transform 0.2s; flex-shrink: 0; }
.bu-chevron.open { transform: rotate(180deg); }
.bu-dropdown {
  position: absolute; top: calc(100% + 6px); left: 0;
  background: #fff; border: 1px solid #e2e8f0; border-radius: 10px;
  box-shadow: 0 8px 24px rgba(15,23,42,0.12); z-index: 30;
  min-width: 220px; overflow: hidden;
}
.bu-option {
  display: flex; align-items: center; gap: 8px; padding: 8px 12px;
  font-size: 13px; font-weight: 500; color: #334155; cursor: pointer;
  transition: background 0.12s;
}
.bu-option:hover { background: #f8fafc; }
.bu-option input[type="checkbox"] { accent-color: #1a3a5c; width: 13px; height: 13px; cursor: pointer; }
.bu-reset {
  padding: 7px 12px; font-size: 12px; font-weight: 600; color: #dc2626;
  border-top: 1px solid #f1f5f9; cursor: pointer; transition: background 0.12s;
}
.bu-reset:hover { background: #fff7f7; }

.hub-grid-label { font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; }
.hub-empty { text-align: center; color: #94a3b8; font-size: 13px; padding: 40px 0; }

.client-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(290px, 1fr)); gap: 12px; }
.client-card {
  background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px 16px;
  cursor: pointer; text-align: left; font-family: inherit;
  display: flex; flex-direction: column; gap: 10px;
  transition: border-color 0.12s, box-shadow 0.12s;
}
.client-card:hover { border-color: #1a3a5c; box-shadow: 0 4px 14px rgba(26,58,92,0.1); }

.cc-top { display: flex; align-items: flex-start; gap: 12px; }
.cc-avatar {
  width: 42px; height: 42px; border-radius: 9px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  color: #fff; font-size: 15px; font-weight: 700;
}
.cc-info { flex: 1; min-width: 0; }
.cc-name { font-size: 14px; font-weight: 700; color: #0f172a; line-height: 1.3; margin-bottom: 3px; }
.cc-meta { display: flex; align-items: center; gap: 6px; }
.cc-pac { font-family: monospace; font-size: 11px; font-weight: 600; background: #f1f5f9; color: #475569; padding: 1px 6px; border-radius: 4px; }
.cc-bu { font-size: 11.5px; color: #64748b; }

.cc-bottom { display: flex; gap: 6px; padding-top: 8px; border-top: 1px solid #f1f5f9; }
.cc-badge { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 5px; }
.cc-badge svg { width: 11px; height: 11px; }
.cc-badge--neutral { color: #475569; background: #f1f5f9; }
.cc-badge--red { color: #dc2626; background: #fee2e2; }

/* ══ CLIENT VIEW ════════════════════════════════════════════════════ */
.client-view { min-height: 100%; padding: 24px 28px 48px; }
.cv-inner { max-width: 1080px; margin: 0 auto; display: flex; flex-direction: column; gap: 16px; }

.btn-back {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 6px 12px; border: 1px solid #e2e8f0; background: #fff; border-radius: 7px;
  font-size: 12px; font-weight: 600; color: #475569; cursor: pointer; font-family: inherit; width: fit-content;
}
.btn-back svg { width: 14px; height: 14px; }
.btn-back:hover { background: #f8fafc; }

.cv-client-bar {
  display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap;
  background: #fff; border: 1px solid #e2e8f0; border-radius: 12px;
  padding: 18px 22px; box-shadow: 0 1px 3px rgba(15,23,42,0.05);
}
.cv-client-left { display: flex; align-items: center; gap: 16px; }
.cv-avatar {
  width: 52px; height: 52px; border-radius: 12px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  color: #fff; font-size: 18px; font-weight: 700;
}
.cv-client-eyebrow { font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 2px; }
.cv-client-name { font-size: 20px; font-weight: 800; color: #0f172a; letter-spacing: -0.01em; margin-bottom: 3px; }
.cv-client-meta { display: flex; align-items: center; gap: 8px; }
.cv-pac { font-family: monospace; font-size: 12px; font-weight: 600; background: #f1f5f9; color: #475569; padding: 2px 8px; border-radius: 5px; }
.cv-bu { font-size: 13px; color: #64748b; }

.cv-header-right { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
.cv-subject-search-wrap { position: relative; width: 220px; }
.cv-search-icon { position: absolute; left: 9px; top: 50%; transform: translateY(-50%); width: 13px; height: 13px; color: #94a3b8; pointer-events: none; }
.cv-search-input { width: 100%; padding: 7px 10px 7px 28px; border: 1px solid #e2e8f0; border-radius: 7px; font-size: 13px; background: #f8fafc; font-family: inherit; outline: none; box-sizing: border-box; }
.cv-search-input:focus { border-color: #1a3a5c; background: #fff; }

.cv-count { font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; }
.cv-empty { text-align: center; color: #94a3b8; font-size: 13px; padding: 40px 0; }

/* ══ SUBJECT GRID ══════════════════════════════════════════════════ */
.subject-grid { display: grid; grid-template-columns: 1fr; gap: 14px; }

.subject-card {
  background: #fff; border: 1px solid #e2e8f0; border-radius: 12px;
  overflow: hidden; display: flex; flex-direction: column;
  transition: box-shadow 0.15s;
}
.subject-card.expanded { border-color: #93c5fd; }
.subject-card:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.06); }

.sc-head { padding: 14px 16px; cursor: pointer; display: flex; flex-direction: column; gap: 10px; }
.sc-head-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; }
.sc-name { font-size: 14px; font-weight: 700; color: #0f172a; margin: 0; line-height: 1.3; }
.sc-actions { display: flex; align-items: center; gap: 3px; flex-shrink: 0; }
.sc-chevron { width: 16px; height: 16px; color: #94a3b8; transition: transform 0.2s; }
.sc-chevron.open { transform: rotate(180deg); }

.sc-badges { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.sc-badges-left { display: flex; flex-wrap: wrap; gap: 5px; align-items: center; }
.sc-badges-right { display: flex; gap: 5px; align-items: center; flex-shrink: 0; }
.sc-handler { display: inline-flex; align-items: center; gap: 5px; font-size: 11.5px; font-weight: 600; color: #475569; background: #f1f5f9; padding: 3px 8px; border-radius: 12px; }
.sc-handler-av { width: 16px; height: 16px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; color: #fff; font-size: 8px; font-weight: 700; flex-shrink: 0; }
.sc-unassigned { font-size: 11px; color: #94a3b8; font-style: italic; }
.sc-badge { font-size: 11px; font-weight: 600; padding: 2px 7px; border-radius: 5px; }
.sc-badge--mono { font-family: monospace; color: #0f2742; background: #e0e7ef; }
.sc-badge--light { color: #64748b; background: #f8fafc; border: 1px solid #f1f5f9; }

.sc-footer { display: flex; align-items: center; justify-content: space-between; padding-top: 8px; border-top: 1px solid #f1f5f9; }
.sc-ticket-badges { display: flex; gap: 5px; flex-wrap: wrap; }
.sc-tbadge { font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 5px; }
.sc-tbadge--open { color: #dc2626; background: #fee2e2; }
.sc-tbadge--closed { color: #15803d; background: #dcfce7; }
.sc-tbadge--none { color: #94a3b8; background: transparent; font-weight: 400; }
.sc-date { font-size: 11px; color: #94a3b8; white-space: nowrap; }

/* ══ EXPANDED BODY ══════════════════════════════════════════════════ */
.sc-body { border-top: 1px solid #f1f5f9; padding: 14px 16px; background: #fafbfc; display: flex; flex-direction: column; gap: 12px; }

.sc-extra { background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px; display: flex; flex-direction: column; gap: 7px; }
.sc-extra-row { display: flex; gap: 10px; align-items: flex-start; }
.sc-extra-key { font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.04em; min-width: 70px; padding-top: 1px; flex-shrink: 0; }
.sc-extra-val { font-size: 13px; color: #334155; }
.sc-extra-val--pre { white-space: pre-wrap; }

.ticket-add-row { display: flex; align-items: center; gap: 6px; }
.btn-add-ticket {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 6px 12px; background: transparent; border: 1px dashed #cbd5e1;
  border-radius: 7px; font-size: 12px; color: #64748b; cursor: pointer; font-family: inherit;
}
.btn-add-ticket svg { width: 13px; height: 13px; }
.btn-add-ticket:hover { border-color: #1a3a5c; color: #1a3a5c; background: #f8fafc; }

.autocomplete-wrap { position: relative; flex: 1; }
.link-input { width: 100%; padding: 6px 10px; border: 1px solid #e2e8f0; border-radius: 7px; font-size: 12px; font-family: inherit; outline: none; box-sizing: border-box; }
.link-input:focus { border-color: #1a3a5c; }
.link-drop {
  position: absolute; top: 100%; left: 0; right: 0; margin-top: 3px;
  background: #fff; border: 1px solid #e2e8f0; border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.12); z-index: 50; max-height: 200px; overflow-y: auto;
}
.link-drop-item { width: 100%; display: flex; gap: 8px; padding: 7px 10px; border: none; background: transparent; cursor: pointer; text-align: left; font-size: 12px; font-family: inherit; }
.link-drop-item:hover { background: #f1f5f9; }
.drop-num { font-weight: 600; color: #1a3a5c; white-space: nowrap; flex-shrink: 0; }
.drop-obj { color: #475569; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.btn-link { padding: 6px 12px; background: #1a3a5c; color: #fff; border: none; border-radius: 7px; font-size: 12px; font-weight: 600; cursor: pointer; white-space: nowrap; font-family: inherit; }
.btn-link:disabled { opacity: 0.4; cursor: not-allowed; }
.btn-cancel-link { padding: 6px 10px; background: transparent; border: 1px solid #e2e8f0; border-radius: 7px; font-size: 12px; color: #64748b; cursor: pointer; font-family: inherit; white-space: nowrap; }

.ticket-table-wrap { overflow-x: auto; }
.ticket-empty { font-size: 12px; color: #94a3b8; text-align: center; padding: 8px 0; }
.ticket-table { width: 100%; border-collapse: collapse; font-size: 12px; }
.ticket-table th { padding: 6px 8px; text-align: left; color: #94a3b8; font-weight: 700; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #f1f5f9; white-space: nowrap; }
.ticket-table td { padding: 7px 8px; border-bottom: 1px solid #f8fafc; color: #1e293b; }
.td-num { font-family: monospace; font-weight: 700; color: #0f2742; white-space: nowrap; }
.td-handler { color: #475569; white-space: nowrap; }
.td-objet { max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.td-date { white-space: nowrap; color: #64748b; font-size: 11px; }
.status-badge { font-size: 10.5px; font-weight: 700; padding: 2px 7px; border-radius: 5px; text-transform: uppercase; letter-spacing: 0.04em; white-space: nowrap; }
.btn-unlink { border: none; background: transparent; color: #94a3b8; cursor: pointer; font-size: 13px; line-height: 1; }
.btn-unlink:hover { color: #dc2626; }

/* ══ ICONS ═════════════════════════════════════════════════════════ */
.icon-btn { width: 28px; height: 28px; display: inline-flex; align-items: center; justify-content: center; border: none; background: transparent; border-radius: 6px; cursor: pointer; color: #64748b; }
.icon-btn:hover { background: #f1f5f9; color: #1e293b; }
.icon-btn svg { width: 13px; height: 13px; }
.icon-btn--danger:hover { background: #fee2e2; color: #dc2626; }

/* ══ MODAL ═════════════════════════════════════════════════════════ */
.overlay { position: fixed; inset: 0; background: rgba(15,23,42,0.4); display: flex; align-items: center; justify-content: center; z-index: 200; padding: 24px; }
.modal { background: #fff; border-radius: 14px; width: 480px; max-width: 100%; box-shadow: 0 24px 60px rgba(15,23,42,0.25); display: flex; flex-direction: column; max-height: 90vh; }
.modal-wide { width: 560px; }
.modal-head { display: flex; align-items: center; justify-content: space-between; padding: 18px 20px 12px; border-bottom: 1px solid #f1f5f9; }
.modal-title { font-size: 15px; font-weight: 700; color: #0f172a; margin: 0; }
.close-btn { border: none; background: none; font-size: 16px; color: #94a3b8; cursor: pointer; }
.close-btn:hover { color: #1e293b; }
.modal-tabs { display: flex; border-bottom: 1px solid #f1f5f9; padding: 0 20px; }
.modal-tabs button { display: inline-flex; align-items: center; gap: 6px; padding: 10px 14px; border: none; background: transparent; font-size: 13px; font-weight: 500; color: #64748b; cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -1px; font-family: inherit; }
.modal-tabs button svg { width: 13px; height: 13px; }
.modal-tabs button.active { color: #1a3a5c; border-bottom-color: #1a3a5c; font-weight: 600; }
.modal-body { padding: 16px 20px; display: flex; flex-direction: column; gap: 12px; overflow-y: auto; }
.modal-foot { display: flex; gap: 8px; padding: 14px 20px; border-top: 1px solid #f1f5f9; }
.form-error { font-size: 12px; color: #dc2626; padding: 0 20px 12px; margin: 0; }
.tp-empty { font-size: 12px; color: #94a3b8; margin: 0; }

.field { display: flex; flex-direction: column; gap: 5px; }
.field > span { font-size: 12px; font-weight: 600; color: #475569; }
.field input, .field select, .field textarea { padding: 8px 10px; border: 1px solid #e2e8f0; border-radius: 7px; font-size: 13px; background: #f8fafc; color: #1e293b; font-family: inherit; }
.field input:focus, .field select:focus, .field textarea:focus { outline: none; border-color: #93c5fd; background: #fff; }
.field textarea { resize: vertical; }
.tpl-config { display: flex; flex-direction: column; gap: 12px; padding-top: 12px; border-top: 1px solid #f1f5f9; }

.btn-primary { display: inline-flex; align-items: center; gap: 6px; padding: 9px 16px; background: #1a3a5c; color: #fff; border: none; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; }
.btn-primary svg { width: 14px; height: 14px; }
.btn-primary:hover { background: #2e5f8a; }
.btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }
.btn-ghost { display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; border: 1px solid #e2e8f0; background: #fff; border-radius: 8px; font-size: 13px; color: #475569; cursor: pointer; font-family: inherit; }
.btn-ghost:hover { background: #f8fafc; }

@media (max-width: 800px) {
  .subject-grid { grid-template-columns: 1fr; }
  .client-grid { grid-template-columns: 1fr; }
}
</style>

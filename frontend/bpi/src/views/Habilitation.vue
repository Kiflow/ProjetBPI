<template>
  <div class="hab-page">

    <!-- ── Panneau gauche : clients gérés ─────────────────────── -->
    <aside class="left-panel">
      <div class="panel-header">
        <span class="panel-title">Clients gérés</span>
        <button class="btn-add" @click="openAddClient">
          <svg viewBox="0 0 20 20" fill="currentColor"><path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z"/></svg>
          Ajouter
        </button>
      </div>

      <div v-if="loadingClients" class="panel-empty">Chargement…</div>
      <div v-else-if="!habClients.length" class="panel-empty">Aucun client géré par habilitation.</div>
      <ul v-else class="client-list">
        <li
          v-for="c in habClients" :key="c.id"
          class="client-item"
          :class="{ active: selectedClient?.id === c.id }"
          @click="selectClient(c)"
        >
          <div class="client-item-info">
            <span class="client-item-name">{{ c.compte }}</span>
            <span class="client-item-pac">{{ c.code_client }}</span>
          </div>
          <span class="client-item-badge">{{ c.nb_interlocuteurs }}</span>
          <button class="btn-icon danger" title="Supprimer" @click.stop="removeClient(c)">
            <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193v-.443A2.75 2.75 0 0 0 11.25 1h-2.5Zm0 1.5h2.5c.69 0 1.25.56 1.25 1.25v.25h-5v-.25c0-.69.56-1.25 1.25-1.25ZM9.25 7a.75.75 0 0 0 0 1.5h1.5a.75.75 0 0 0 0-1.5h-1.5Z" clip-rule="evenodd"/></svg>
          </button>
        </li>
      </ul>

    </aside>

    <!-- ── Panneau principal : interlocuteurs ─────────────────── -->
    <main class="main-panel">
      <div v-if="!selectedClient" class="main-empty">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"/></svg>
        <p>Sélectionnez un client pour voir ses interlocuteurs chefs de file</p>
      </div>

      <template v-else>
        <div class="main-header">
          <div class="main-header-left">
            <div class="main-client-name">{{ selectedClient.compte }}</div>
            <span class="main-client-pac">Code client : {{ selectedClient.code_client }}</span>
          </div>
        </div>

        <div v-if="loadingInterlo" class="main-empty">Chargement…</div>
        <div v-else-if="!interlocuteurs.length" class="main-empty small">
          Aucun interlocuteur chef de file pour ce client.
        </div>

        <div v-else class="interlo-grid">
          <div v-for="(p, i) in interlocuteurs" :key="i" class="interlo-card" :class="{ 'is-chef': p.chef_de_file }">
            <div class="interlo-avatar" :class="{ 'avatar-chef': p.chef_de_file }">{{ initials(p.prenom, p.nom) }}</div>
            <div class="interlo-info">
              <div class="interlo-name">{{ p.prenom }} {{ p.nom }}</div>
              <div class="interlo-poste">{{ p.intitule_poste || "—" }}</div>
              <button
                class="chef-toggle"
                :class="{ active: p.chef_de_file }"
                :title="p.chef_de_file ? 'Retirer chef de file' : 'Marquer chef de file'"
                @click="toggleChef(p)"
              >
                <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.403 12.652a3 3 0 0 0 0-5.304 3 3 0 0 0-3.75-3.751 3 3 0 0 0-5.305 0 3 3 0 0 0-3.751 3.75 3 3 0 0 0 0 5.305 3 3 0 0 0 3.75 3.751 3 3 0 0 0 5.305 0 3 3 0 0 0 3.751-3.75Zm-2.546-4.46a.75.75 0 0 0-1.214-.883l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clip-rule="evenodd"/></svg>
                {{ p.chef_de_file ? "Chef de file" : "Marquer chef de file" }}
              </button>
            </div>
          </div>
        </div>
      </template>
    </main>

    <!-- ── Modal : ajouter un client ─────────────────────────── -->
    <div v-if="showAddClient" class="modal-backdrop" @click.self="showAddClient = false">
      <div class="modal">
        <div class="modal-header">
          <span class="modal-title">Ajouter un client géré par habilitation</span>
          <button class="modal-close" @click="showAddClient = false">✕</button>
        </div>
        <div class="modal-body">
          <label class="form-label">Client</label>
          <select v-model="addClientForm.selected" class="form-input">
            <option value="">— Sélectionner un client —</option>
            <option v-for="c in availableClients" :key="c.pac" :value="c">
              {{ c.name }} ({{ c.pac }})
            </option>
          </select>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="showAddClient = false">Annuler</button>
          <button class="btn-primary" :disabled="!addClientForm.selected" @click="confirmAddClient">Ajouter</button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import api from "../services/api";

// ── État ──────────────────────────────────────────────────────
const habClients       = ref([]);
const selectedClient   = ref(null);
const interlocuteurs   = ref([]);
const availableClients = ref([]);
const loadingClients   = ref(false);
const loadingInterlo   = ref(false);

const showAddClient = ref(false);
const addClientForm = ref({ selected: "" });

// ── Chargement ────────────────────────────────────────────────
const loadClients = async () => {
  loadingClients.value = true;
  try {
    const res = await api.get("/habilitation/clients");
    habClients.value = res.data;
  } finally {
    loadingClients.value = false;
  }
};

const loadAvailableClients = async () => {
  try {
    const res = await api.get("/clients");
    availableClients.value = (res.data.clients || []).filter(
      c => !habClients.value.some(h => h.code_client === c.pac)
    );
  } catch {}
};

const selectClient = async (c) => {
  selectedClient.value = c;
  loadingInterlo.value = true;
  try {
    const res = await api.get(`/habilitation/clients/${c.id}/interlocuteurs`);
    interlocuteurs.value = res.data;
  } finally {
    loadingInterlo.value = false;
  }
};

onMounted(loadClients);

// ── Clients ───────────────────────────────────────────────────
const openAddClient = async () => {
  addClientForm.value = { selected: "" };
  await loadAvailableClients();
  showAddClient.value = true;
};

const confirmAddClient = async () => {
  const c = addClientForm.value.selected;
  if (!c) return;
  await api.post("/habilitation/clients", {
    code_client: c.pac,
    compte: c.name,
    client_num: ""
  });
  showAddClient.value = false;
  await loadClients();
};

const removeClient = async (c) => {
  if (!confirm(`Supprimer "${c.compte}" de l'habilitation ?`)) return;
  await api.delete(`/habilitation/clients/${c.id}`);
  if (selectedClient.value?.id === c.id) selectedClient.value = null;
  await loadClients();
};

// ── Chef de file ──────────────────────────────────────────────
const toggleChef = async (p) => {
  const res = await api.post(`/habilitation/clients/${selectedClient.value.id}/toggle-chef-de-file`, {
    nom: p.nom, prenom: p.prenom
  });
  p.chef_de_file = res.data.chef_de_file;
  await loadClients(); // met à jour le compteur
};

// ── Utilitaires ───────────────────────────────────────────────
const initials = (prenom, nom) =>
  `${(prenom || " ")[0]}${(nom || " ")[0]}`.toUpperCase();
</script>

<style scoped>
.hab-page {
  display: flex;
  margin: -24px;
  height: calc(100% + 48px);
  background: #f1f5f9;
  font-family: Inter, sans-serif;
  overflow: hidden;
}

/* ── Panneau gauche ──────────────────────────────────────────── */
.left-panel {
  width: 280px;
  flex-shrink: 0;
  background: #ffffff;
  border-right: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 14px;
  border-bottom: 1px solid #e2e8f0;
}

.panel-title {
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #64748b;
}

.panel-empty {
  padding: 24px 16px;
  font-size: 13px;
  color: #94a3b8;
  text-align: center;
}

.client-list {
  list-style: none;
  margin: 0;
  padding: 6px 0;
  overflow-y: auto;
  flex: 1;
}

.client-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  cursor: pointer;
  transition: background 0.12s;
  border-left: 3px solid transparent;
}

.client-item:hover { background: #f8fafc; }
.client-item.active {
  background: #eff6ff;
  border-left-color: #1a3a5c;
}

.client-item-info { flex: 1; min-width: 0; }
.client-item-name {
  font-size: 13px;
  font-weight: 600;
  color: #0f172a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
}
.client-item-pac { font-size: 11px; color: #94a3b8; }

.client-item-badge {
  font-size: 11px;
  font-weight: 700;
  background: #f1f5f9;
  color: #64748b;
  border: 1px solid #e2e8f0;
  border-radius: 99px;
  padding: 1px 7px;
  flex-shrink: 0;
}


/* ── Panneau principal ───────────────────────────────────────── */
.main-panel {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.main-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: #94a3b8;
  font-size: 14px;
  text-align: center;
}
.main-empty.small { flex: none; }
.main-empty svg { width: 48px; height: 48px; stroke: #cbd5e0; }

.main-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 16px 20px;
}

.main-header-left { display: flex; flex-direction: column; gap: 2px; }
.main-client-name { font-size: 18px; font-weight: 700; color: #0f172a; }
.main-client-pac  { font-size: 12px; color: #94a3b8; }

/* ── Grille interlocuteurs ───────────────────────────────────── */
.interlo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 14px;
}

.interlo-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 14px;
  transition: box-shadow 0.15s, border-color 0.2s;
}
.interlo-card:hover { box-shadow: 0 4px 12px rgba(15,23,42,0.08); }
.interlo-card.is-chef { border-color: #bfdbfe; background: #f0f7ff; }

.interlo-avatar {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: #94a3b8;
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background 0.2s;
}
.avatar-chef { background: #1a3a5c; }

.interlo-info { flex: 1; min-width: 0; }

.chef-toggle {
  display: inline-flex;
  margin-top: 8px;
  align-items: center;
  gap: 5px;
  padding: 4px 9px;
  border-radius: 7px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  color: #94a3b8;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
}
.chef-toggle svg { width: 14px; height: 14px; }
.chef-toggle:hover { background: #eff6ff; color: #1a3a5c; border-color: #bfdbfe; }
.chef-toggle.active {
  background: #1a3a5c;
  color: #fff;
  border-color: #1a3a5c;
}
.interlo-name  { font-size: 14px; font-weight: 700; color: #0f172a; margin-bottom: 2px; }
.interlo-poste { font-size: 12px; color: #64748b; margin-bottom: 8px; }
.interlo-badge {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #16a34a;
  background: #dcfce7;
  border: 1px solid #bbf7d0;
  border-radius: 4px;
  padding: 1px 6px;
}


/* ── Boutons génériques ──────────────────────────────────────── */
.btn-add {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 7px 12px;
  background: #1a3a5c;
  color: #fff;
  border: none;
  border-radius: 7px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s;
}
.btn-add svg { width: 14px; height: 14px; }
.btn-add:hover { background: #2e5f8a; }

.btn-secondary {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 12px;
  background: #f1f5f9;
  color: #334155;
  border: 1px solid #e2e8f0;
  border-radius: 7px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-secondary svg { width: 14px; height: 14px; }
.btn-secondary:hover:not(:disabled) { background: #e2e8f0; }
.btn-secondary:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
}
.btn-icon svg { width: 15px; height: 15px; }
.btn-icon.danger { color: #94a3b8; }
.btn-icon.danger:hover { background: #fee2e2; color: #dc2626; }

.btn-primary {
  padding: 8px 16px;
  background: #1a3a5c;
  color: #fff;
  border: none;
  border-radius: 7px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-primary:hover:not(:disabled) { background: #2e5f8a; }
.btn-primary:disabled { opacity: 0.45; cursor: not-allowed; }

/* ── Modal ───────────────────────────────────────────────────── */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15,23,42,0.35);
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal {
  background: #fff;
  border-radius: 12px;
  width: 420px;
  max-width: 95vw;
  box-shadow: 0 20px 40px rgba(15,23,42,0.2);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #f1f5f9;
}
.modal-title { font-size: 14px; font-weight: 700; color: #0f172a; }
.modal-close {
  background: none;
  border: none;
  font-size: 16px;
  color: #94a3b8;
  cursor: pointer;
  line-height: 1;
}
.modal-close:hover { color: #0f172a; }

.modal-body {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 14px 20px;
  border-top: 1px solid #f1f5f9;
}

.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.form-group { display: flex; flex-direction: column; gap: 4px; }
.form-label { font-size: 12px; font-weight: 600; color: #374151; }
.form-input {
  padding: 8px 10px;
  border: 1px solid #cbd5e0;
  border-radius: 7px;
  font-size: 13px;
  color: #0f172a;
  background: #fff;
  outline: none;
  transition: border-color 0.15s;
}
.form-input:focus { border-color: #1a3a5c; }
</style>

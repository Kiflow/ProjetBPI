<template>
  <div class="board-page" @click="showPrioFor = null">
    <!-- Paper grain overlay -->
    <div class="paper-grain" aria-hidden="true"></div>

    <!-- Header -->
    <div class="board-header">
      <div class="board-header-main">
        <div>
          <div class="eyebrow">Utilitaire · Tableau d'équipe</div>
          <h1 class="board-title">To-do cockpit <span class="board-title-dim">· board</span></h1>
          <p class="board-hint">Glissez les stickers d'une colonne à l'autre. La couleur reflète la priorité.</p>
        </div>
        <div class="kpi-strip">
          <div class="kpi-card"><div class="kpi-lbl">ACTIVES</div><div class="kpi-val">{{ counts.active }}</div></div>
          <div class="kpi-card"><div class="kpi-lbl">AUJOURD'HUI</div><div class="kpi-val">{{ counts.today }}</div></div>
          <div class="kpi-card" :class="{ 'kpi-card--red': counts.overdue > 0 }"><div class="kpi-lbl">EN RETARD</div><div class="kpi-val">{{ counts.overdue }}</div></div>
          <div class="kpi-card"><div class="kpi-lbl">TERMINÉES</div><div class="kpi-val">{{ counts.done }}</div></div>
        </div>
      </div>

      <div class="tools-row">
        <div class="search-wrap">
          <svg class="search-icon" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clip-rule="evenodd"/></svg>
          <input v-model="search" type="search" class="search-input" placeholder="Rechercher un sticker…" />
        </div>
        <div class="prio-legend">
          <span v-for="p in PRIO_ORDER" :key="p" class="legend-item">
            <span class="legend-swatch" :style="legendSwatchStyle(p)"></span>
            {{ p }}
          </span>
        </div>
        <button class="btn-ghost" @click="cleanDone">
          <svg viewBox="0 0 20 20" fill="currentColor" width="13" height="13"><path fill-rule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5Z" clip-rule="evenodd"/></svg>
          Nettoyer terminées
        </button>
        <button class="btn-primary" @click="openAddModal">
          <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14"><path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z"/></svg>
          Ajouter une tâche
        </button>
      </div>
    </div>

    <!-- Kanban grid -->
    <div class="kanban-grid">
      <section
        v-for="col in COLS" :key="col.key"
        class="kanban-col"
        :style="colSectionStyle(col)"
        @dragover.prevent="hoverCol = col.key"
        @dragleave="hoverCol = null"
        @drop.prevent="onDrop(col.key)"
      >
        <div class="col-head">
          <span class="col-icon-wrap" :style="{ background: col.accent + '22', color: col.accent }">
            <svg viewBox="0 0 20 20" fill="currentColor" width="15" height="15" v-html="COL_ICON[col.key]"></svg>
          </span>
          <div class="col-title-wrap">
            <div class="col-title">{{ col.title }}</div>
            <div class="col-sub">{{ col.sub }}</div>
          </div>
          <span class="col-count" :style="{ color: col.accent, border: `1px solid ${col.accent}44` }">{{ colTasks(col.key).length }}</span>
        </div>

        <div class="col-body">
          <div v-if="!colTasks(col.key).length" class="col-empty" :class="{ 'col-empty--hover': hoverCol === col.key && dragId }">
            {{ hoverCol === col.key && dragId ? 'Relâchez ici pour déposer' : 'Glissez un sticker ici' }}
          </div>

          <article
            v-for="task in colTasks(col.key)" :key="task.id"
            class="sticker"
            draggable="true"
            :style="getStickerStyle(task)"
            @dragstart="onDragStart($event, task.id)"
            @dragend="onDragEnd"
            @mouseenter="hoveredTask = task.id"
            @mouseleave="hoveredTask = null; showPrioFor = null"
            @click.stop
          >
            <!-- Tape strip -->
            <div class="sticker-tape" :style="{ background: STICKER[task.priority].tape + 'cc' }"></div>
            <!-- Folded corner -->
            <div class="sticker-corner" :style="{ background: `linear-gradient(135deg, transparent 50%, ${STICKER[task.priority].bg2} 50%)` }"></div>

            <!-- Top row -->
            <div class="sticker-toprow">
              <button
                class="prio-chip"
                :style="{ background: 'rgba(255,255,255,0.6)', border: `1px solid ${STICKER[task.priority].tape}`, color: STICKER[task.priority].ink }"
                @click.stop="showPrioFor = showPrioFor === task.id ? null : task.id"
                @mousedown.stop
              >
                <span class="prio-dot" :style="{ background: STICKER[task.priority].dot }"></span>
                {{ task.priority }}
              </button>
              <button v-if="hoveredTask === task.id" class="del-btn" :style="{ background: 'rgba(255,255,255,0.55)', color: STICKER[task.priority].ink }" @click.stop="removeTask(task.id)" @mousedown.stop>
                <svg viewBox="0 0 20 20" fill="currentColor" width="11" height="11"><path fill-rule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5Z" clip-rule="evenodd"/></svg>
              </button>
            </div>

            <!-- Priority popover -->
            <div v-if="showPrioFor === task.id" class="prio-popover" @mousedown.stop @click.stop>
              <button v-for="p in PRIO_ORDER" :key="p" class="prio-pop-btn" :style="{ background: STICKER[p].bg, boxShadow: p === task.priority ? `0 0 0 1.5px ${STICKER[p].dot}` : 'none' }" :title="p" @click="changePrio(task.id, p); showPrioFor = null"></button>
            </div>

            <!-- Title -->
            <h3 class="sticker-title" :style="{ color: STICKER[task.priority].ink, textDecoration: task.done ? 'line-through' : 'none' }">{{ task.title }}</h3>

            <!-- Note -->
            <p v-if="task.note" class="sticker-note" :style="{ color: STICKER[task.priority].ink }">{{ task.note }}</p>

            <!-- Footer -->
            <div class="sticker-footer" :style="{ borderTopColor: STICKER[task.priority].tape + 'aa' }">
              <div class="sticker-meta">
                <span v-if="task.due" class="due-badge" :style="dueBadgeStyle(task)">
                  <svg viewBox="0 0 20 20" fill="currentColor" width="10" height="10"><path fill-rule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm.75-13.25a.75.75 0 0 0-1.5 0v5c0 .199.079.39.22.53l3 3a.75.75 0 1 0 1.06-1.06l-2.78-2.78V4.75Z" clip-rule="evenodd"/></svg>
                  {{ dayHint(task.due) }}
                </span>
                <span v-if="task.tag" class="tag-badge" :style="{ color: STICKER[task.priority].ink }">#{{ task.tag }}</span>
              </div>
              <button class="check-btn" :style="checkBtnStyle(task)" @click.stop="toggleDone(task.id)" @mousedown.stop>
                <svg v-if="task.done" viewBox="0 0 20 20" fill="#fff" width="13" height="13"><path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 1 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clip-rule="evenodd"/></svg>
              </button>
            </div>
          </article>
        </div>
      </section>
    </div>

    <!-- Modal: Ajouter une tâche -->
    <div v-if="showAddModal" class="overlay" @click.self="showAddModal = false">
      <div class="modal">
        <div class="modal-head">
          <h2 class="modal-title">Nouvelle tâche</h2>
          <button type="button" class="close-btn" @click="showAddModal = false">✕</button>
        </div>
        <div class="modal-body">
          <label class="field">
            <span>Tâche *</span>
            <input ref="titleInputRef" v-model="draft.title" type="text" placeholder="Ex : Relance client, suivi incident…" @keydown.enter="addTask" />
          </label>
          <label class="field">
            <span>Note (facultatif)</span>
            <input v-model="draft.note" type="text" placeholder="Un contexte ou rappel utile" />
          </label>
          <div class="field">
            <span>Colonne</span>
            <div class="col-picker">
              <button v-for="col in COLS.filter(c => c.key !== 'done')" :key="col.key" type="button"
                class="col-pick-btn" :class="{ active: draft.col === col.key }"
                :style="draft.col === col.key ? { background: col.accent, color: '#fff', borderColor: col.accent } : {}"
                @click="draft.col = col.key"
              >{{ col.title }}</button>
            </div>
          </div>
          <div class="field">
            <span>Priorité</span>
            <div class="prio-picker-modal">
              <button v-for="p in PRIO_ORDER" :key="p" type="button"
                class="prio-modal-btn"
                :style="{ background: STICKER[p].bg, border: `1.5px solid ${draft.priority === p ? STICKER[p].dot : 'transparent'}`, boxShadow: draft.priority === p ? `0 0 0 2px ${STICKER[p].dot}44` : 'none' }"
                @click="draft.priority = p"
              >
                <span class="prio-dot" :style="{ background: STICKER[p].dot }"></span>
                <span :style="{ color: STICKER[p].ink, fontWeight: 700, fontSize: '12px' }">{{ p }}</span>
              </button>
            </div>
          </div>
          <label class="field">
            <span>Date d'échéance (facultatif)</span>
            <input v-model="draft.due" type="date" class="date-input" />
          </label>
        </div>
        <div class="modal-foot">
          <button type="button" class="btn-primary" @click="addTask">Ajouter</button>
          <button type="button" class="btn-ghost-modal" @click="showAddModal = false">Annuler</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";

// ── Color palette by priority ───────────────────────────────────────────────
const STICKER = {
  Critique: { bg:"#ffd6d6", bg2:"#ffb8b8", ink:"#7a1f1f", tape:"#f59c9c", dot:"#dc2626" },
  Haute:    { bg:"#ffe9b3", bg2:"#ffd680", ink:"#7a4a0e", tape:"#f5c87a", dot:"#f59e0b" },
  Moyenne:  { bg:"#c9e4ff", bg2:"#a8d0f5", ink:"#0e3a5f", tape:"#8fbde6", dot:"#0891b2" },
  Basse:    { bg:"#d8f0d4", bg2:"#bee0b8", ink:"#1d4a1a", tape:"#a8d4a3", dot:"#16a34a" },
};
const PRIO_ORDER = ["Critique", "Haute", "Moyenne", "Basse"];

// ── Column icon SVG paths (rendered via v-html) ─────────────────────────────
const COL_ICON = {
  today:   '<path fill-rule="evenodd" d="M9 4.5a.75.75 0 0 1 .721.544l.813 2.846a3.75 3.75 0 0 0 2.576 2.576l2.846.813a.75.75 0 0 1 0 1.442l-2.846.813a3.75 3.75 0 0 0-2.576 2.576l-.813 2.846a.75.75 0 0 1-1.442 0l-.813-2.846a3.75 3.75 0 0 0-2.576-2.576l-2.846-.813a.75.75 0 0 1 0-1.442l2.846-.813A3.75 3.75 0 0 0 7.466 7.89l.813-2.846A.75.75 0 0 1 9 4.5Z" clip-rule="evenodd"/>',
  week:    '<path d="M5.75 2a.75.75 0 0 1 .75.75V4h7V2.75a.75.75 0 0 1 1.5 0V4h.25A2.75 2.75 0 0 1 18 6.75v8.5A2.75 2.75 0 0 1 15.25 18H4.75A2.75 2.75 0 0 1 2 15.25v-8.5A2.75 2.75 0 0 1 4.75 4H5V2.75A.75.75 0 0 1 5.75 2Zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75Z"/>',
  backlog: '<path fill-rule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm.75-13.25a.75.75 0 0 0-1.5 0v5c0 .199.079.39.22.53l3 3a.75.75 0 1 0 1.06-1.06l-2.78-2.78V4.75Z" clip-rule="evenodd"/>',
  done:    '<path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 1 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clip-rule="evenodd"/>',
};

// ── Columns ─────────────────────────────────────────────────────────────────
const COLS = [
  { key:"today",   title:"Aujourd'hui",   sub:"Je le fais maintenant",   accent:"#0f2742" },
  { key:"week",    title:"Cette semaine", sub:"Avant la fin de semaine", accent:"#0891b2" },
  { key:"backlog", title:"Backlog",       sub:"Plus tard / sans date",   accent:"#7c3aed" },
  { key:"done",    title:"Terminé",       sub:"Bien joué",               accent:"#16a34a" },
];

// ── Quick shortcuts ──────────────────────────────────────────────────────────
const SHORTCUTS = [
  { id:"sc-1", title:"Relance client",   priority:"Haute" },
  { id:"sc-2", title:"Point équipe",     priority:"Moyenne" },
  { id:"sc-3", title:"Nettoyer backlog", priority:"Basse" },
  { id:"sc-4", title:"CR de réunion",    priority:"Moyenne" },
];

// ── Date helpers ─────────────────────────────────────────────────────────────
const getToday = () => { const d = new Date(); d.setHours(0,0,0,0); return d; };
const offsetDate = (n) => {
  const d = new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate() + n);
  return d.toISOString().slice(0,10);
};
const daysFromToday = (iso) => {
  if (!iso) return null;
  const d = new Date(iso); d.setHours(0,0,0,0);
  return Math.round((d - getToday()) / 86400000);
};
const fmtDate = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  return d.toLocaleDateString("fr-FR", { day:"2-digit", month:"short" });
};
const dayHint = (iso) => {
  const days = daysFromToday(iso);
  if (days === null) return "";
  if (days < -1) return `il y a ${-days} j`;
  if (days === -1) return "hier";
  if (days === 0) return "aujourd'hui";
  if (days === 1) return "demain";
  if (days <= 7) return `dans ${days} j`;
  return fmtDate(iso);
};
const isOverdue = (task) => !task.done && (daysFromToday(task.due) ?? 0) < 0;

// ── Deterministic tilt ───────────────────────────────────────────────────────
const tilt = (id) => {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return ((Math.abs(h) % 60) / 10 - 3).toFixed(2);
};

// ── Seed data ────────────────────────────────────────────────────────────────
const SAMPLE = [
  { id:"t-01", title:"Relancer client RENAULT — incident permanence", note:"Appel + mail de synthèse, joindre dernière analyse", priority:"Critique", due:offsetDate(-2), done:false, tag:"client" },
  { id:"t-02", title:"Valider habilitation C00876 (FERRAND)", note:"Workflow bloqué en attente N+1", priority:"Haute", due:offsetDate(-1), done:false, tag:"habilitation" },
  { id:"t-03", title:"CR de réunion comité hebdo", note:"Synthèse + diffusion équipe avant 18h", priority:"Haute", due:offsetDate(0), done:false, tag:"interne" },
  { id:"t-04", title:"Point équipe — sujets centralisation", note:"Slot 15 min · valider plan d'action", priority:"Moyenne", due:offsetDate(0), done:false, tag:"interne" },
  { id:"t-05", title:"Suivi incident P1 ServiceNow #INC-78421", note:"Vérifier RCA livré + clôture", priority:"Critique", due:offsetDate(0), done:false, tag:"incident" },
  { id:"t-06", title:"Préparer fiche client LVMH", note:"Brief commercial pour rendez-vous demain", priority:"Moyenne", due:offsetDate(0), done:true, tag:"client" },
  { id:"t-07", title:"Revue tickets > 30 jours", note:"Nettoyage backlog hebdomadaire", priority:"Moyenne", due:offsetDate(2), done:false, tag:"backlog" },
  { id:"t-08", title:"Note de frais janvier", note:"Scan justificatifs + soumission", priority:"Basse", due:offsetDate(3), done:false, tag:"rh" },
  { id:"t-09", title:"Préparer comité de pilotage RMS", note:"Slides priorités Q1 + relire compte-rendu", priority:"Haute", due:offsetDate(4), done:false, tag:"interne" },
  { id:"t-10", title:"Mise à jour wiki — procédure permanence", note:"Intégrer retours équipe support", priority:"Moyenne", due:offsetDate(5), done:false, tag:"wiki" },
  { id:"t-11", title:"Refonte template courrier relance", note:"Aligner sur charte graphique 2026", priority:"Basse", due:offsetDate(14), done:false, tag:"interne" },
  { id:"t-12", title:"Veille concurrentielle Q1", note:"Synthèse veille marché à compiler", priority:"Basse", due:"", done:false, tag:"veille" },
  { id:"t-13", title:"Formation nouvel outil facturation", note:"Inscription session février", priority:"Moyenne", due:"", done:false, tag:"formation" },
];

const seedTasks = () => SAMPLE.map(t => {
  let col;
  if (t.done) col = "done";
  else {
    const days = daysFromToday(t.due);
    col = (days === null || days > 7) ? "backlog" : days <= 0 ? "today" : "week";
  }
  return { ...t, col };
});

// ── State ────────────────────────────────────────────────────────────────────
const STORAGE_KEY = "todo_cockpit_v2";
const tasks       = ref([]);
const search      = ref("");
const draft       = ref({ title: "", note: "", priority: "Moyenne", col: "today", due: "" });
const dragId      = ref(null);
const hoverCol    = ref(null);
const hoveredTask  = ref(null);
const showPrioFor  = ref(null);
const showAddModal = ref(false);
const titleInputRef = ref(null);

onMounted(() => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    tasks.value = saved ? JSON.parse(saved) : seedTasks();
  } catch { tasks.value = seedTasks(); }
});

watch(tasks, (v) => { localStorage.setItem(STORAGE_KEY, JSON.stringify(v)); }, { deep: true });

// ── Computed ─────────────────────────────────────────────────────────────────
const counts = computed(() => ({
  active:  tasks.value.filter(t => !t.done).length,
  today:   tasks.value.filter(t => !t.done && t.col === "today").length,
  overdue: tasks.value.filter(t => !t.done && (daysFromToday(t.due) ?? 0) < 0).length,
  done:    tasks.value.filter(t => t.done).length,
}));

const colTasks = (colKey) => {
  const q = search.value.toLowerCase();
  return tasks.value.filter(t =>
    t.col === colKey &&
    (!q || t.title.toLowerCase().includes(q) || (t.note || "").toLowerCase().includes(q))
  );
};

// ── Style helpers ─────────────────────────────────────────────────────────────
const getStickerStyle = (task) => {
  const s = STICKER[task.priority] || STICKER.Basse;
  const t = tilt(task.id);
  const dragging = dragId.value === task.id;
  const hover = hoveredTask.value === task.id;
  return {
    position: "relative",
    background: `linear-gradient(140deg, ${s.bg} 0%, ${s.bg2} 100%)`,
    color: s.ink,
    borderRadius: "6px",
    padding: "14px 14px 12px",
    cursor: "grab",
    transform: `rotate(${dragging ? 0 : t}deg)${hover && !dragging ? " translateY(-2px) scale(1.01)" : ""}`,
    boxShadow: dragging
      ? "0 18px 36px rgba(15,23,42,0.28), 0 4px 10px rgba(15,23,42,0.18)"
      : hover
      ? "0 10px 22px rgba(15,23,42,0.18), 0 2px 5px rgba(15,23,42,0.12)"
      : "0 4px 10px rgba(15,23,42,0.12), 0 1px 2px rgba(15,23,42,0.10)",
    opacity: dragging ? 0.6 : task.done ? 0.7 : 1,
    transition: "transform 0.18s cubic-bezier(.2,.7,.3,1), box-shadow 0.18s",
    userSelect: "none",
    filter: task.done ? "saturate(0.7)" : "none",
  };
};

const colSectionStyle = (col) => {
  const isHover = hoverCol.value === col.key && dragId.value;
  return {
    background: isHover ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.55)",
    border: isHover ? `2px dashed ${col.accent}` : "1.5px dashed rgba(15,39,66,0.18)",
    boxShadow: isHover ? `inset 0 0 0 4px ${col.accent}22` : "none",
    transition: "background 0.15s, border-color 0.15s, box-shadow 0.15s",
  };
};

const dueBadgeStyle = (task) => {
  const s = STICKER[task.priority] || STICKER.Basse;
  const over = isOverdue(task);
  return {
    color: over ? "#7a1f1f" : s.ink,
    background: over ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.5)",
    border: over ? "1px solid #dc262655" : "1px solid transparent",
  };
};

const checkBtnStyle = (task) => {
  const s = STICKER[task.priority] || STICKER.Basse;
  return {
    border: `1.5px solid ${s.ink}`,
    background: task.done ? s.ink : "rgba(255,255,255,0.6)",
  };
};

const legendSwatchStyle = (p) => ({
  background: STICKER[p].bg,
  border: `1px solid ${STICKER[p].bg2}`,
  transform: `rotate(${p==="Critique"?-4:p==="Haute"?2:p==="Moyenne"?-2:3}deg)`,
});

// ── Modal ─────────────────────────────────────────────────────────────────────
const openAddModal = () => {
  draft.value = { title: "", note: "", priority: "Moyenne", col: "today", due: "" };
  showAddModal.value = true;
  setTimeout(() => titleInputRef.value?.focus(), 50);
};

// ── Actions ───────────────────────────────────────────────────────────────────
const moveTask = (id, col) => {
  tasks.value = tasks.value.map(t => t.id === id ? { ...t, col, done: col === "done" } : t);
};
const removeTask = (id) => { tasks.value = tasks.value.filter(t => t.id !== id); };
const toggleDone = (id) => {
  tasks.value = tasks.value.map(t => {
    if (t.id !== id) return t;
    const done = !t.done;
    return { ...t, done, col: done ? "done" : t.col };
  });
};
const changePrio = (id, prio) => {
  tasks.value = tasks.value.map(t => t.id === id ? { ...t, priority: prio } : t);
};
const addTask = () => {
  if (!draft.value.title.trim()) return;
  tasks.value = [{
    id: "new-" + Date.now(),
    title: draft.value.title.trim(),
    note: draft.value.note.trim(),
    tag: "",
    priority: draft.value.priority,
    due: draft.value.due || "",
    done: false,
    col: draft.value.col,
  }, ...tasks.value];
  showAddModal.value = false;
};
const addShortcut = (sc) => {
  tasks.value = [{
    id: "sc-" + Date.now(),
    title: sc.title, note: "", tag: "",
    priority: sc.priority, due: offsetDate(0), done: false, col: "today",
  }, ...tasks.value];
};
const cleanDone = () => { tasks.value = tasks.value.filter(t => !t.done); };

// ── Drag & drop ───────────────────────────────────────────────────────────────
const onDragStart = (e, id) => {
  dragId.value = id;
  e.dataTransfer.effectAllowed = "move";
  try { e.dataTransfer.setData("text/plain", id); } catch {}
};
const onDragEnd = () => { dragId.value = null; hoverCol.value = null; };
const onDrop = (colKey) => {
  if (dragId.value) moveTask(dragId.value, colKey);
  dragId.value = null; hoverCol.value = null;
};
</script>

<style scoped>
.board-page {
  margin: -24px;
  height: calc(100% + 48px);
  display: flex;
  flex-direction: column;
  background: radial-gradient(1200px 600px at 0% 0%, #eef2f6 0%, #f6f1e8 60%, #f1ebdd 100%);
  position: relative;
  overflow: hidden;
  box-sizing: border-box;
}

.paper-grain {
  position: absolute; inset: 0; pointer-events: none; opacity: 0.4; z-index: 0;
  background-image:
    repeating-linear-gradient(0deg, rgba(120,90,40,0.03) 0px, rgba(120,90,40,0.03) 1px, transparent 1px, transparent 6px),
    repeating-linear-gradient(90deg, rgba(120,90,40,0.03) 0px, rgba(120,90,40,0.03) 1px, transparent 1px, transparent 6px);
}

/* ── HEADER ─────────────────────────────────────────────── */
.board-header {
  padding: 22px 28px 14px;
  position: relative; z-index: 1; flex-shrink: 0;
}
.board-header-main {
  display: flex; justify-content: space-between; align-items: flex-end;
  gap: 18px; flex-wrap: wrap; margin-bottom: 16px;
}
.eyebrow {
  font-size: 10.5px; font-weight: 700; color: #94a3b8;
  text-transform: uppercase; letter-spacing: 0.1em;
}
.board-title { font-size: 26px; font-weight: 700; color: #0f172a; letter-spacing: -0.015em; margin: 4px 0; }
.board-title-dim { color: #94a3b8; font-weight: 500; font-size: 18px; }
.board-hint { font-size: 13px; color: #64748b; }

/* KPI strip */
.kpi-strip { display: flex; gap: 8px; flex-shrink: 0; }
.kpi-card {
  background: rgba(255,255,255,0.7); backdrop-filter: blur(6px);
  border: 1px solid #e2e8f0; border-radius: 10px;
  padding: 8px 13px; text-align: center; min-width: 88px;
}
.kpi-card--red { border-color: #fecaca; }
.kpi-lbl { font-size: 9.5px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; }
.kpi-card--red .kpi-lbl { color: #b91c1c; }
.kpi-val { font-size: 22px; font-weight: 700; color: #0f172a; font-family: "JetBrains Mono", monospace; margin-top: 2px; line-height: 1; }
.kpi-card--red .kpi-val { color: #b91c1c; }

/* Tools row */
.tools-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.search-wrap { position: relative; }
.search-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); width: 14px; height: 14px; color: #94a3b8; pointer-events: none; }
.search-input {
  padding: 8px 12px 8px 30px; border: 1px solid #e2e8f0; border-radius: 8px;
  font-size: 13px; background: #fff; outline: none; width: 240px; font-family: inherit; color: #0f172a;
}
.search-input:focus { border-color: #0f2742; }

.prio-legend { display: flex; align-items: center; gap: 14px; margin-left: 6px; font-size: 11.5px; color: #64748b; font-weight: 600; }
.legend-item { display: inline-flex; align-items: center; gap: 6px; }
.legend-swatch { width: 14px; height: 14px; border-radius: 3px; flex-shrink: 0; display: inline-block; }

.btn-ghost {
  display: inline-flex; align-items: center; gap: 7px; padding: 8px 12px;
  border: 1px solid #e2e8f0; background: #fff; border-radius: 8px;
  font-size: 12.5px; font-weight: 600; color: #64748b; cursor: pointer; font-family: inherit;
  margin-left: auto; white-space: nowrap;
}
.btn-ghost:hover { background: #f8fafc; }

/* ── KANBAN ─────────────────────────────────────────────── */
.kanban-grid {
  flex: 1; min-height: 0;
  display: grid; grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px; padding: 0 28px;
  position: relative; z-index: 1;
}
.kanban-col {
  border-radius: 14px; display: flex; flex-direction: column;
  min-height: 0; overflow: hidden;
}

.col-head {
  padding: 12px 14px 10px; display: flex; align-items: center; gap: 10px;
  border-bottom: 1px dashed rgba(15,39,66,0.15); flex-shrink: 0;
}
.col-icon-wrap { width: 28px; height: 28px; border-radius: 7px; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }
.col-title-wrap { flex: 1; min-width: 0; }
.col-title { font-size: 13.5px; font-weight: 700; color: #0f172a; letter-spacing: -0.005em; }
.col-sub { font-size: 11px; color: #64748b; }
.col-count {
  font-size: 11px; font-weight: 700; background: #fff;
  padding: 2px 8px; border-radius: 10px; font-family: "JetBrains Mono", monospace;
}

.col-body {
  flex: 1; overflow-y: auto; padding: 16px 14px 20px;
  display: flex; flex-direction: column; gap: 14px; min-height: 0;
}
.col-body::-webkit-scrollbar { width: 5px; }
.col-body::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 3px; }
.col-body::-webkit-scrollbar-track { background: transparent; }

.col-empty {
  padding: 30px 12px; text-align: center; color: #94a3b8; font-size: 12px;
  border: 1.5px dashed rgba(15,39,66,0.15); border-radius: 10px;
  background: rgba(255,255,255,0.4); font-style: italic;
}
.col-empty--hover { color: #0f2742; background: rgba(255,255,255,0.7); font-style: normal; }

/* ── STICKER ────────────────────────────────────────────── */
.sticker { position: relative; }

.sticker-tape {
  position: absolute; top: -7px; left: 50%; transform: translateX(-50%) rotate(-2deg);
  width: 44px; height: 14px; border-radius: 1px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.08);
}
.sticker-corner {
  position: absolute; right: 0; bottom: 0; width: 18px; height: 18px; border-bottom-right-radius: 6px;
}

.sticker-toprow {
  display: flex; align-items: center; justify-content: space-between;
  gap: 6px; margin-bottom: 8px; margin-top: 4px;
}
.prio-chip {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 2px 7px 2px 6px; border-radius: 10px;
  font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em;
  cursor: pointer; font-family: inherit;
}
.prio-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
.del-btn {
  width: 22px; height: 22px; padding: 0; border: none; border-radius: 5px;
  cursor: pointer; display: inline-flex; align-items: center; justify-content: center;
}

.prio-popover {
  position: absolute; top: 36px; left: 10px; z-index: 10;
  background: #fff; border: 1px solid #e2e8f0; border-radius: 8px;
  box-shadow: 0 8px 20px rgba(15,23,42,0.15); padding: 5px; display: flex; gap: 3px;
}
.prio-pop-btn { width: 28px; height: 24px; border: none; border-radius: 5px; cursor: pointer; }

.sticker-title { margin: 0 0 6px; font-size: 15px; font-weight: 700; line-height: 1.25; letter-spacing: -0.005em; }
.sticker-note { margin: 0 0 10px; font-size: 12.5px; opacity: 0.78; line-height: 1.4; }

.sticker-footer {
  display: flex; align-items: center; justify-content: space-between;
  gap: 8px; margin-top: 6px; padding-top: 8px; border-top: 1px dashed;
}
.sticker-meta { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
.due-badge {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 10.5px; font-weight: 700; padding: 2px 6px; border-radius: 4px;
  font-family: "JetBrains Mono", monospace;
}
.tag-badge {
  font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px;
  background: rgba(255,255,255,0.45); text-transform: uppercase; letter-spacing: 0.06em;
}
.check-btn {
  width: 24px; height: 24px; border-radius: 6px; padding: 0;
  cursor: pointer; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;
}

/* ── BUTTONS ────────────────────────────────────────────── */
.btn-primary {
  display: inline-flex; align-items: center; justify-content: center; gap: 6px; padding: 9px 16px;
  background: #0f2742; color: #fff; border: none; border-radius: 8px;
  font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; white-space: nowrap;
}
.btn-primary:hover { background: #143a63; }
.btn-ghost-modal {
  display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px;
  border: 1px solid #e2e8f0; background: #fff; border-radius: 8px;
  font-size: 13px; color: #475569; cursor: pointer; font-family: inherit;
}
.btn-ghost-modal:hover { background: #f8fafc; }

/* ── MODAL ──────────────────────────────────────────────── */
.overlay {
  position: fixed; inset: 0; background: rgba(15,23,42,0.4);
  display: flex; align-items: center; justify-content: center; z-index: 200; padding: 24px;
  animation: fadeIn 0.15s ease;
}
.modal {
  background: #fff; border-radius: 14px; width: 460px; max-width: 100%;
  box-shadow: 0 24px 60px rgba(15,23,42,0.25);
  display: flex; flex-direction: column;
  animation: scaleIn 0.18s ease;
}
.modal-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 20px 22px 14px; border-bottom: 1px solid #f1f5f9;
}
.modal-title { font-size: 17px; font-weight: 700; color: #0f172a; margin: 0; }
.close-btn { border: none; background: none; font-size: 17px; color: #94a3b8; cursor: pointer; line-height: 1; padding: 2px; }
.close-btn:hover { color: #1e293b; }
.modal-body { padding: 18px 22px; display: flex; flex-direction: column; gap: 14px; }
.modal-foot { display: flex; gap: 8px; padding: 14px 22px 20px; }

.field { display: flex; flex-direction: column; gap: 6px; }
.field > span { font-size: 12px; font-weight: 600; color: #475569; }
.field input {
  padding: 9px 12px; border: 1px solid #e2e8f0; border-radius: 8px;
  font-size: 13px; background: #f8fafc; color: #1e293b; font-family: inherit;
}
.field input:focus { outline: none; border-color: #0f2742; background: #fff; }
.date-input { font-family: inherit; }

.col-picker { display: flex; gap: 6px; }
.col-pick-btn {
  flex: 1; padding: 8px 10px; border: 1.5px solid #e2e8f0; border-radius: 8px;
  font-size: 12px; font-weight: 600; background: #f8fafc; color: #64748b;
  cursor: pointer; font-family: inherit; white-space: nowrap; text-align: center;
  transition: background 0.12s, border-color 0.12s, color 0.12s;
}
.col-pick-btn:not(.active):hover { background: #f1f5f9; border-color: #cbd5e0; }

.prio-picker-modal { display: flex; gap: 8px; }
.prio-modal-btn {
  flex: 1; display: flex; align-items: center; gap: 7px;
  padding: 9px 12px; border-radius: 8px; cursor: pointer; font-family: inherit;
  transition: box-shadow 0.15s;
}

@keyframes fadeIn  { from { opacity: 0 } to { opacity: 1 } }
@keyframes scaleIn { from { opacity: 0; transform: scale(0.96) } to { opacity: 1; transform: scale(1) } }
</style>

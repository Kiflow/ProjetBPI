<template>
  <div class="todo-page">
    <section class="hero">
      <div class="hero-text">
        <p class="eyebrow">Utilitaire</p>
        <h1>To-do cockpit</h1>
        <p class="subtitle">
          Un tableau clair, vivant et actionnable pour piloter la journée,
          prioriser vite, et garder le cap.
        </p>
      </div>
      <div class="hero-stats">
        <div class="stat-card">
          <span class="stat-label">En cours</span>
          <span class="stat-value">{{ activeCount }}</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">Terminées</span>
          <span class="stat-value">{{ doneCount }}</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">En retard</span>
          <span class="stat-value">{{ overdueCount }}</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">Focus</span>
          <span class="stat-value">{{ focusLabel }}</span>
        </div>
      </div>
    </section>

    <section class="composer card">
      <form class="composer-form" @submit.prevent="addTask">
        <div class="form-main">
          <label class="field">
            <span>Tache</span>
            <input
              v-model.trim="draft.title"
              type="text"
              placeholder="Ex : Relance client, suivi incident, CR de reunion"
              required
            />
          </label>
          <label class="field">
            <span>Note</span>
            <input
              v-model.trim="draft.note"
              type="text"
              placeholder="Une info utile ou un rappel"
            />
          </label>
        </div>
        <div class="form-meta">
          <label class="field">
            <span>Priorite</span>
            <select v-model="draft.priority">
              <option value="Critique">Critique</option>
              <option value="Haute">Haute</option>
              <option value="Moyenne">Moyenne</option>
              <option value="Basse">Basse</option>
            </select>
          </label>
          <label class="field">
            <span>Echeance</span>
            <input v-model="draft.due" type="date" />
          </label>
          <button class="add-btn" type="submit">Ajouter</button>
        </div>
      </form>

      <div class="quick-actions">
        <div class="quick-header">
          <span class="quick-label">Raccourcis utiles</span>
          <button class="ghost mini" type="button" @click="showShortcutEditor = !showShortcutEditor">
            {{ showShortcutEditor ? "Fermer" : "Gerer" }}
          </button>
        </div>
        <div class="quick-buttons">
          <div v-for="shortcut in shortcuts" :key="shortcut.id" class="shortcut-chip">
            <button type="button" @click="addTemplate(shortcut.title, shortcut.note)">
              {{ shortcut.title }}
            </button>
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
          <p v-if="!shortcuts.length" class="empty">Ajoutez vos propres raccourcis.</p>
        </div>
        <form v-if="showShortcutEditor" class="shortcut-form" @submit.prevent="addShortcut">
          <input v-model.trim="shortcutDraft.title" type="text" placeholder="Titre raccourci" required />
          <input v-model.trim="shortcutDraft.note" type="text" placeholder="Note (optionnelle)" />
          <button class="add-btn" type="submit">Ajouter</button>
        </form>
      </div>
    </section>

    <section class="workspace">
      <div class="board">
        <div class="board-head">
          <h2>Vue d'ensemble</h2>
          <div class="board-actions">
            <input v-model="search" type="text" placeholder="Rechercher une tache" />
            <label class="toggle">
              <input v-model="hideDone" type="checkbox" />
              <span>Masquer terminees</span>
            </label>
          </div>
        </div>

        <div class="columns">
          <div class="column">
            <div class="column-title">
              <span>Aujourd'hui</span>
              <span class="count">{{ todayTasks.length }}</span>
            </div>
            <div class="task-list">
              <article
                v-for="task in todayTasks"
                :key="task.id"
                class="task-card"
                :class="[priorityClass(task), { done: task.done }]"
              >
                <div class="task-main">
                  <button class="check" type="button" @click="toggleDone(task)">
                    <span>{{ task.done ? "✓" : "" }}</span>
                  </button>
                  <div>
                    <h3>{{ task.title }}</h3>
                    <p v-if="task.note">{{ task.note }}</p>
                    <div class="meta">
                      <span class="pill">{{ task.priority }}</span>
                      <span v-if="task.due" class="pill">{{ formatDate(task.due) }}</span>
                    </div>
                  </div>
                </div>
                <button class="ghost" type="button" @click="removeTask(task.id)">Supprimer</button>
              </article>
              <p v-if="!todayTasks.length" class="empty">Rien de critique pour aujourd'hui.</p>
            </div>
          </div>

          <div class="column">
            <div class="column-title">
              <span>Cette semaine</span>
              <span class="count">{{ upcomingTasks.length }}</span>
            </div>
            <div class="task-list">
              <article
                v-for="task in upcomingTasks"
                :key="task.id"
                class="task-card"
                :class="[priorityClass(task), { done: task.done }]"
              >
                <div class="task-main">
                  <button class="check" type="button" @click="toggleDone(task)">
                    <span>{{ task.done ? "✓" : "" }}</span>
                  </button>
                  <div>
                    <h3>{{ task.title }}</h3>
                    <p v-if="task.note">{{ task.note }}</p>
                    <div class="meta">
                      <span class="pill">{{ task.priority }}</span>
                      <span v-if="task.due" class="pill">{{ formatDate(task.due) }}</span>
                    </div>
                  </div>
                </div>
                <button class="ghost" type="button" @click="removeTask(task.id)">Supprimer</button>
              </article>
              <p v-if="!upcomingTasks.length" class="empty">Tout est sous controle.</p>
            </div>
          </div>

          <div class="column">
            <div class="column-title">
              <span>Backlog</span>
              <span class="count">{{ backlogTasks.length }}</span>
            </div>
            <div class="task-list">
              <article
                v-for="task in backlogTasks"
                :key="task.id"
                class="task-card"
                :class="[priorityClass(task), { done: task.done }]"
              >
                <div class="task-main">
                  <button class="check" type="button" @click="toggleDone(task)">
                    <span>{{ task.done ? "✓" : "" }}</span>
                  </button>
                  <div>
                    <h3>{{ task.title }}</h3>
                    <p v-if="task.note">{{ task.note }}</p>
                    <div class="meta">
                      <span class="pill">{{ task.priority }}</span>
                      <span v-if="task.due" class="pill">{{ formatDate(task.due) }}</span>
                    </div>
                  </div>
                </div>
                <button class="ghost" type="button" @click="removeTask(task.id)">Supprimer</button>
              </article>
              <p v-if="!backlogTasks.length" class="empty">Rien en attente.</p>
            </div>
          </div>
        </div>
      </div>

      <aside class="side card">
        <div class="focus">
          <h2>Focus du jour</h2>
          <div class="focus-card" v-if="nextTask">
            <h3>{{ nextTask.title }}</h3>
            <p v-if="nextTask.note">{{ nextTask.note }}</p>
            <div class="meta">
              <span class="pill">{{ nextTask.priority }}</span>
              <span v-if="nextTask.due" class="pill">{{ formatDate(nextTask.due) }}</span>
            </div>
            <button class="primary" type="button" @click="toggleDone(nextTask)">
              Marquer comme fait
            </button>
          </div>
          <p v-else class="empty">Aucune tache prioritaire pour le moment.</p>
        </div>

        <div class="rituals">
          <h2>Comment ca se classe</h2>
          <div class="rules">
            <div class="rule-card">
              <div class="rule-title">Aujourd'hui</div>
              <div class="rule-text">Echeance a la date du jour.</div>
            </div>
            <div class="rule-card">
              <div class="rule-title">Cette semaine</div>
              <div class="rule-text">Echeance entre demain et J+7.</div>
            </div>
            <div class="rule-card">
              <div class="rule-title">Backlog</div>
              <div class="rule-text">Sans echeance ou apres J+7.</div>
            </div>
          </div>
          <div class="rules secondary">
            <div class="rule-card">
              <div class="rule-title">Criticite</div>
              <div class="rule-text">La priorite colore la carte : Critique, Haute, Moyenne, Basse.</div>
            </div>
            <div class="rule-card">
              <div class="rule-title">Focus du jour</div>
              <div class="rule-text">La prochaine tache non terminee avec l'echeance la plus proche.</div>
            </div>
          </div>
        </div>

        <div class="clean">
          <button class="ghost danger" type="button" @click="clearDone">
            Nettoyer les terminees
          </button>
        </div>
      </aside>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";

const STORAGE_KEY = "utilityTodoList";
const SHORTCUTS_KEY = "utilityTodoShortcuts";

const tasks = ref([]);
const search = ref("");
const hideDone = ref(false);
const showShortcutEditor = ref(false);
const shortcuts = ref([]);
const draft = ref({
  title: "",
  note: "",
  priority: "Moyenne",
  due: ""
});
const shortcutDraft = ref({
  title: "",
  note: ""
});

const load = () => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return;
  try {
    tasks.value = JSON.parse(stored);
  } catch {
    tasks.value = [];
  }
};

const loadShortcuts = () => {
  const stored = localStorage.getItem(SHORTCUTS_KEY);
  if (stored) {
    try {
      shortcuts.value = JSON.parse(stored);
      return;
    } catch {
      shortcuts.value = [];
    }
  }
  shortcuts.value = [
    { id: "relance-client", title: "Relance client", note: "Appel + mail de suivi" },
    { id: "point-equipe", title: "Point equipe", note: "Synthese 15 min" },
    { id: "nettoyer-backlog", title: "Nettoyer backlog", note: "Revue tickets > 30j" }
  ];
};

onMounted(load);
onMounted(loadShortcuts);

watch(
  tasks,
  (value) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  },
  { deep: true }
);

watch(
  shortcuts,
  (value) => {
    localStorage.setItem(SHORTCUTS_KEY, JSON.stringify(value));
  },
  { deep: true }
);

const addTask = () => {
  if (!draft.value.title) return;
  tasks.value.unshift({
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    title: draft.value.title,
    note: draft.value.note,
    priority: draft.value.priority,
    due: draft.value.due,
    done: false,
    createdAt: new Date().toISOString()
  });
  draft.value.title = "";
  draft.value.note = "";
  draft.value.due = "";
};

const addTemplate = (title, note) => {
  tasks.value.unshift({
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    title,
    note,
    priority: "Moyenne",
    due: "",
    done: false,
    createdAt: new Date().toISOString()
  });
};

const addShortcut = () => {
  if (!shortcutDraft.value.title) return;
  shortcuts.value.push({
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    title: shortcutDraft.value.title,
    note: shortcutDraft.value.note
  });
  shortcutDraft.value.title = "";
  shortcutDraft.value.note = "";
};

const removeShortcut = (id) => {
  shortcuts.value = shortcuts.value.filter((shortcut) => shortcut.id !== id);
};

const removeTask = (id) => {
  tasks.value = tasks.value.filter((task) => task.id !== id);
};

const toggleDone = (task) => {
  task.done = !task.done;
};

const clearDone = () => {
  tasks.value = tasks.value.filter((task) => !task.done);
};

const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short"
  });
};

const isSameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const matchesSearch = (task) => {
  if (!search.value) return true;
  const query = search.value.toLowerCase();
  return (
    task.title.toLowerCase().includes(query) ||
    (task.note || "").toLowerCase().includes(query)
  );
};

const filteredTasks = computed(() =>
  tasks.value.filter((task) => {
    if (hideDone.value && task.done) return false;
    return matchesSearch(task);
  })
);

const todayTasks = computed(() => {
  const today = new Date();
  return filteredTasks.value.filter((task) => {
    if (!task.due) return false;
    const due = new Date(task.due);
    return isSameDay(due, today);
  });
});

const upcomingTasks = computed(() => {
  const today = new Date();
  const in7Days = new Date();
  in7Days.setDate(today.getDate() + 7);
  return filteredTasks.value.filter((task) => {
    if (!task.due) return false;
    const due = new Date(task.due);
    return due > today && due <= in7Days;
  });
});

const backlogTasks = computed(() => {
  const today = new Date();
  const threshold = new Date();
  threshold.setDate(today.getDate() + 7);
  return filteredTasks.value.filter((task) => {
    if (!task.due) return true;
    const due = new Date(task.due);
    return due > threshold;
  });
});

const nextTask = computed(() => {
  const candidates = tasks.value
    .filter((task) => !task.done && task.due)
    .sort((a, b) => new Date(a.due) - new Date(b.due));
  return candidates[0];
});

const doneCount = computed(() => tasks.value.filter((task) => task.done).length);
const activeCount = computed(() => tasks.value.filter((task) => !task.done).length);
const overdueCount = computed(() => {
  const today = new Date();
  return tasks.value.filter((task) => {
    if (task.done || !task.due) return false;
    return new Date(task.due) < today;
  }).length;
});

const focusLabel = computed(() => {
  const task = nextTask.value;
  if (!task) return "--";
  return task.priority === "Critique" ? "Critique" : "Prochaine";
});

const priorityClass = (task) => `prio-${task.priority.toLowerCase()}`;
</script>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap");

.todo-page {
  min-height: 100vh;
  padding: 28px;
  font-family: "Manrope", sans-serif;
  background: #ffffff;
  position: relative;
  overflow: hidden;
}

.todo-page::before,
.todo-page::after {
  content: "";
  position: absolute;
  border-radius: 999px;
  opacity: 0;
  filter: blur(0);
  z-index: 0;
}

.todo-page::before {
  width: 340px;
  height: 340px;
  background: #ffddad;
  top: -120px;
  right: -60px;
}

.todo-page::after {
  width: 260px;
  height: 260px;
  background: #b6d4c8;
  bottom: -80px;
  left: -40px;
}

.hero,
.composer,
.workspace {
  position: relative;
  z-index: 1;
}

.hero {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 24px;
  margin-bottom: 22px;
}

.hero-text h1 {
  font-family: "Space Grotesk", sans-serif;
  font-size: 36px;
  margin: 6px 0 8px;
  color: #1f2a2e;
}

.eyebrow {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 2px;
  color: #5d6b6f;
  margin: 0;
}

.subtitle {
  max-width: 520px;
  color: #394449;
  margin: 0;
}

.hero-stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(140px, 1fr));
  gap: 12px;
}

.stat-card {
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(148, 163, 184, 0.3);
  padding: 12px 14px;
  border-radius: 14px;
  box-shadow: 0 10px 20px rgba(15, 23, 42, 0.08);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-label {
  font-size: 12px;
  color: #6b7b7f;
}

.stat-value {
  font-size: 22px;
  font-weight: 700;
  color: #1f2a2e;
}

.card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 18px;
  box-shadow: 0 10px 20px rgba(15, 23, 42, 0.05);
}

.composer {
  padding: 20px;
  margin-bottom: 24px;
}

.composer-form {
  display: grid;
  gap: 16px;
}

.form-main {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
}

.form-meta {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px;
  align-items: end;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: #4b5b60;
}

.field input,
.field select {
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid rgba(148, 163, 184, 0.4);
  background: #f9faf9;
  font-family: "Manrope", sans-serif;
  font-size: 14px;
}

.add-btn {
  border: none;
  background: #1f2a2e;
  color: #ffffff;
  padding: 12px 16px;
  border-radius: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.add-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 16px rgba(31, 42, 46, 0.2);
}

.quick-actions {
  margin-top: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.quick-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.quick-label {
  font-size: 12px;
  font-weight: 700;
  color: #6b7b7f;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.quick-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.shortcut-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.quick-buttons button {
  border: 1px dashed rgba(148, 163, 184, 0.6);
  background: #fff7ea;
  padding: 8px 12px;
  border-radius: 999px;
  font-weight: 600;
  cursor: pointer;
  transition: border 0.2s ease, transform 0.2s ease;
}

.quick-buttons button:hover {
  border-color: #1f2a2e;
  transform: translateY(-1px);
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

.shortcut-form {
  display: grid;
  grid-template-columns: minmax(160px, 1fr) minmax(160px, 1fr) auto;
  gap: 10px;
  align-items: center;
}

.shortcut-form input {
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid rgba(148, 163, 184, 0.4);
  background: #ffffff;
  font-family: "Manrope", sans-serif;
  font-size: 14px;
}

.ghost.mini {
  padding: 6px 10px;
  font-size: 12px;
}

.workspace {
  display: grid;
  grid-template-columns: minmax(0, 2.2fr) minmax(260px, 1fr);
  gap: 20px;
  align-items: start;
}

.board {
  padding: 20px;
  border-radius: 18px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  box-shadow: 0 10px 20px rgba(15, 23, 42, 0.05);
}

.board-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 14px;
  margin-bottom: 16px;
}

.board-head h2 {
  margin: 0;
  font-size: 20px;
  color: #1f2a2e;
}

.board-actions {
  display: flex;
  align-items: center;
  gap: 14px;
}

.board-actions input {
  padding: 8px 12px;
  border-radius: 10px;
  border: 1px solid rgba(148, 163, 184, 0.4);
  background: #ffffff;
  min-width: 220px;
}

.toggle {
  display: flex;
  gap: 8px;
  align-items: center;
  font-size: 12px;
  color: #4b5b60;
}

.columns {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
}

.column {
  background: #fffdfab0;
  border-radius: 16px;
  padding: 14px;
  border: 1px solid #e2e8f0;
}

.column-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 700;
  color: #2b3a3f;
  margin-bottom: 10px;
}

.count {
  background: #1f2a2e;
  color: #ffffff;
  border-radius: 999px;
  padding: 2px 8px;
  font-size: 12px;
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.task-card {
  background: #ffffff;
  border-radius: 14px;
  padding: 12px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  display: flex;
  flex-direction: column;
  gap: 10px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.task-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 20px rgba(15, 23, 42, 0.08);
}

.task-card.done {
  opacity: 0.6;
  text-decoration: line-through;
}

.task-main {
  display: flex;
  gap: 10px;
}

.task-main h3 {
  margin: 0 0 4px;
  font-size: 15px;
  color: #1f2a2e;
}

.task-main p {
  margin: 0;
  font-size: 13px;
  color: #5b666b;
}

.meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}

.pill {
  background: #f1f4f4;
  color: #2b3a3f;
  border-radius: 999px;
  padding: 2px 8px;
  font-size: 11px;
  font-weight: 600;
}

.check {
  width: 24px;
  height: 24px;
  border-radius: 8px;
  border: 1px solid rgba(148, 163, 184, 0.5);
  background: #ffffff;
  display: grid;
  place-items: center;
  font-size: 14px;
  cursor: pointer;
}

.ghost {
  border: 1px solid rgba(148, 163, 184, 0.4);
  background: transparent;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  align-self: flex-start;
}

.ghost.danger {
  border-color: rgba(209, 67, 67, 0.4);
  color: #b32727;
}

.side {
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.side h2 {
  margin: 0 0 10px;
  font-size: 18px;
  color: #1f2a2e;
}

.focus-card {
  background: #fff7ea;
  border-radius: 14px;
  padding: 12px;
  border: 1px solid rgba(255, 200, 120, 0.5);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.primary {
  background: #1f2a2e;
  color: #ffffff;
  border: none;
  padding: 10px 12px;
  border-radius: 10px;
  font-weight: 700;
  cursor: pointer;
}

.ritual-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  color: #4b5b60;
  font-size: 13px;
}

.rules {
  display: grid;
  grid-template-columns: 1fr;
  gap: 6px;
  margin-top: 8px;
}

.rules.secondary {
  margin-top: 10px;
}

.rule-card {
  background: transparent;
  border: none;
  border-radius: 0;
  padding: 5px 2px;
  box-shadow: none;
}

.rule-card + .rule-card {
  border-top: 1px solid #e2e8f0;
}

.rules.secondary .rule-card:first-child {
  border-top: 1px solid #e2e8f0;
}

.rule-title {
  font-weight: 700;
  color: #1f2a2e;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.rule-text {
  margin-top: 4px;
  color: #4b5b60;
  font-size: 11px;
  line-height: 1.3;
}

.empty {
  color: #7a8a8f;
  font-size: 13px;
}

.prio-critique {
  border-left: 4px solid #c2410c;
}

.prio-haute {
  border-left: 4px solid #f59e0b;
}

.prio-moyenne {
  border-left: 4px solid #059669;
}

.prio-basse {
  border-left: 4px solid #64748b;
}

@media (max-width: 1100px) {
  .hero {
    flex-direction: column;
  }

  .workspace {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .board-head {
    flex-direction: column;
    align-items: stretch;
  }

  .board-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .board-actions input {
    width: 100%;
    min-width: 0;
  }
}
</style>

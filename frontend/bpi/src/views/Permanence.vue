<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h2>Permanences</h2>
        <p class="subtitle">Planifiez vos permanences et celles de l'equipe.</p>
      </div>
      <div class="scope-toggle" role="group" aria-label="Filtre des permanences">
        <button
          type="button"
          :class="['toggle-btn', { active: filterScope === 'mine' }]"
          @click="filterScope = 'mine'"
        >
          Mes permanences
        </button>
        <button
          type="button"
          :class="['toggle-btn', { active: filterScope === 'team' }]"
          @click="filterScope = 'team'"
        >
          Permanences d'equipe
        </button>
      </div>
    </div>

    <div class="layout">
      <form class="card" @submit.prevent="addPermanence">
        <h3>Nouvelle permanence</h3>

        <label class="field">
          <span>Type</span>
          <select v-model="form.type">
            <option value="journee">Journee</option>
            <option value="demi">Demi-journee</option>
            <option value="horaire">Horaire</option>
          </select>
        </label>

        <label class="field">
          <span>Date</span>
          <input type="date" v-model="form.date" />
        </label>

        <label v-if="form.type === 'demi'" class="field">
          <span>Demi-journee</span>
          <select v-model="form.half">
            <option value="matin">Matin (08:00 - 12:00)</option>
            <option value="apres-midi">Apres-midi (13:00 - 17:00)</option>
          </select>
        </label>

        <div v-if="form.type === 'horaire'" class="time-row">
          <label class="field">
            <span>Heure de debut</span>
            <input type="time" v-model="form.start" />
          </label>
          <label class="field">
            <span>Heure de fin</span>
            <input type="time" v-model="form.end" />
          </label>
        </div>

        <label class="field">
          <span>Perimetre</span>
          <select v-model="form.scope">
            <option value="mine">Moi</option>
            <option value="team">Equipe</option>
          </select>
        </label>

        <label v-if="form.scope === 'team'" class="field">
          <span>Nom / equipe</span>
          <input type="text" v-model="form.owner" placeholder="Ex: Equipe Support" />
        </label>

        <label class="field">
          <span>Intitule (optionnel)</span>
          <input type="text" v-model="form.title" placeholder="Ex: Permanence hotline" />
        </label>

        <p v-if="error" class="error">{{ error }}</p>

        <button type="submit" class="primary">Ajouter</button>
        <p class="hint">Astuce: cliquez sur une permanence pour la supprimer.</p>
      </form>

      <div class="calendar-card">
        <FullCalendar :options="calendarOptions" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import "@fullcalendar/core/vdom";
import FullCalendar from "@fullcalendar/vue3";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import frLocale from "@fullcalendar/core/locales/fr";

import "@fullcalendar/common/main.css";
import "@fullcalendar/daygrid/main.css";
import "@fullcalendar/timegrid/main.css";

const STORAGE_KEY = "permanences";

const events = ref([]);
const filterScope = ref("mine");
const error = ref("");

const form = ref({
  type: "journee",
  date: "",
  half: "matin",
  start: "08:00",
  end: "17:00",
  scope: "mine",
  owner: "",
  title: ""
});

const loadEvents = () => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return;
  try {
    events.value = JSON.parse(stored) ?? [];
  } catch {
    events.value = [];
  }
};

onMounted(loadEvents);

watch(
  events,
  (value) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  },
  { deep: true }
);

const filteredEvents = computed(() =>
  events.value.filter(
    (event) => event.extendedProps?.scope === filterScope.value
  )
);

const calendarOptions = computed(() => ({
  plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
  initialView: "timeGridWeek",
  headerToolbar: {
    left: "prev,next today",
    center: "title",
    right: "dayGridMonth,timeGridWeek,timeGridDay"
  },
  height: "auto",
  nowIndicator: true,
  firstDay: 1,
  locale: frLocale,
  events: filteredEvents.value,
  eventClick: (info) => removeEvent(info.event.id),
  slotMinTime: "06:00:00",
  slotMaxTime: "20:00:00",
  allDaySlot: true
}));

const addDays = (dateStr, days) => {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const buildEventTimes = () => {
  const date = form.value.date;
  if (form.value.type === "journee") {
    return {
      start: date,
      end: addDays(date, 1),
      allDay: true,
      label: ""
    };
  }

  if (form.value.type === "demi") {
    const isMorning = form.value.half === "matin";
    return {
      start: `${date}T${isMorning ? "08:00" : "13:00"}`,
      end: `${date}T${isMorning ? "12:00" : "17:00"}`,
      allDay: false,
      label: isMorning ? " (matin)" : " (apres-midi)"
    };
  }

  return {
    start: `${date}T${form.value.start}`,
    end: `${date}T${form.value.end}`,
    allDay: false,
    label: ""
  };
};

const addPermanence = () => {
  error.value = "";

  if (!form.value.date) {
    error.value = "Veuillez selectionner une date.";
    return;
  }

  if (form.value.type === "horaire") {
    if (!form.value.start || !form.value.end) {
      error.value = "Veuillez renseigner les heures de debut et de fin.";
      return;
    }
    if (form.value.start >= form.value.end) {
      error.value = "L'heure de fin doit etre apres l'heure de debut.";
      return;
    }
  }

  const owner =
    form.value.scope === "mine"
      ? "Moi"
      : form.value.owner.trim() || "Equipe";
  const baseTitle = form.value.title.trim() || "Permanence";
  const { start, end, allDay, label } = buildEventTimes();

  const colors =
    form.value.scope === "mine"
      ? { backgroundColor: "#1f6f43", borderColor: "#1f6f43" }
      : { backgroundColor: "#0f2742", borderColor: "#0f2742" };

  const newEvent = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    title: `${baseTitle} - ${owner}${label}`,
    start,
    end,
    allDay,
    textColor: "#ffffff",
    extendedProps: {
      scope: form.value.scope,
      owner,
      type: form.value.type
    },
    ...colors
  };

  events.value = [...events.value, newEvent];

  form.value.title = "";
  if (form.value.scope === "team") form.value.owner = "";
};

const removeEvent = (id) => {
  if (!id) return;
  const confirmRemove = window.confirm("Supprimer cette permanence ?");
  if (!confirmRemove) return;
  events.value = events.value.filter((event) => event.id !== id);
};
</script>

<style scoped>
.page {
  padding: 24px;
  background-color: #ffffff;
  min-height: 100vh;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  font-size: 24px;
  color: #0f172a;
}

.subtitle {
  margin: 4px 0 0;
  color: #475569;
}

.scope-toggle {
  background: #f1f5f9;
  border-radius: 12px;
  padding: 4px;
  display: inline-flex;
  gap: 4px;
}

.toggle-btn {
  border: none;
  padding: 8px 14px;
  border-radius: 10px;
  background: transparent;
  cursor: pointer;
  font-weight: 600;
  color: #334155;
}

.toggle-btn.active {
  background: #0f2742;
  color: #ffffff;
}

.layout {
  display: grid;
  grid-template-columns: minmax(260px, 320px) 1fr;
  gap: 20px;
}

.card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 16px;
  box-shadow: 0 10px 20px rgba(15, 23, 42, 0.05);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.card h3 {
  margin: 0;
  color: #0f172a;
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

.time-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.primary {
  border: none;
  background: #0f2742;
  color: #ffffff;
  padding: 10px 14px;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
}

.primary:hover {
  background: #143a63;
}

.hint {
  font-size: 12px;
  color: #64748b;
}

.error {
  color: #d14343;
  font-weight: 600;
}

.calendar-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 12px;
  box-shadow: 0 10px 20px rgba(15, 23, 42, 0.05);
}

:deep(.fc .fc-toolbar-title) {
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
}

:deep(.fc .fc-button) {
  border-radius: 10px;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  color: #0f172a;
}

:deep(.fc .fc-button-primary:not(:disabled).fc-button-active),
:deep(.fc .fc-button-primary:not(:disabled):active) {
  background: #0f2742;
  border-color: #0f2742;
}

@media (max-width: 1024px) {
  .layout {
    grid-template-columns: 1fr;
  }
}
</style>

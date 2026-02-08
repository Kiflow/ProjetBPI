<template>
  <div class="page">
    <div class="page-header">
      <div>
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
          <select v-model="form.ownerId">
            <option value="mine">Moi</option>
            <option
              v-for="member in teamMembersWithoutMe"
              :key="member.userId"
              :value="member.userId"
            >
              {{ member.firstName }} {{ member.lastName }}
            </option>
          </select>
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

    <div class="card tickets-card">
      <div class="tickets-header">
        <div>
          <h3>Suivi des tickets par permanence</h3>
          <p class="tickets-subtitle">{{ ticketsSubtitle }}</p>
        </div>
      </div>

      <div v-if="calendarView === 'timeGridDay'" class="table-wrap">
        <table class="tickets-table day-table">
          <thead>
            <tr>
              <th>Personne</th>
              <th>Periode</th>
              <th>Tickets pris</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="event in dayEvents" :key="event.id">
              <td>{{ getOwnerName(event) }}</td>
              <td>{{ getPeriodLabel(event) }}</td>
              <td>
                <input
                  type="number"
                  min="0"
                  class="ticket-input"
                  :value="getTickets(event)"
                  @input="updateTickets(event.id, $event.target.value)"
                />
              </td>
            </tr>
            <tr v-if="dayEvents.length === 0">
              <td colspan="3" class="empty-row">Aucune permanence ce jour.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else-if="calendarView === 'timeGridWeek'" class="table-wrap">
        <table class="tickets-table week-table">
          <thead>
            <tr>
              <th>Collaborateur</th>
              <th v-for="day in weekDays" :key="day.key">{{ day.label }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="member in weekCollaborators" :key="member.ownerId">
              <td class="sticky-col">{{ member.ownerName }}</td>
              <td v-for="day in weekDays" :key="day.key">
                <div v-if="hasEventForOwnerDate(member.ownerId, day.key)">
                  <input
                    type="number"
                    min="0"
                    class="ticket-input small"
                    :value="getTicketsForOwnerDate(member.ownerId, day.key)"
                    @input="updateTicketsForOwnerDate(member.ownerId, day.key, $event.target.value)"
                  />
                </div>
                <span v-else class="empty-cell">-</span>
              </td>
            </tr>
            <tr v-if="weekCollaborators.length === 0">
              <td :colspan="weekDays.length + 1" class="empty-row">
                Aucune permanence cette semaine.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else-if="calendarView === 'dayGridMonth'" class="table-wrap">
        <table class="tickets-table month-table">
          <thead>
            <tr>
              <th>Collaborateur</th>
              <th v-for="week in monthWeeks" :key="week.id">{{ week.label }}</th>
              <th>Total mois</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="person in monthCollaborators" :key="person.ownerId">
              <td class="sticky-col">{{ person.ownerName }}</td>
              <td v-for="week in monthWeeks" :key="week.id" class="total-cell">
                {{ getTicketsForOwnerWeek(person.ownerId, week) }}
              </td>
              <td class="month-total-value">
                {{ getTicketsForOwnerMonth(person.ownerId) }}
              </td>
            </tr>
            <tr v-if="monthCollaborators.length === 0">
              <td :colspan="monthWeeks.length + 2" class="empty-row">
                Aucune permanence ce mois.
              </td>
            </tr>
          </tbody>
          <tfoot v-if="monthWeeks.length">
            <tr>
              <td class="month-total-label">Total semaine</td>
              <td
                v-for="week in monthWeeks"
                :key="week.id"
                class="month-total-value"
              >
                {{ getTicketsForWeekTotal(week) }}
              </td>
              <td class="month-total-value">{{ monthTotal }}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div v-else class="table-wrap">
        <table class="tickets-table">
          <thead>
            <tr>
              <th>Personne</th>
              <th>Date</th>
              <th>Periode</th>
              <th>Tickets pris</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="event in dayEvents" :key="event.id">
              <td>{{ getOwnerName(event) }}</td>
              <td>{{ formatDateLabel(event.start) }}</td>
              <td>{{ getPeriodLabel(event) }}</td>
              <td>
                <input
                  type="number"
                  min="0"
                  class="ticket-input"
                  :value="getTickets(event)"
                  @input="updateTickets(event.id, $event.target.value)"
                />
              </td>
            </tr>
            <tr v-if="dayEvents.length === 0">
              <td colspan="4" class="empty-row">Aucune permanence a afficher.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, onBeforeUnmount } from "vue";
import "@fullcalendar/core/vdom";
import FullCalendar from "@fullcalendar/vue3";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import frLocale from "@fullcalendar/core/locales/fr";
import api from "../services/api";

import "@fullcalendar/common/main.css";
import "@fullcalendar/daygrid/main.css";
import "@fullcalendar/timegrid/main.css";

const STORAGE_KEY = "permanences";

const events = ref([]);
const filterScope = ref("mine");
const error = ref("");
const teamMembers = ref([]);
const calendarView = ref("timeGridWeek");
const viewRange = ref({ start: null, end: null });

const form = ref({
  type: "journee",
  date: "",
  half: "matin",
  start: "08:00",
  end: "17:00",
  ownerId: "mine",
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

const loadCurrentUser = () => {
  const raw = localStorage.getItem("user");
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
};

const currentUser = ref(loadCurrentUser());

const syncCurrentUser = () => {
  currentUser.value = loadCurrentUser();
};

const loadTeamMembers = async () => {
  if (!currentUser.value.group) {
    teamMembers.value = [];
    return;
  }

  try {
    const res = await api.get("/employees", {
      params: { group: currentUser.value.group }
    });
    teamMembers.value = res.data?.employees ?? [];
  } catch (e) {
    console.error("[permanence] Erreur chargement equipe:", e);
    teamMembers.value = [];
  }
};

onMounted(() => {
  loadEvents();
  syncCurrentUser();
  loadTeamMembers();
  window.addEventListener("auth-changed", syncCurrentUser);
  window.addEventListener("storage", syncCurrentUser);
});

onBeforeUnmount(() => {
  window.removeEventListener("auth-changed", syncCurrentUser);
  window.removeEventListener("storage", syncCurrentUser);
});

watch(
  () => currentUser.value.group,
  () => {
    loadTeamMembers();
  }
);

watch(
  events,
  (value) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  },
  { deep: true }
);

const filteredEvents = computed(() =>
  events.value.filter((event) => {
    const props = event.extendedProps || {};

    if (filterScope.value === "mine") {
      if (!currentUser.value.userId) return props.scope === "mine";
      if (props.ownerId) {
        return props.ownerId === currentUser.value.userId;
      }
      return props.scope === "mine";
    }

    if (filterScope.value === "team") {
      if (!currentUser.value.group) return props.scope === "team";
      if (props.ownerGroup) {
        return props.ownerGroup === currentUser.value.group;
      }
      return props.scope === "team";
    }

    return true;
  })
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
  datesSet: (info) => {
    calendarView.value = info.view?.type || "timeGridWeek";
    viewRange.value = {
      start: info.view?.currentStart || info.start,
      end: info.view?.currentEnd || info.end
    };
  },
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

const normalizeText = (value) => (value || "").trim().toLowerCase();

const teamMembersWithoutMe = computed(() => {
  const currentUserId = normalizeText(currentUser.value.userId);
  const currentEmail = normalizeText(currentUser.value.email);
  const currentFullName = normalizeText(
    `${currentUser.value.firstName || ""} ${currentUser.value.lastName || ""}`
  );

  const seen = new Set();

  return teamMembers.value.filter((member) => {
    const memberId = normalizeText(member.userId);
    const memberEmail = normalizeText(member.email);
    const memberFullName = normalizeText(
      `${member.firstName || ""} ${member.lastName || ""}`
    );

    const isCurrent =
      (currentUserId && memberId && memberId === currentUserId) ||
      (currentEmail && memberEmail && memberEmail === currentEmail) ||
      (currentFullName && memberFullName && memberFullName === currentFullName);

    if (isCurrent) return false;

    const dedupeKey = memberId || memberEmail || memberFullName;
    if (!dedupeKey) return true;
    if (seen.has(dedupeKey)) return false;
    seen.add(dedupeKey);
    return true;
  });
});

const resolveOwner = () => {
  if (form.value.ownerId === "mine") {
    return {
      ownerId: currentUser.value.userId,
      ownerName: "Moi",
      ownerGroup: currentUser.value.group
    };
  }

  const member = teamMembers.value.find(
    (person) => person.userId === form.value.ownerId
  );

  if (!member) {
    return {
      ownerId: form.value.ownerId,
      ownerName: "Equipe",
      ownerGroup: currentUser.value.group
    };
  }

  if (member.userId === currentUser.value.userId) {
    return {
      ownerId: currentUser.value.userId,
      ownerName: "Moi",
      ownerGroup: currentUser.value.group
    };
  }

  return {
    ownerId: member.userId,
    ownerName: `${member.firstName} ${member.lastName}`.trim(),
    ownerGroup: member.group
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

  const { ownerId, ownerName, ownerGroup } = resolveOwner();
  const baseTitle = form.value.title.trim() || "Permanence";
  const { start, end, allDay, label } = buildEventTimes();

  const isMine = ownerId && ownerId === currentUser.value.userId;
  const colors = isMine
    ? { backgroundColor: "#1f6f43", borderColor: "#1f6f43" }
    : { backgroundColor: "#0f2742", borderColor: "#0f2742" };

  const newEvent = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    title: `${baseTitle} - ${ownerName}${label}`,
    start,
    end,
    allDay,
    textColor: "#ffffff",
    extendedProps: {
      scope: isMine ? "mine" : "team",
      ownerId,
      ownerName,
      ownerGroup,
      type: form.value.type,
      label,
      tickets: 0
    },
    ...colors
  };

  events.value = [...events.value, newEvent];

  form.value.title = "";
};

const removeEvent = (id) => {
  if (!id) return;
  const confirmRemove = window.confirm("Supprimer cette permanence ?");
  if (!confirmRemove) return;
  events.value = events.value.filter((event) => event.id !== id);
};

const formatDateLabel = (dateValue) => {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit"
  });
};

const formatTimeLabel = (dateValue) => {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit"
  });
};

const toDateKey = (dateValue) => {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "";
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const getOwnerName = (event) =>
  event.extendedProps?.ownerName || "Equipe";

const getTickets = (event) => Number(event.extendedProps?.tickets || 0);

const getPeriodLabel = (event) => {
  const props = event.extendedProps || {};
  const type = props.type || (event.allDay ? "journee" : "horaire");

  if (type === "demi") {
    return props.label ? props.label.replace(/[()]/g, "").trim() : "Demi-journee";
  }

  if (!event.allDay) {
    return `${formatTimeLabel(event.start)} - ${formatTimeLabel(event.end)}`;
  }

  return "Journee";
};

const rangeEvents = computed(() => {
  if (!viewRange.value.start || !viewRange.value.end) return [];
  const start = new Date(viewRange.value.start);
  const end = new Date(viewRange.value.end);
  return filteredEvents.value.filter((event) => {
    const eventDate = new Date(event.start);
    return eventDate >= start && eventDate < end;
  });
});

const ticketsSubtitle = computed(() => {
  if (!viewRange.value.start) return "Selectionnez une vue du calendrier.";
  const startLabel = formatDateLabel(viewRange.value.start);
  const endDate = new Date(viewRange.value.end || Date.now());
  endDate.setDate(endDate.getDate() - 1);
  const endLabel = formatDateLabel(endDate);
  if (calendarView.value === "timeGridDay") {
    return `Jour: ${startLabel}`;
  }
  if (calendarView.value === "timeGridWeek") {
    return `Semaine du ${startLabel} au ${endLabel}`;
  }
  if (calendarView.value === "dayGridMonth") {
    return `Mois: ${new Date(viewRange.value.start).toLocaleDateString("fr-FR", {
      month: "long",
      year: "numeric"
    })}`;
  }
  return "Vue calendrier";
});

const dayEvents = computed(() =>
  rangeEvents.value
    .slice()
    .sort((a, b) => (getOwnerName(a) || "").localeCompare(getOwnerName(b) || ""))
);

const weekDays = computed(() => {
  if (!viewRange.value.start || !viewRange.value.end) return [];
  const days = [];
  const cursor = new Date(viewRange.value.start);
  const end = new Date(viewRange.value.end);
  while (cursor < end && days.length < 7) {
    days.push({
      key: toDateKey(cursor),
      label: cursor.toLocaleDateString("fr-FR", {
        weekday: "short",
        day: "2-digit",
        month: "2-digit"
      })
    });
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
});

const weekCollaborators = computed(() => {
  const map = new Map();
  rangeEvents.value.forEach((event) => {
    const ownerId = event.extendedProps?.ownerId || "unknown";
    if (!map.has(ownerId)) {
      map.set(ownerId, {
        ownerId,
        ownerName: getOwnerName(event)
      });
    }
  });
  return Array.from(map.values()).sort((a, b) =>
    (a.ownerName || "").localeCompare(b.ownerName || "")
  );
});

const getEventsForOwnerDate = (ownerId, dateKey) =>
  rangeEvents.value.filter((event) => {
    const eventOwnerId = event.extendedProps?.ownerId || "unknown";
    return eventOwnerId === ownerId && toDateKey(event.start) === dateKey;
  });

const hasEventForOwnerDate = (ownerId, dateKey) =>
  getEventsForOwnerDate(ownerId, dateKey).length > 0;

const getTicketsForOwnerDate = (ownerId, dateKey) => {
  const matches = getEventsForOwnerDate(ownerId, dateKey);
  return matches.reduce((total, event) => total + getTickets(event), 0);
};

const updateTicketsForOwnerDate = (ownerId, dateKey, value) => {
  const nextValue = Number(value);
  if (!Number.isFinite(nextValue) || nextValue < 0) return;

  events.value = events.value.map((event) => {
    const eventOwnerId = event.extendedProps?.ownerId || "unknown";
    if (eventOwnerId !== ownerId) return event;
    if (toDateKey(event.start) !== dateKey) return event;
    return {
      ...event,
      extendedProps: {
        ...event.extendedProps,
        tickets: nextValue
      }
    };
  });
};

const monthWeeks = computed(() => {
  if (calendarView.value !== "dayGridMonth") return [];
  if (!viewRange.value.start || !viewRange.value.end) return [];

  const monthStart = new Date(viewRange.value.start);
  const monthEnd = new Date(viewRange.value.end);
  const weeks = [];
  let cursor = new Date(monthStart);

  while (cursor < monthEnd) {
    const weekStart = new Date(cursor);
    const weekEnd = new Date(cursor);
    weekEnd.setDate(weekEnd.getDate() + 7);

    weeks.push({
      id: weekStart.toISOString(),
      label: `Semaine du ${weekStart.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit"
      })}`,
      start: weekStart,
      end: weekEnd
    });

    cursor = weekEnd;
  }

  return weeks;
});

const monthCollaborators = computed(() => {
  const map = new Map();
  rangeEvents.value.forEach((event) => {
    const ownerId = event.extendedProps?.ownerId || "unknown";
    if (!map.has(ownerId)) {
      map.set(ownerId, { ownerId, ownerName: getOwnerName(event) });
    }
  });
  return Array.from(map.values()).sort((a, b) =>
    (a.ownerName || "").localeCompare(b.ownerName || "")
  );
});

const isEventInRange = (event, start, end) => {
  const eventDate = new Date(event.start);
  return eventDate >= start && eventDate < end;
};

const getTicketsForOwnerWeek = (ownerId, week) =>
  rangeEvents.value.reduce((sum, event) => {
    const eventOwnerId = event.extendedProps?.ownerId || "unknown";
    if (eventOwnerId !== ownerId) return sum;
    if (!isEventInRange(event, week.start, week.end)) return sum;
    return sum + getTickets(event);
  }, 0);

const getTicketsForOwnerMonth = (ownerId) =>
  rangeEvents.value.reduce((sum, event) => {
    const eventOwnerId = event.extendedProps?.ownerId || "unknown";
    if (eventOwnerId !== ownerId) return sum;
    return sum + getTickets(event);
  }, 0);

const getTicketsForWeekTotal = (week) =>
  rangeEvents.value.reduce((sum, event) => {
    if (!isEventInRange(event, week.start, week.end)) return sum;
    return sum + getTickets(event);
  }, 0);

const monthTotal = computed(() =>
  rangeEvents.value.reduce((sum, event) => sum + getTickets(event), 0)
);

const updateTickets = (eventId, value) => {
  const nextValue = Number(value);
  if (!Number.isFinite(nextValue) || nextValue < 0) return;

  events.value = events.value.map((event) => {
    if (event.id !== eventId) return event;
    return {
      ...event,
      extendedProps: {
        ...event.extendedProps,
        tickets: nextValue
      }
    };
  });
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

:deep(.fc .fc-daygrid-day-events) {
  min-height: 100%;
}

:deep(.fc .fc-daygrid-event) {
  height: 100%;
  display: flex;
  align-items: flex-start;
  padding: 2px 4px;
  overflow: visible;
}

:deep(.fc .fc-daygrid-event .fc-event-title-container) {
  overflow: visible;
}

:deep(.fc .fc-daygrid-event .fc-event-title) {
  white-space: normal;
  overflow: visible;
  line-height: 1.2;
}

.tickets-card {
  margin-top: 20px;
}

.tickets-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
}

.tickets-subtitle {
  margin: 4px 0 0;
  font-size: 13px;
  color: #64748b;
}

.table-wrap {
  overflow-x: auto;
}

.tickets-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 14px;
  background: #ffffff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: inset 0 0 0 1px #e2e8f0;
}

.tickets-table th,
.tickets-table td {
  border-bottom: 1px solid #e2e8f0;
  padding: 10px 12px;
  text-align: left;
}

.tickets-table th {
  font-weight: 700;
  color: #f8fafc;
  background: #0f2742;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.tickets-table tbody tr:nth-child(even) {
  background: #f8fafc;
}

.tickets-table tbody tr:hover {
  background: #eef2f6;
}

.week-table th:first-child,
.week-table td:first-child {
  position: sticky;
  left: 0;
  background: #f1f5f9;
  z-index: 1;
}

.week-table th:first-child {
  z-index: 2;
}

.ticket-input {
  width: 100px;
  padding: 6px 8px;
  border-radius: 8px;
  border: 1px solid #cbd5e1;
  background: #ffffff;
}

.ticket-input.small {
  width: 72px;
}

.empty-cell {
  color: #94a3b8;
}

.empty-row {
  text-align: center;
  color: #64748b;
  padding: 16px 8px;
}

.month-table tfoot td {
  font-weight: 700;
  background: #0f2742;
  color: #ffffff;
}

.month-total-label {
  text-transform: uppercase;
  font-size: 12px;
  letter-spacing: 0.04em;
}

.month-total-value {
  font-size: 16px;
}

@media (max-width: 1024px) {
  .layout {
    grid-template-columns: 1fr;
  }
}
</style>

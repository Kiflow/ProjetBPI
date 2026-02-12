<template>
  <div class="topbar">
    <div class="title">
      {{ pageTitle }}
    </div>
    <div class="user-info">
      <span>{{ displayName }}</span>
      <button class="icon-button" type="button" @click="toggleProfile">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
          <path
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="1.6"
            d="M12 6.25a5.75 5.75 0 1 0 0 11.5 5.75 5.75 0 0 0 0-11.5Zm8.5 5.75c0-.45-.04-.88-.11-1.3l-2.11-.34a6.66 6.66 0 0 0-.75-1.8l1.25-1.72A8.56 8.56 0 0 0 16.6 5.1l-1.72 1.25a6.66 6.66 0 0 0-1.8-.75l-.34-2.11A8.9 8.9 0 0 0 12 3c-.45 0-.88.04-1.3.11l-.34 2.11a6.66 6.66 0 0 0-1.8.75L6.84 4.72A8.56 8.56 0 0 0 5.1 6.45l1.25 1.72a6.66 6.66 0 0 0-.75 1.8l-2.11.34A8.9 8.9 0 0 0 3 12c0 .45.04.88.11 1.3l2.11.34a6.66 6.66 0 0 0 .75 1.8l-1.25 1.72A8.56 8.56 0 0 0 6.45 18.9l1.72-1.25a6.66 6.66 0 0 0 1.8.75l.34 2.11c.42.07.85.11 1.3.11.45 0 .88-.04 1.3-.11l.34-2.11a6.66 6.66 0 0 0 1.8-.75l1.72 1.25a8.56 8.56 0 0 0 1.72-1.72l-1.25-1.72a6.66 6.66 0 0 0 .75-1.8l2.11-.34c.07-.42.11-.85.11-1.3Z"
          />
        </svg>
      </button>
    </div>

    <div v-if="showProfile" class="profile-backdrop" @click="closeProfile" />
    <div v-if="showProfile" class="profile-panel">
      <div class="profile-header">
        <div>
          <div class="profile-name">{{ displayName }}</div>
          <div class="profile-role">{{ user.position || "Employe" }}</div>
        </div>
        <button class="close-button" type="button" @click="closeProfile">
          Fermer
        </button>
      </div>
      <div class="profile-grid">
        <div class="profile-item">
          <span class="label">ID utilisateur</span>
          <span class="value">{{ user.userId || "-" }}</span>
        </div>
        <div class="profile-item">
          <span class="label">Email</span>
          <span class="value">{{ user.email || "-" }}</span>
        </div>
        <div class="profile-item">
          <span class="label">Poste</span>
          <span class="value">{{ user.position || "-" }}</span>
        </div>
        <div class="profile-item">
          <span class="label">Poste parent</span>
          <span class="value">{{ user.parentPosition || "-" }}</span>
        </div>
        <div class="profile-item">
          <span class="label">Responsable</span>
          <span class="value">{{ user.managerName || "-" }}</span>
        </div>
        <div class="profile-item">
          <span class="label">Groupe</span>
          <span class="value">{{ user.group || "-" }}</span>
        </div>
      </div>
      <div class="profile-actions">
        <button class="profile-logout" type="button" @click="$emit('logout')">
          Deconnexion
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onBeforeUnmount } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();

const loadUser = () => {
  const raw = localStorage.getItem("user");
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
};

const user = ref(loadUser());
const showProfile = ref(false);

const syncUser = () => {
  user.value = loadUser();
};

onMounted(() => {
  window.addEventListener("auth-changed", syncUser);
  window.addEventListener("storage", syncUser);
});

onBeforeUnmount(() => {
  window.removeEventListener("auth-changed", syncUser);
  window.removeEventListener("storage", syncUser);
});

const displayName = computed(() => {
  const firstName = (user.value.firstName || "").trim();
  const lastName = (user.value.lastName || "").trim();
  const fullName = `${firstName} ${lastName}`.trim();
  return fullName || "Utilisateur";
});

const pageTitle = computed(() => {
  switch (route.path) {
    case "/":
      return "Dashboard";
    case "/tickets":
      return "Backlog";
    case "/centralisation-demande":
      return "Centralisation demande";
    case "/priorite-rms":
      return "Priorite RMS";
    case "/habilitation":
      return "Habilitation";
    case "/permanence":
      return "Permanence";
    case "/client-plan-action":
      return "Client en plan d'action";
    case "/client-sensible":
      return "Client sensible";
    case "/upload":
      return "Upload Excel";
    case "/facturation":
      return "Facturation";
    case "/wiki":
      return "Mes wikis";
    case "/utilitaire-todo":
      return "To-do cockpit";
    default:
      return "Page";
  }
});

const toggleProfile = () => {
  showProfile.value = !showProfile.value;
};

const closeProfile = () => {
  showProfile.value = false;
};
</script>

<style scoped>
.topbar {
  position: relative;
  height: 68px;
  background: linear-gradient(90deg, #0f2742 0%, #143a63 55%, #0f2742 100%);
  color: #f8fafc;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
  font-family: Inter, sans-serif;
  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.18);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  z-index: 3;
}

.title {
  font-size: 24px;
  font-weight: 700;
  letter-spacing: 0.2px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 14px;
}

.icon-button {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.25);
  background: transparent;
  color: #ffffff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s ease, transform 0.2s ease;
}

.icon-button svg {
  width: 18px;
  height: 18px;
}

.icon-button:hover {
  background: rgba(255, 255, 255, 0.12);
  transform: rotate(10deg);
}

.profile-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.25);
  z-index: 4;
}

.profile-panel {
  position: absolute;
  right: 24px;
  top: 78px;
  width: 360px;
  background: #ffffff;
  color: #0f172a;
  border-radius: 12px;
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.24);
  padding: 20px;
  z-index: 5;
}

.profile-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.profile-name {
  font-weight: 700;
  font-size: 18px;
  margin-bottom: 4px;
}

.profile-role {
  font-size: 13px;
  color: #64748b;
}

.close-button {
  border: none;
  background: #e2e8f0;
  color: #0f172a;
  padding: 6px 10px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
}

.profile-grid {
  display: grid;
  gap: 12px;
}

.profile-actions {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

.profile-logout {
  border: none;
  background: #0f2742;
  color: #ffffff;
  padding: 10px 16px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.profile-logout:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 14px rgba(15, 39, 66, 0.2);
}

.profile-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px 10px;
  border-radius: 8px;
  background: #f8fafc;
}

.profile-item .label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #64748b;
}

.profile-item .value {
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
}
</style>

<template>
  <div class="topbar">
    <div class="title">
      {{ pageTitle }}
    </div>
    <div class="user-info">
      <span>{{ user.firstName }} {{ user.lastName }}</span>
      <button @click="$emit('logout')">Déconnexion</button>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useRouter, useRoute } from "vue-router";

const router = useRouter();
const route = useRoute();

// Simulation de l'utilisateur connecté
const user = {
  firstName: "Mohamed-Amine",
  lastName: "Rachdi"
};

// Titre dynamique selon la route
const pageTitle = computed(() => {
  switch (route.path) {
    case "/":
      return "Dashboard";
    case "/tickets":
      return "Backlog";
    case "/centralisation-demande":
      return "Centralisation demande";
    case "/priorite-rms":
      return "Priorité RMS";
    case "/habilitation":
      return "Habilitation";
    case "/upload":
      return "Upload Excel";
    default:
      return "Page";
  }
});

// Déconnexion
const logout = () => {
  localStorage.removeItem("token");
  router.push("/login");
};
</script>

<style scoped>
.topbar {
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
}

.title {
  font-size: 24px;
  font-weight: 700;
  letter-spacing: 0.2px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-info button {
  padding: 8px 14px;
  background-color: rgba(255, 255, 255, 0.92);
  color: #0f2742;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  transition: background 0.2s;
}

.user-info button:hover {
  background-color: #ffffff;
}
</style>

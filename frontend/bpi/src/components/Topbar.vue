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
    case "/": return "Dashboard";
    case "/tickets": return "Tickets";
    case "/upload": return "Upload Excel";
    default: return "Page";
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
  height: 60px;
  /* Dégradé horizontal de gauche à droite */
  background: linear-gradient(to right, #122b45, #122b45);
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
  font-family: Inter, sans-serif;
  box-shadow: 0 2px 6px rgba(0,0,0,0.1);
}

.title {
  font-size: 18px;
  font-weight: 600;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-info button {
  padding: 6px 12px;
  background-color: white;
  color: #0052cc;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  transition: background 0.2s;
}

.user-info button:hover {
  background-color: #f0f0f0;
}
</style>


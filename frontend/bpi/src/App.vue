<template>
  <div id="app">
    <div v-if="isAuthenticated" class="app-layout">
      <Sidebar />
      <div class="main-layout">
        <Topbar @logout="logout" />
        <main class="main-content">
          <router-view />
        </main>
      </div>
    </div>

    <router-view v-else />
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import { useRouter } from "vue-router";
import Sidebar from "./components/Sidebar.vue";
import Topbar from "./components/Topbar.vue";

// Authentification réactive
const isAuthenticated = ref(!!localStorage.getItem("token"));
const router = useRouter();

const syncAuth = () => {
  isAuthenticated.value = !!localStorage.getItem("token");
};

onMounted(() => {
  window.addEventListener("auth-changed", syncAuth);
  window.addEventListener("storage", syncAuth);
});

onBeforeUnmount(() => {
  window.removeEventListener("auth-changed", syncAuth);
  window.removeEventListener("storage", syncAuth);
});

// Fonction de logout
const logout = () => {
  localStorage.removeItem("token");
  syncAuth(); // met à jour immédiatement
  router.push("/login");
};
</script>

<style>
.app-layout {
  display: flex;
  height: 100%;
  width: 100%;
}

.main-layout {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.main-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px; /* tu peux réduire si tu veux zéro espace */
}
/* Reset navigateur */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* Fond global et hauteur complète */
html, body, #app {
  height: 100%;
  width: 100%;
  font-family: Inter, sans-serif;
}
</style>

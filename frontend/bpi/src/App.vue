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
import { ref } from "vue";
import Sidebar from "./components/Sidebar.vue";
import Topbar from "./components/Topbar.vue";

// Authentification réactive
const isAuthenticated = ref(!!localStorage.getItem("token"));

// Fonction de logout
const logout = () => {
  localStorage.removeItem("token");
  isAuthenticated.value = false; // met à jour immédiatement
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

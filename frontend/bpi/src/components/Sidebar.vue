<template>
  <div class="sidebar">
    <!-- Logo -->
    <div class="logo">
      <img src="../assets/logo.png" alt="Logo" />
    </div>

    <!-- Navigation -->
    <nav>
      <router-link to="/" class="nav-item" exact>
        <!-- Home SVG -->
        <svg xmlns="http://www.w3.org/2000/svg" class="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M3 9.75L12 3l9 6.75v11.25a1.5 1.5 0 01-1.5 1.5h-15A1.5 1.5 0 013 21V9.75z"/>
        </svg>
        <span>Dashboard</span>
      </router-link>

      <router-link to="/tickets" class="nav-item">
        <!-- Clipboard SVG -->
        <svg xmlns="http://www.w3.org/2000/svg" class="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M9 12h6m-6 4h6m2 8H7a2 2 0 01-2-2V6a2 2 0 012-2h4l2-2 2 2h4a2 2 0 012 2v16a2 2 0 01-2 2z"/>
        </svg>
        <span>Backlog</span>
      </router-link>

      <router-link to="/centralisation-demande" class="nav-item">
        <!-- Inbox Arrow Down SVG -->
        <svg xmlns="http://www.w3.org/2000/svg" class="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M2.25 12l1.5-1.5a2.25 2.25 0 011.59-.66h13.32a2.25 2.25 0 011.59.66L21.75 12M12 12v6m0 0l-3-3m3 3l3-3M3.75 20.25h16.5a2.25 2.25 0 002.25-2.25v-5.25a2.25 2.25 0 00-2.25-2.25H3.75A2.25 2.25 0 001.5 12.75v5.25a2.25 2.25 0 002.25 2.25z"/>
        </svg>
        <span>Centralisation demande</span>
      </router-link>

      <router-link to="/priorite-rms" class="nav-item">
        <!-- Flag SVG -->
        <svg xmlns="http://www.w3.org/2000/svg" class="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M5 5v16m0-16h10l-1.5 3H20l-2 4h-7l-1.5 3H5"/>
        </svg>
        <span>Priorité RMS</span>
      </router-link>


      <router-link to="/permanence" class="nav-item">
        <!-- Calendar SVG -->
        <svg xmlns="http://www.w3.org/2000/svg" class="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M8 7V4m8 3V4M3 9h18M5 7h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V9a2 2 0 012-2z"/>
        </svg>
        <span>Permanence</span>
      </router-link>

      <div class="nav-group">
        <button
          class="nav-item nav-group-toggle"
          type="button"
          :class="{ active: isInfoOpen }"
          @click="toggleInfo"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M11.25 11.25h1.5v5.25h-1.5zM12 8.25h.008"/>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M4.5 12a7.5 7.5 0 1115 0 7.5 7.5 0 01-15 0z"/>
          </svg>
          <span>Info client</span>
          <svg xmlns="http://www.w3.org/2000/svg" class="chevron" viewBox="0 0 24 24" fill="none">
            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="m6 9 6 6 6-6"/>
          </svg>
        </button>
        <div v-if="isInfoOpen" class="nav-submenu">
          <router-link to="/habilitation" class="nav-item sub-item">
            <span>Habilitation</span>
          </router-link>
          <router-link to="/client-plan-action" class="nav-item sub-item">
            <span>Client en plan d'action</span>
          </router-link>
          <router-link to="/client-sensible" class="nav-item sub-item">
            <span>Client sensible</span>
          </router-link>
        </div>
      </div>

      <div class="nav-group">
        <button
          class="nav-item nav-group-toggle"
          type="button"
          :class="{ active: isUtilityOpen }"
          @click="toggleUtility"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M4.5 6.75h15m-15 4.5h15m-15 4.5h15m-15 4.5h15"/>
          </svg>
          <span>Utilitaire</span>
          <svg xmlns="http://www.w3.org/2000/svg" class="chevron" viewBox="0 0 24 24" fill="none">
            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="m6 9 6 6 6-6"/>
          </svg>
        </button>
        <div v-if="isUtilityOpen" class="nav-submenu">
          <router-link to="/facturation" class="nav-item sub-item">
            <span>Facturation</span>
          </router-link>
          <router-link to="/wiki" class="nav-item sub-item">
            <span>Wiki</span>
          </router-link>
        </div>
      </div>
    </nav>
  </div>
</template>

<script setup>
import { ref } from "vue";

const isInfoOpen = ref(false);
const isUtilityOpen = ref(false);

const toggleInfo = () => {
  isInfoOpen.value = !isInfoOpen.value;
};

const toggleUtility = () => {
  isUtilityOpen.value = !isUtilityOpen.value;
};
</script>

<style scoped>
.sidebar {
  width: 220px;
  height: 100vh;
  background: linear-gradient(180deg, #f8fafc 0%, #eef2f6 100%);
  display: flex;
  flex-direction: column;
  padding: 20px 12px;
  border-right: 1px solid #dbe2ea;
  box-shadow: 8px 0 20px rgba(15, 23, 42, 0.06);
}

.logo {
  text-align: center;
  margin-bottom: 24px;
}

.logo img {
  width: 110px;
  object-fit: contain;
}

/* Navigation items */
.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  margin-bottom: 6px;
  color: #334155;
  text-decoration: none;
  border-radius: 10px;
  font-weight: 600;
  transition: background 0.2s ease, color 0.2s ease, transform 0.2s ease;
}

.nav-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.nav-group-toggle {
  width: 100%;
  justify-content: space-between;
  font-weight: 700;
  font-size: 16px;
  background: transparent;
}

.nav-group-toggle.active {
  background: #0f2742;
  color: #ffffff;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.15);
}

.nav-group-toggle .chevron {
  width: 16px;
  height: 16px;
  margin-left: auto;
  transition: transform 0.2s ease;
}

.nav-group-toggle.active .chevron {
  transform: rotate(180deg);
}

.nav-submenu {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-left: 8px;
}

.sub-item {
  padding-left: 16px;
  font-weight: 600;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
}

.sub-item:hover {
  background-color: #e8edf3;
  color: #0f2742;
  transform: translateX(2px);
}

.sub-item.router-link-active {
  background: #0f2742;
  color: #ffffff;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.15);
  border-color: transparent;
}

.nav-item:hover {
  background-color: #e8edf3;
  color: #0f2742;
  transform: translateX(2px);
}

.router-link-active {
  background: #0f2742;
  color: #ffffff;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.15);
}

/* Icônes couleur texte */
.icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  stroke: currentColor;
}
</style>

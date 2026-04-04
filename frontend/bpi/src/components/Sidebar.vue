<template>
  <div class="sidebar" :class="{ collapsed: isCollapsed }">
    <button
      class="collapse-toggle"
      type="button"
      :aria-label="isCollapsed ? 'Agrandir la sidebar' : 'Reduire la sidebar'"
      :title="isCollapsed ? 'Agrandir' : 'Reduire'"
      @click="toggleSidebar"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 6l6 6-6 6" />
      </svg>
    </button>

    <div class="logo">
      <img src="../assets/logo.png" alt="Logo" />
    </div>

    <nav>
      <router-link to="/" class="nav-item" exact title="Dashboard">
        <svg xmlns="http://www.w3.org/2000/svg" class="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9.75L12 3l9 6.75v11.25a1.5 1.5 0 01-1.5 1.5h-15A1.5 1.5 0 013 21V9.75z" />
        </svg>
        <span class="nav-label">Dashboard</span>
      </router-link>

      <router-link to="/centralisation-demande" class="nav-item" title="Centralisation demande">
        <svg xmlns="http://www.w3.org/2000/svg" class="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.25 12l1.5-1.5a2.25 2.25 0 011.59-.66h13.32a2.25 2.25 0 011.59.66L21.75 12M12 12v6m0 0l-3-3m3 3l3-3M3.75 20.25h16.5a2.25 2.25 0 002.25-2.25v-5.25a2.25 2.25 0 00-2.25-2.25H3.75A2.25 2.25 0 001.5 12.75v5.25a2.25 2.25 0 002.25 2.25z" />
        </svg>
        <span class="nav-label">Centralisation demande</span>
      </router-link>

      <router-link to="/priorite-rms" class="nav-item" title="Priorité RMS">
        <svg xmlns="http://www.w3.org/2000/svg" class="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5v16m0-16h10l-1.5 3H20l-2 4h-7l-1.5 3H5" />
        </svg>
        <span class="nav-label">Priorité RMS</span>
      </router-link>

      <router-link to="/permanence" class="nav-item" title="Permanence">
        <svg xmlns="http://www.w3.org/2000/svg" class="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V4m8 3V4M3 9h18M5 7h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V9a2 2 0 012-2z" />
        </svg>
        <span class="nav-label">Permanence</span>
      </router-link>

      <div class="nav-section">
        <div class="nav-section-label">
          <svg xmlns="http://www.w3.org/2000/svg" class="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.25 11.25h1.5v5.25h-1.5zM12 8.25h.008" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.5 12a7.5 7.5 0 1115 0 7.5 7.5 0 01-15 0z" />
          </svg>
          <span class="nav-label">Info client</span>
        </div>
        <div class="nav-submenu">
          <router-link to="/habilitation" class="nav-item sub-item">
            <span class="nav-label">Habilitation</span>
          </router-link>
          <router-link to="/suivi-client" class="nav-item sub-item">
            <span class="nav-label">Suivi client</span>
          </router-link>
        </div>
      </div>

      <div class="nav-section">
        <div class="nav-section-label">
          <svg xmlns="http://www.w3.org/2000/svg" class="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.5 6.75h15m-15 4.5h15m-15 4.5h15m-15 4.5h15" />
          </svg>
          <span class="nav-label">Utilitaire</span>
        </div>
        <div class="nav-submenu">
          <router-link to="/utilitaire-todo" class="nav-item sub-item">
            <span class="nav-label">To-do cockpit</span>
          </router-link>
          <router-link to="/facturation" class="nav-item sub-item">
            <span class="nav-label">Facturation</span>
          </router-link>
          <router-link to="/wiki" class="nav-item sub-item">
            <span class="nav-label">Mes wikis</span>
          </router-link>
        </div>
      </div>
    </nav>
  </div>
</template>

<script setup>
import { ref } from "vue";

const isCollapsed = ref(false);

const toggleSidebar = () => {
  isCollapsed.value = !isCollapsed.value;
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
  transition: width 0.25s ease, padding 0.25s ease;
  position: relative;
}

.sidebar.collapsed {
  width: 78px;
  padding: 20px 8px;
}

.collapse-toggle {
  position: absolute;
  top: 50%;
  right: -14px;
  transform: translateY(-50%);
  width: 28px;
  height: 28px;
  border-radius: 999px;
  border: 1px solid #dbe2ea;
  background: #ffffff;
  color: #334155;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 6px 16px rgba(15, 23, 42, 0.12);
  z-index: 2;
}

.collapsed .collapse-toggle .icon {
  transform: rotate(180deg);
}

.logo {
  text-align: center;
  margin-bottom: 24px;
}

.logo img {
  width: 110px;
  object-fit: contain;
  transition: width 0.25s ease;
}

.collapsed .logo img {
  width: 42px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 7px 10px;
  margin-bottom: 3px;
  color: #334155;
  text-decoration: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  transition: background 0.2s ease, color 0.2s ease, transform 0.2s ease;
}

.collapsed .nav-item {
  justify-content: center;
  padding: 10px 8px;
}

.collapsed .nav-label {
  display: none;
}

.nav-section {
  display: flex;
  flex-direction: column;
  margin-top: 6px;
}

.nav-section-label {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 14px 4px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: #94a3b8;
  border-top: 1px solid #e2e8f0;
}

.collapsed .nav-section-label {
  justify-content: center;
  padding: 6px 8px 4px;
}

.nav-section-label .icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  color: #94a3b8;
}

.nav-submenu {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-left: 8px;
}

.collapsed .nav-submenu {
  margin-left: 0;
}

.sub-item {
  padding-left: 14px;
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

.icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  stroke: currentColor;
}
</style>

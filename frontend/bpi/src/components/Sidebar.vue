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
          <router-link to="/habilitation" class="nav-item sub-item" title="Habilitation">
            <svg xmlns="http://www.w3.org/2000/svg" class="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
            </svg>
            <span class="nav-label">Habilitation</span>
          </router-link>
          <router-link to="/suivi-client" class="nav-item sub-item" title="Suivi client">
            <svg xmlns="http://www.w3.org/2000/svg" class="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
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
          <router-link to="/utilitaire-todo" class="nav-item sub-item" title="To-do cockpit">
            <svg xmlns="http://www.w3.org/2000/svg" class="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span class="nav-label">To-do cockpit</span>
          </router-link>
          <router-link to="/facturation" class="nav-item sub-item" title="Facturation">
            <svg xmlns="http://www.w3.org/2000/svg" class="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
            </svg>
            <span class="nav-label">Facturation</span>
          </router-link>
          <router-link to="/wiki" class="nav-item sub-item" title="Mes wikis">
            <svg xmlns="http://www.w3.org/2000/svg" class="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
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

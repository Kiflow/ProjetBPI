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

      <router-link to="/habilitation" class="nav-item">
        <!-- Shield Check SVG -->
        <svg xmlns="http://www.w3.org/2000/svg" class="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M12 3l7.5 3v6c0 5.25-3.75 8.25-7.5 9-3.75-.75-7.5-3.75-7.5-9V6L12 3zm-3 9l2.25 2.25L15 10.5"/>
        </svg>
        <span>Habilitation</span>
      </router-link>
    </nav>
  </div>
</template>

<style scoped>
.sidebar {
  width: 200px;
  height: 100vh;
  background-color: #EDEFF1; /* fond uniforme */
  display: flex;
  flex-direction: column;
  padding-left: 10px;
  padding-right: 10px;
  padding-top: 20px;
}

.logo {
  text-align: center;
  margin-bottom: 30px;
}

.logo img {
  width: 120px;
  object-fit: contain;
}

/* Navigation items */
.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  margin-bottom: 8px;
  color: #6b6b6b; /* texte gris bleu */
  text-decoration: none;
  border-radius: 4px;
  font-weight: bold; /* texte en gras */
  transition: background 0.2s, color 0.2s;
}

.nav-item:hover {
  background-color: rgba(0,0,0,0.05); /* léger hover */
  color: #6b6b6b;
}

.router-link-active {
  background-color: rgba(0,0,0,0.1);
}

/* Icônes couleur texte */
.icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  stroke: #6b6b6b;
}
</style>

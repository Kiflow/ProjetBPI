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
        <span>Tickets</span>
      </router-link>

      <router-link to="/upload" class="nav-item">
        <!-- Document SVG -->
        <svg xmlns="http://www.w3.org/2000/svg" class="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M7 8h10M7 12h6m-6 4h6M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
        </svg>
        <span>Upload Excel</span>
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

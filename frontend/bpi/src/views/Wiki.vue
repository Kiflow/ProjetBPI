<template>
  <div class="page" @click="closeActionMenu">

    <!-- SHORTCUTS BAR — téléportée sous la topbar -->
    <Teleport to="#toolbar-portal">
      <div class="shortcuts-bar" @click.stop>
        <div class="shortcuts-chips">
          <a v-for="sc in shortcuts" :key="sc.id" class="shortcut-chip" :href="sc.url" target="_blank" rel="noreferrer">
            <img v-if="getFaviconUrl(sc.url) && !failedFavicons.has(sc.url)" class="shortcut-favicon" :src="getFaviconUrl(sc.url)" loading="lazy" @error="markFaviconFailed(sc.url)" />
            <span v-else class="favicon-letter" :style="{ background: letterColor(sc.title) }">{{ (sc.title || '?')[0].toUpperCase() }}</span>
            {{ sc.title }}
            <button v-if="showShortcutEditor" type="button" class="chip-del" @click.prevent="removeShortcut(sc.id)">✕</button>
          </a>
          <span v-if="!shortcuts.length && !showShortcutEditor" class="shortcuts-empty">Aucun raccourci.</span>
        </div>
        <div class="sc-menu-wrap">
          <button type="button" class="sc-dots-btn" @click.stop="scMenuOpen = !scMenuOpen" aria-label="Gérer les raccourcis">
            <svg viewBox="0 0 20 20" fill="currentColor"><path d="M3 10a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0ZM8.5 10a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0ZM15.5 8.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z"/></svg>
          </button>
          <div v-if="scMenuOpen" class="sc-dropdown" @click.stop>
            <button type="button" class="sc-drop-item" @click="scMenuOpen = false; showShortcutModal = true">
              <svg viewBox="0 0 20 20" fill="currentColor"><path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z"/></svg>
              Ajouter
            </button>
            <button type="button" class="sc-drop-item" @click="scMenuOpen = false; showShortcutEditor = !showShortcutEditor">
              <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clip-rule="evenodd"/></svg>
              {{ showShortcutEditor ? 'Terminer' : 'Supprimer' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- HERO -->
    <div class="hero">
      <div class="hero-left">
        <div class="hero-eyebrow">Bibliothèque personnelle</div>
        <h1 class="hero-title">Mes wikis</h1>
        <p class="hero-sub">Centralisez vos liens, wikis et raccourcis internes.</p>
      </div>
      <div class="hero-actions">
        <button type="button" class="btn-ghost" @click="showGroupModal = true">
          <svg viewBox="0 0 20 20" fill="currentColor"><path d="M2 4.75A.75.75 0 0 1 2.75 4h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 4.75Zm0 10.5a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5a.75.75 0 0 1-.75-.75ZM2 10a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 10Z"/></svg>
          Nouveau groupe
        </button>
        <button type="button" class="btn-primary" @click="openAddWiki">
          <svg viewBox="0 0 20 20" fill="currentColor"><path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z"/></svg>
          Ajouter un wiki
        </button>
      </div>
    </div>

    <!-- SEARCH + STATS -->
    <div class="search-stats-row">
      <div class="search-wrap">
        <svg class="search-icon" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clip-rule="evenodd"/></svg>
        <input
          ref="searchRef"
          v-model="searchQuery"
          type="search"
          class="search-input"
          placeholder="Rechercher un wiki par nom ou URL…"
          @keydown.escape="searchQuery = ''"
        />
        <button v-if="searchQuery" type="button" class="search-clear" @click="searchQuery = ''">✕</button>
        <kbd v-else class="search-kbd">⌘K</kbd>
      </div>
      <div class="stats-row">
        <div class="stat-card">
          <div class="stat-num">{{ wikis.length }}</div>
          <div class="stat-lbl">Liens</div>
        </div>
        <div class="stat-card">
          <div class="stat-num">{{ groups.length }}</div>
          <div class="stat-lbl">Groupes</div>
        </div>
        <div class="stat-card">
          <div class="stat-num">{{ shortcuts.length }}</div>
          <div class="stat-lbl">Raccourcis</div>
        </div>
      </div>
    </div>

    <!-- SEARCH HINT -->
    <div v-if="searchQuery" class="search-hint">
      {{ filteredTotal }} résultat{{ filteredTotal > 1 ? 's' : '' }} pour <strong>« {{ searchQuery }} »</strong>
    </div>

    <!-- GROUPS -->
    <div class="groups-list">
      <div
        v-for="group in groupedWikis" :key="group.key"
        class="group-block"
        :class="{ 'drop-target': dropOverGroup === group.key }"
        @dragover.prevent="dropOverGroup = group.key"
        @dragleave="dropOverGroup = null"
        @drop.prevent="handleDrop($event, group.id)"
      >
        <button class="group-header" type="button" @click="toggleGroup(group.key)">
          <svg class="chevron-icon" :class="{ open: isGroupOpen(group.key) }" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd"/>
          </svg>
          <span class="group-dot" :class="{ 'group-dot--ungrouped': group.id === null }"></span>
          <span class="group-name">{{ group.label }}</span>
          <span class="group-count">{{ group.items.length }}</span>
          <span v-if="dragId && group.id !== null" class="drop-hint">Déposer ici</span>
          <div class="group-header-right">
            <span
              v-if="group.canRemove"
              class="group-del"
              role="button" tabindex="0"
              title="Supprimer le groupe"
              @click.stop="removeGroup(group.id)"
              @keydown.enter.prevent.stop="removeGroup(group.id)"
            >
              <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clip-rule="evenodd"/></svg>
            </span>
          </div>
        </button>

        <div v-if="isGroupOpen(group.key)" class="group-body">
          <!-- Wiki list (left 2/3) -->
          <div class="wiki-list-panel">
            <div v-if="!group.items.length" class="empty-group">
              {{ dragId ? 'Déposez le wiki ici' : 'Aucun wiki — glissez-déposez ici.' }}
            </div>
            <div
              v-for="(wiki, i) in group.items" :key="wiki.id"
              class="wiki-row"
              :class="{ 'wiki-row--dragging': dragId === wiki.id, 'wiki-row--first': i === 0 }"
              draggable="true"
              @dragstart="handleDragStart($event, wiki.id)"
              @dragend="dragId = null; dropOverGroup = null"
              @click.stop
            >
              <div class="drag-handle">
                <svg viewBox="0 0 20 20" fill="currentColor"><path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2Zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8Zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14Zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6Zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8Zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14Z"/></svg>
              </div>
              <img v-if="getFaviconUrl(wiki.url) && !failedFavicons.has(wiki.url)" class="wiki-favicon" :src="getFaviconUrl(wiki.url)" loading="lazy" @error="markFaviconFailed(wiki.url)" />
              <span v-else class="wiki-favicon-letter" :style="{ background: letterColor(wiki.name) }">{{ (wiki.name || '?')[0].toUpperCase() }}</span>
              <div class="wiki-info">
                <span class="wiki-name">{{ wiki.name }}</span>
                <span class="wiki-url">{{ wiki.url }}</span>
              </div>
              <a class="btn-open" :href="wiki.url" target="_blank" rel="noreferrer" @click.stop>
                <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4.25 5.5a.75.75 0 0 0-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 0 0 .75-.75v-4a.75.75 0 0 1 1.5 0v4A2.25 2.25 0 0 1 12.75 17h-8.5A2.25 2.25 0 0 1 2 14.75v-8.5A2.25 2.25 0 0 1 4.25 4h5a.75.75 0 0 1 0 1.5h-5Zm6.75-3a.75.75 0 0 1 .75-.75h4.5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0V4.06l-6.22 6.22a.75.75 0 0 1-1.06-1.06L14.44 3H11a.75.75 0 0 1-.75-.75Z" clip-rule="evenodd"/></svg>
                Ouvrir
              </a>
              <div class="wiki-actions" @click.stop>
                <button type="button" class="action-dots" @click.stop="toggleActionMenu(wiki.id)" aria-label="Actions">
                  <svg viewBox="0 0 20 20" fill="currentColor"><path d="M3 10a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0ZM8.5 10a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0ZM15.5 8.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z"/></svg>
                </button>
                <div v-if="actionMenuId === wiki.id" class="action-menu" @click.stop>
                  <button type="button" class="action-item" @click="openEditWiki(wiki); closeActionMenu()">
                    <svg viewBox="0 0 20 20" fill="currentColor"><path d="m5.433 13.917 1.262-3.155A4 4 0 0 1 7.58 9.42l6.92-6.918a2.121 2.121 0 0 1 3 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 0 1-.65-.65Z"/></svg>
                    Modifier
                  </button>
                  <button type="button" class="action-item" @click="copyLink(wiki.url); closeActionMenu()">
                    <svg viewBox="0 0 20 20" fill="currentColor"><path d="M7 3.5A1.5 1.5 0 0 1 8.5 2h3.879a1.5 1.5 0 0 1 1.06.44l3.122 3.12A1.5 1.5 0 0 1 17 6.622V12.5a1.5 1.5 0 0 1-1.5 1.5h-1v-3.379a3 3 0 0 0-.879-2.121L10.5 5.379A3 3 0 0 0 8.379 4.5H7v-1ZM4.5 6A1.5 1.5 0 0 0 3 7.5v9A1.5 1.5 0 0 0 4.5 18h7a1.5 1.5 0 0 0 1.5-1.5v-5.879a1.5 1.5 0 0 0-.44-1.06L9.44 6.439A1.5 1.5 0 0 0 8.378 6H4.5Z"/></svg>
                    Copier le lien
                  </button>
                  <div class="action-divider"></div>
                  <button type="button" class="action-item action-item-danger" @click="removeWiki(wiki.id); closeActionMenu()">
                    <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clip-rule="evenodd"/></svg>
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          </div>
          <!-- Docs panel (right 1/3) -->
          <div
            v-if="group.id !== null"
            class="docs-panel"
            :class="{ 'docs-panel--over': docDropOver === group.id }"
            @dragover.prevent.stop="onDocDragOver($event, group.id)"
            @dragleave="onDocDragLeave($event, group.id)"
            @drop.prevent.stop="onDocDrop($event, group.id)"
          >
            <div class="docs-panel-header">
              <span class="docs-panel-title">
                <svg viewBox="0 0 20 20" fill="currentColor" width="13" height="13"><path fill-rule="evenodd" d="M15.621 4.379a3 3 0 0 0-4.242 0l-7 7a3 3 0 0 0 4.241 4.243h.001l.497-.5a.75.75 0 0 1 1.064 1.057l-.498.501-.002.002a4.5 4.5 0 0 1-6.364-6.364l7-7a4.5 4.5 0 0 1 6.368 6.36l-3.455 3.553A2.625 2.625 0 1 1 9.52 9.52l3.45-3.451a.75.75 0 1 1 1.061 1.06l-3.45 3.451a1.125 1.125 0 0 0 1.587 1.595l3.454-3.553a3 3 0 0 0 0-4.242Z" clip-rule="evenodd"/></svg>
                Fichiers
              </span>
              <button type="button" class="docs-add-btn" @click="triggerFileUpload(group.id)">
                <svg viewBox="0 0 20 20" fill="currentColor"><path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z"/></svg>
                Ajouter
              </button>
            </div>
            <div v-if="!groupDocs[group.id]?.length" class="docs-empty-zone">
              <svg viewBox="0 0 20 20" fill="none" width="28" height="28"><path d="M3 16.5v-9A1.5 1.5 0 0 1 4.5 6H8l2 2h5.5A1.5 1.5 0 0 1 17 9.5v7a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 3 16.5Z" stroke="#cbd5e1" stroke-width="1.5"/></svg>
              <span>Glissez-déposez un fichier</span>
            </div>
            <div v-else class="docs-file-list">
              <div v-for="doc in groupDocs[group.id]" :key="doc.name" class="doc-item">
                <svg class="doc-file-icon" viewBox="0 0 20 20" fill="currentColor"><path d="M3 3.5A1.5 1.5 0 0 1 4.5 2h6.879a1.5 1.5 0 0 1 1.06.44l4.122 4.12A1.5 1.5 0 0 1 17 7.622V16.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 3 16.5v-13Z"/></svg>
                <span class="doc-name" :title="doc.name">{{ doc.name }}</span>
                <span class="doc-size">{{ formatSize(doc.size) }}</span>
                <div class="doc-actions">
                  <button class="doc-action-btn" @click="downloadDoc(group.id, doc.name)" title="Télécharger">
                    <svg viewBox="0 0 20 20" fill="currentColor"><path d="M10.75 2.75a.75.75 0 0 0-1.5 0v8.614L6.295 8.235a.75.75 0 1 0-1.09 1.03l4.25 4.5a.75.75 0 0 0 1.09 0l4.25-4.5a.75.75 0 0 0-1.09-1.03l-2.955 3.129V2.75Z"/><path d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z"/></svg>
                  </button>
                  <button class="doc-action-btn doc-action-danger" @click="deleteDoc(group.id, doc.name)" title="Supprimer">
                    <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clip-rule="evenodd"/></svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-if="wikis.length === 0" class="empty-state">
        <svg viewBox="0 0 48 48" fill="none"><circle cx="24" cy="24" r="22" stroke="#e2e8f0" stroke-width="2"/><path d="M16 24h16M24 16v16" stroke="#cbd5e1" stroke-width="2.5" stroke-linecap="round"/></svg>
        <p>Aucun wiki pour le moment.</p>
        <button type="button" class="btn-primary" @click="openAddWiki">Ajouter un wiki</button>
      </div>

      <!-- No search results -->
      <div v-else-if="filteredTotal === 0 && searchQuery" class="empty-state">
        <svg viewBox="0 0 48 48" fill="none"><circle cx="24" cy="24" r="22" stroke="#e2e8f0" stroke-width="2"/><path d="M16 24h16" stroke="#cbd5e1" stroke-width="2.5" stroke-linecap="round"/></svg>
        <p>Aucun wiki ne correspond à « {{ searchQuery }} »</p>
      </div>
    </div>

    <!-- MODAL: Ajouter / Modifier un wiki -->
    <div v-if="showWikiModal" class="overlay" @click.self="showWikiModal = false">
      <div class="modal">
        <div class="modal-head">
          <div>
            <h2 class="modal-title">{{ editingId ? 'Modifier le wiki' : 'Ajouter un wiki' }}</h2>
            <p class="modal-sub">{{ editingId ? 'Mettez à jour les informations du lien.' : 'Le nom sera détecté depuis l\'URL si laissé vide.' }}</p>
          </div>
          <button type="button" class="close-btn" @click="showWikiModal = false">✕</button>
        </div>
        <form class="modal-body" @submit.prevent="saveWiki">
          <label class="field">
            <span>Lien *</span>
            <div class="url-input-wrap">
              <span class="url-prefix">https://</span>
              <input v-model="form.url" type="url" placeholder="wiki.intra.bpi.fr/…" autofocus />
            </div>
          </label>
          <label class="field">
            <span>Nom (facultatif)</span>
            <input v-model="form.name" type="text" placeholder="Détecté automatiquement depuis l'URL" />
          </label>
          <label class="field">
            <span>Groupe</span>
            <select v-model="form.groupId">
              <option value="">Sans groupe</option>
              <option v-for="g in groups" :key="g.id" :value="g.id">{{ g.name }}</option>
            </select>
          </label>
          <p v-if="error" class="form-error">{{ error }}</p>
          <div class="modal-foot">
            <button type="submit" class="btn-primary">
              {{ editingId ? 'Enregistrer' : 'Ajouter' }}
            </button>
            <button type="button" class="btn-ghost" @click="showWikiModal = false">Annuler</button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL: Nouveau groupe -->
    <div v-if="showGroupModal" class="overlay" @click.self="showGroupModal = false">
      <div class="modal modal-sm">
        <div class="modal-head">
          <h2 class="modal-title">Nouveau groupe</h2>
          <button type="button" class="close-btn" @click="showGroupModal = false">✕</button>
        </div>
        <form class="modal-body" @submit.prevent="saveGroup">
          <label class="field">
            <span>Nom du groupe *</span>
            <input v-model="groupForm.name" type="text" placeholder="Ex : Sociétés, Outils RH…" autofocus />
          </label>
          <p v-if="groupError" class="form-error">{{ groupError }}</p>
          <div class="modal-foot">
            <button type="submit" class="btn-primary">Créer</button>
            <button type="button" class="btn-ghost" @click="showGroupModal = false">Annuler</button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL: Ajouter un raccourci -->
    <div v-if="showShortcutModal" class="overlay" @click.self="showShortcutModal = false">
      <div class="modal modal-sm">
        <div class="modal-head">
          <h2 class="modal-title">Ajouter un raccourci</h2>
          <button type="button" class="close-btn" @click="showShortcutModal = false">✕</button>
        </div>
        <form class="modal-body" @submit.prevent="addShortcut">
          <label class="field">
            <span>Nom *</span>
            <input v-model="shortcutForm.title" type="text" placeholder="Ex : Portail RH" autofocus required />
          </label>
          <label class="field">
            <span>Lien *</span>
            <div class="url-input-wrap">
              <span class="url-prefix">https://</span>
              <input v-model="shortcutForm.url" type="url" placeholder="intranet.bpi.fr/…" required />
            </div>
          </label>
          <div class="modal-foot">
            <button type="submit" class="btn-primary">Ajouter</button>
            <button type="button" class="btn-ghost" @click="showShortcutModal = false">Annuler</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Hidden file input for docs upload -->
    <input ref="fileInputRef" type="file" style="display:none" @change="onFileSelected" />

    <!-- TOAST -->
    <Transition name="toast">
      <div v-if="toast" class="toast" :class="toast.kind === 'warn' ? 'toast--warn' : 'toast--ok'">
        {{ toast.msg }}
      </div>
    </Transition>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import api from "../services/api";

// ── State ──────────────────────────────────────────────────────────────────
const wikis      = ref([]);
const groups     = ref([]);
const shortcuts  = ref([]);
const openGroups = ref(new Set());
const searchQuery   = ref("");
const actionMenuId  = ref(null);
const dragId        = ref(null);
const dropOverGroup = ref(null);
const searchRef     = ref(null);

const showWikiModal      = ref(false);
const showGroupModal     = ref(false);
const showShortcutModal  = ref(false);
const showShortcutEditor = ref(false);
const scMenuOpen         = ref(false);;

const editingId  = ref(null);
const error      = ref("");
const groupError = ref("");

const form = ref({ groupId: "", name: "", url: "" });
const groupForm   = ref({ name: "" });
const shortcutForm = ref({ title: "", url: "" });

const toast = ref(null);
let toastTimer = null;

// ── Docs ──────────────────────────────────────────────────────────────────
const groupDocs         = ref({});
const docDropOver       = ref(null);
const activeFileGroupId = ref(null);
const fileInputRef      = ref(null);

// ── Toast ──────────────────────────────────────────────────────────────────
const showToast = (msg, kind = "ok") => {
  if (toastTimer) clearTimeout(toastTimer);
  toast.value = { msg, kind };
  toastTimer = setTimeout(() => { toast.value = null; }, 2400);
};

// ── Keyboard: ⌘K to focus search ──────────────────────────────────────────
const onKeyDown = (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === "k") {
    e.preventDefault();
    searchRef.value?.focus();
    searchRef.value?.select();
  }
};
onMounted(() => {
  window.addEventListener("keydown", onKeyDown);
  loadAll();
  // open all groups by default
  setTimeout(() => {
    groups.value.forEach(g => openGroups.value.add(g.id));
    openGroups.value.add("ungrouped");
  }, 300);
});
onBeforeUnmount(() => window.removeEventListener("keydown", onKeyDown));

// ── Computed ───────────────────────────────────────────────────────────────
const groupedWikis = computed(() => {
  const q = (searchQuery.value || "").trim().toLowerCase();
  const filtered = q
    ? wikis.value.filter(w => w.name?.toLowerCase().includes(q) || (w.url || "").toLowerCase().includes(q))
    : wikis.value;

  const map = new Map(groups.value.map(g => [g.id, { key: g.id, id: g.id, label: g.name, items: [], canRemove: true }]));
  const ung = { key: "ungrouped", id: null, label: "Sans groupe", items: [], canRemove: false };

  filtered.forEach(w => {
    const target = w.groupId && map.get(w.groupId) ? map.get(w.groupId) : ung;
    target.items.push(w);
  });

  [...map.values(), ung].forEach(g => g.items.sort((a, b) => a.name.localeCompare(b.name)));

  const result = [...map.values()];
  if (ung.items.length || groups.value.length === 0) result.push(ung);
  return result;
});

const filteredTotal = computed(() => groupedWikis.value.reduce((sum, g) => sum + g.items.length, 0));

// ── Helpers ────────────────────────────────────────────────────────────────
const failedFavicons = ref(new Set());
const markFaviconFailed = (url) => { failedFavicons.value = new Set([...failedFavicons.value, url]); };

const letterPalette = ["#1a3a5c","#0891b2","#7c3aed","#b45309","#16a34a","#db2777","#0f766e","#dc2626","#475569","#2e5f8a"];
const letterColor = (name) => {
  let h = 0; for (let i = 0; i < (name || "").length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  return letterPalette[Math.abs(h) % letterPalette.length];
};

const getFaviconUrl = (url) => {
  try { const { origin } = new URL(url); return origin ? `${origin}/favicon.ico` : ""; }
  catch { return ""; }
};

const normalizeUrl = (v) => {
  const url = (v || "").trim();
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
};

const newId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

// ── API ────────────────────────────────────────────────────────────────────
const loadAll = async () => {
  try {
    const [gRes, wRes, sRes] = await Promise.all([
      api.get("/wiki/groups"), api.get("/wiki/items"), api.get("/wiki/shortcuts")
    ]);
    groups.value    = gRes.data;
    wikis.value     = wRes.data;
    shortcuts.value = sRes.data;
    // open all groups after load
    groups.value.forEach(g => openGroups.value.add(g.id));
    openGroups.value.add("ungrouped");
    // load docs for all groups
    groups.value.forEach(g => loadGroupDocs(g.id));
  } catch {
    groups.value = []; wikis.value = []; shortcuts.value = [];
  }
};

// ── Wiki CRUD ──────────────────────────────────────────────────────────────
const openAddWiki = () => {
  editingId.value = null;
  form.value = { groupId: "", name: "", url: "" };
  error.value = "";
  showWikiModal.value = true;
};

const openEditWiki = (wiki) => {
  editingId.value = wiki.id;
  form.value = { groupId: wiki.groupId || "", name: wiki.name || "", url: wiki.url || "" };
  error.value = "";
  showWikiModal.value = true;
};

const fetchPageTitle = async (url) => {
  try { return (await api.get("/metadata", { params: { url } })).data?.title || ""; }
  catch { return ""; }
};

const saveWiki = async () => {
  error.value = "";
  let url = normalizeUrl(form.value.url);
  if (!url) { error.value = "Veuillez renseigner le lien du wiki."; return; }
  let name = (form.value.name || "").trim();
  const groupId = form.value.groupId || null;

  if (!name) {
    const title = await fetchPageTitle(url);
    name = title || (() => { try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return url; } })();
  }

  try {
    if (editingId.value) {
      await api.put(`/wiki/items/${editingId.value}`, { name, url, groupId });
      wikis.value = wikis.value.map(w => w.id !== editingId.value ? w : { ...w, name, url, groupId });
      showToast("Wiki mis à jour");
    } else {
      const id = newId();
      await api.post("/wiki/items", { id, name, url, groupId });
      wikis.value = [...wikis.value, { id, name, url, groupId }];
      showToast("Wiki ajouté");
    }
    showWikiModal.value = false;
  } catch { error.value = "Erreur lors de l'enregistrement."; }
};

const removeWiki = async (id) => {
  if (!confirm("Supprimer ce wiki ?")) return;
  try {
    await api.delete(`/wiki/items/${id}`);
    wikis.value = wikis.value.filter(w => w.id !== id);
    showToast("Wiki supprimé", "warn");
  } catch {}
};

// ── Group CRUD ─────────────────────────────────────────────────────────────
const saveGroup = async () => {
  groupError.value = "";
  const name = (groupForm.value.name || "").trim();
  if (!name) { groupError.value = "Veuillez renseigner un nom de groupe."; return; }
  if (groups.value.some(g => g.name.toLowerCase() === name.toLowerCase())) { groupError.value = "Ce groupe existe déjà."; return; }
  try {
    const id = newId();
    await api.post("/wiki/groups", { id, name });
    groups.value = [...groups.value, { id, name }];
    openGroups.value.add(id);
    groupForm.value = { name: "" };
    showGroupModal.value = false;
    showToast(`Groupe « ${name} » créé`);
  } catch { groupError.value = "Erreur lors de la création du groupe."; }
};

const removeGroup = async (groupId) => {
  const group = groups.value.find(g => g.id === groupId);
  if (!group || !confirm(`Supprimer le groupe « ${group.name} » ? Les wikis seront déplacés en "Sans groupe".`)) return;
  try {
    await api.delete(`/wiki/groups/${groupId}`);
    groups.value = groups.value.filter(g => g.id !== groupId);
    wikis.value  = wikis.value.map(w => w.groupId !== groupId ? w : { ...w, groupId: null });
    showToast("Groupe supprimé", "warn");
  } catch {}
};

// ── Shortcuts ──────────────────────────────────────────────────────────────
const addShortcut = async () => {
  const title = (shortcutForm.value.title || "").trim();
  const url   = normalizeUrl(shortcutForm.value.url);
  if (!title || !url) return;
  try {
    const id = newId();
    await api.post("/wiki/shortcuts", { id, title, url });
    shortcuts.value = [...shortcuts.value, { id, title, url }];
    shortcutForm.value = { title: "", url: "" };
    showShortcutModal.value = false;
  } catch {}
};

const removeShortcut = async (id) => {
  try { await api.delete(`/wiki/shortcuts/${id}`); shortcuts.value = shortcuts.value.filter(s => s.id !== id); }
  catch {}
};

// ── Docs CRUD ──────────────────────────────────────────────────────────────
const loadGroupDocs = async (groupId) => {
  if (!groupId) return;
  try {
    const res = await api.get(`/wiki/groups/${groupId}/docs`);
    groupDocs.value = { ...groupDocs.value, [groupId]: res.data };
  } catch { groupDocs.value = { ...groupDocs.value, [groupId]: [] }; }
};

const triggerFileUpload = (groupId) => {
  activeFileGroupId.value = groupId;
  fileInputRef.value?.click();
};

const onFileSelected = async (e) => {
  const file = e.target.files[0];
  if (!file || !activeFileGroupId.value) return;
  e.target.value = "";
  await uploadFileToGroup(activeFileGroupId.value, file);
};

const uploadFileToGroup = async (groupId, file) => {
  if (file.size > 20 * 1024 * 1024) {
    showToast("Fichier trop volumineux (max 20 Mo)", "warn");
    return;
  }
  const fd = new FormData();
  fd.append("file", file);
  try {
    const res = await api.post(`/wiki/groups/${groupId}/docs`, fd, {
      headers: { "Content-Type": "multipart/form-data" }
    });
    groupDocs.value = { ...groupDocs.value, [groupId]: [res.data, ...(groupDocs.value[groupId] || [])] };
    showToast(`« ${res.data.name} » ajouté`);
  } catch (err) {
    showToast(err.response?.data?.message || "Erreur lors de l'upload.", "warn");
  }
};

const downloadDoc = async (groupId, filename) => {
  try {
    const res = await api.get(`/wiki/groups/${groupId}/docs/${encodeURIComponent(filename)}`, { responseType: "blob" });
    const url = URL.createObjectURL(res.data);
    const a = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch { showToast("Erreur lors du téléchargement", "warn"); }
};

const deleteDoc = async (groupId, filename) => {
  if (!confirm(`Supprimer « ${filename} » ?`)) return;
  try {
    await api.delete(`/wiki/groups/${groupId}/docs/${encodeURIComponent(filename)}`);
    groupDocs.value = { ...groupDocs.value, [groupId]: (groupDocs.value[groupId] || []).filter(f => f.name !== filename) };
    showToast("Document supprimé", "warn");
  } catch { showToast("Erreur lors de la suppression", "warn"); }
};

const formatSize = (bytes) => {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
};

const onDocDragOver = (event, groupId) => {
  if (event.dataTransfer.types.includes("Files")) docDropOver.value = groupId;
};
const onDocDragLeave = (event, groupId) => {
  if (!event.currentTarget.contains(event.relatedTarget)) {
    if (docDropOver.value === groupId) docDropOver.value = null;
  }
};
const onDocDrop = (event, groupId) => {
  docDropOver.value = null;
  if (!event.dataTransfer.files.length) return;
  uploadFileToGroup(groupId, event.dataTransfer.files[0]);
};

// ── Drag & drop ────────────────────────────────────────────────────────────
const handleDragStart = (event, wikiId) => {
  dragId.value = wikiId;
  event.dataTransfer.setData("text/wiki-id", wikiId);
  event.dataTransfer.effectAllowed = "move";
};

const handleDrop = async (event, groupId) => {
  dropOverGroup.value = null;
  const wikiId = event.dataTransfer.getData("text/wiki-id") || dragId.value;
  if (!wikiId) return;
  const wiki = wikis.value.find(w => w.id === wikiId);
  if (!wiki) return;
  dragId.value = null;
  try {
    await api.put(`/wiki/items/${wikiId}`, { name: wiki.name, url: wiki.url, groupId });
    wikis.value = wikis.value.map(w => w.id !== wikiId ? w : { ...w, groupId });
    const gname = groupId === null ? "Sans groupe" : (groups.value.find(g => g.id === groupId)?.name || "");
    showToast(`« ${wiki.name} » → ${gname}`);
  } catch {}
};

// ── Groups open/close ──────────────────────────────────────────────────────
const isGroupOpen = (key) => openGroups.value.has(key);
const toggleGroup = (key) => {
  const next = new Set(openGroups.value);
  if (next.has(key)) {
    next.delete(key);
  } else {
    next.add(key);
    const group = groupedWikis.value.find(g => g.key === key);
    if (group?.id && !groupDocs.value[group.id]) loadGroupDocs(group.id);
  }
  openGroups.value = next;
};

// ── Action menu ────────────────────────────────────────────────────────────
const toggleActionMenu = (id) => { actionMenuId.value = actionMenuId.value === id ? null : id; };
const closeActionMenu = () => { actionMenuId.value = null; scMenuOpen.value = false; };

// ── Misc ───────────────────────────────────────────────────────────────────
const copyLink = (url) => {
  navigator.clipboard?.writeText(url);
  showToast("Lien copié");
};
</script>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin: -24px;
  padding: 28px 32px 48px;
  min-height: calc(100% + 48px);
  background: #f8fafc;
  box-sizing: border-box;
}

/* ── SHORTCUTS BAR ──────────── */
.shortcuts-bar {
  display: flex; align-items: center; gap: 6px;
  background: #fff; border-bottom: 1px solid #e2e8f0;
  padding: 8px 24px; flex-shrink: 0; overflow: visible;
}
.shortcuts-chips {
  display: flex; gap: 4px; align-items: center; flex: 1; flex-wrap: nowrap;
  overflow-x: auto; overflow-y: visible;
}
.shortcuts-chips::-webkit-scrollbar { height: 0; }
.shortcuts-empty { font-size: 12px; color: #94a3b8; white-space: nowrap; }
.shortcut-chip {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 5px 10px; background: #f1f5f9; border: 1px solid #e2e8f0;
  border-radius: 8px; font-size: 12px; font-weight: 600; color: #334155;
  text-decoration: none; white-space: nowrap;
  transition: background 0.12s, border-color 0.12s;
}
.shortcut-chip:hover { background: #e2e8f0; border-color: #cbd5e0; color: #0f172a; }
.shortcut-favicon { width: 14px; height: 14px; border-radius: 3px; object-fit: contain; flex-shrink: 0; }
.favicon-letter {
  width: 14px; height: 14px; border-radius: 3px; flex-shrink: 0;
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 9px; font-weight: 700; color: #fff; line-height: 1;
}
.chip-del { border: none; background: transparent; color: #94a3b8; cursor: pointer; font-size: 12px; line-height: 1; padding: 0 0 0 2px; }
.chip-del:hover { color: #dc2626; }
.shortcut-add-bar {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 24px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; flex-shrink: 0;
}
.shortcut-add-bar input {
  padding: 7px 10px; border: 1px solid #e2e8f0; border-radius: 7px;
  font-size: 13px; font-family: inherit; flex: 1; min-width: 140px; background: #fff;
}
.shortcut-add-bar input:focus { outline: none; border-color: #93c5fd; }
.sc-menu-wrap { position: relative; flex-shrink: 0; }
.sc-dots-btn {
  width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;
  border: 1px solid #e2e8f0; background: #fff; border-radius: 7px;
  cursor: pointer; color: #64748b; transition: background 0.12s, color 0.12s;
}
.sc-dots-btn svg { width: 16px; height: 16px; }
.sc-dots-btn:hover { background: #f1f5f9; color: #1e293b; }
.sc-dropdown {
  position: absolute; right: 0; top: calc(100% + 6px); z-index: 200;
  background: #fff; border: 1px solid #e2e8f0; border-radius: 8px;
  box-shadow: 0 8px 24px rgba(15,23,42,0.12); padding: 4px; min-width: 150px;
  display: flex; flex-direction: column; gap: 2px;
  animation: slideIn 0.15s ease;
}
.sc-drop-item {
  display: flex; align-items: center; gap: 8px;
  padding: 7px 10px; border: none; background: transparent;
  font-size: 13px; color: #1e293b; cursor: pointer; border-radius: 6px;
  text-align: left; font-family: inherit; width: 100%;
}
.sc-drop-item:hover { background: #f1f5f9; }
.sc-drop-item svg { width: 14px; height: 14px; flex-shrink: 0; }
.btn-primary-sm {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 7px 14px; background: #1a3a5c; color: #fff;
  border: none; border-radius: 7px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit;
}
.btn-primary-sm svg { width: 13px; height: 13px; }
.btn-primary-sm:hover { background: #2e5f8a; }

/* ── HERO ───────────────────── */
.hero { display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; flex-wrap: wrap; }
.hero-eyebrow { font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #94a3b8; margin-bottom: 6px; }
.hero-title { font-size: 26px; font-weight: 800; color: #0f2742; letter-spacing: -0.02em; margin: 0; }
.hero-sub { font-size: 14px; color: #64748b; margin: 4px 0 0; }
.hero-actions { display: flex; gap: 8px; flex-shrink: 0; }

/* ── BUTTONS ────────────────── */
.btn-primary {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 9px 16px; background: #1a3a5c; color: #fff;
  border: none; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit;
}
.btn-primary svg { width: 14px; height: 14px; }
.btn-primary:hover { background: #2e5f8a; }
.btn-ghost {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 14px; border: 1px solid #e2e8f0; background: #fff;
  border-radius: 8px; font-size: 13px; color: #475569; cursor: pointer; font-family: inherit;
}
.btn-ghost svg { width: 14px; height: 14px; }
.btn-ghost:hover { background: #f8fafc; }

/* ── SEARCH + STATS ─────────── */
.search-stats-row { display: grid; grid-template-columns: 1fr 280px; gap: 16px; align-items: center; }
.search-wrap { position: relative; }
.search-icon { position: absolute; left: 16px; top: 50%; transform: translateY(-50%); width: 18px; height: 18px; color: #94a3b8; pointer-events: none; }
.search-input {
  width: 100%; padding: 13px 48px 13px 46px; font-size: 14px;
  border: 1px solid #e2e8f0; border-radius: 12px; background: #fff;
  font-family: inherit; color: #0f172a; outline: none;
  box-shadow: 0 1px 2px rgba(15,23,42,0.04);
  transition: border-color 0.15s, box-shadow 0.15s;
}
.search-input:focus { border-color: #1a3a5c; box-shadow: 0 0 0 3px rgba(26,58,92,0.1); }
.search-clear {
  position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
  border: none; background: #f1f5f9; border-radius: 6px;
  width: 24px; height: 24px; cursor: pointer; color: #64748b; font-size: 14px;
  display: inline-flex; align-items: center; justify-content: center;
}
.search-kbd {
  position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
  font-size: 11px; padding: 3px 7px; border: 1px solid #e2e8f0;
  border-radius: 5px; color: #64748b; background: #f8fafc; font-family: monospace; pointer-events: none;
}

.stats-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.stat-card {
  background: #fff; border: 1px solid #e2e8f0; border-radius: 10px;
  padding: 12px 14px; display: flex; flex-direction: column;
}
.stat-num { font-size: 22px; font-weight: 800; color: #0f2742; letter-spacing: -0.02em; line-height: 1; }
.stat-lbl { font-size: 10px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.08em; margin-top: 6px; font-weight: 700; }

.search-hint { font-size: 13px; color: #64748b; }
.search-hint strong { color: #0f172a; }

/* ── GROUPS ─────────────────── */
.groups-list { display: flex; flex-direction: column; gap: 10px; }

.group-block {
  background: #fff; border: 1px solid #e2e8f0; border-radius: 10px;
  transition: border-color 0.15s; position: relative;
}
.group-block.drop-target { border: 2px dashed #1a3a5c; margin: -1px; }

.group-header {
  width: 100%; display: flex; align-items: center; gap: 10px;
  padding: 11px 14px; border: none; background: #f8fafc;
  cursor: pointer; text-align: left;
  border-bottom: 1px solid transparent;
  border-radius: 10px;
  transition: background 0.15s;
}
.group-block:has(.group-body) .group-header { border-radius: 10px 10px 0 0; }
.group-header:hover { background: #f1f5f9; }

.chevron-icon { width: 14px; height: 14px; color: #94a3b8; transition: transform 0.2s; flex-shrink: 0; }
.chevron-icon.open { transform: rotate(180deg); }

.group-dot {
  width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0;
  background: #1a3a5c;
}
.group-dot--ungrouped { background: #cbd5e0; }

.group-name { font-size: 15px; font-weight: 700; color: #0f172a; letter-spacing: -0.01em; }
.group-count {
  font-size: 11px; font-weight: 700; padding: 2px 8px;
  background: #e2e8f0; color: #475569; border-radius: 20px;
}
.drop-hint {
  font-size: 11px; font-weight: 600; color: #1a3a5c; padding: 2px 8px;
  background: #eff6ff; border-radius: 20px; animation: fadeIn 0.2s ease;
}
.group-header-right { flex: 1; display: flex; justify-content: flex-end; }
.group-del { color: #94a3b8; display: flex; cursor: pointer; padding: 4px; border-radius: 4px; transition: color 0.12s, background 0.12s; }
.group-del:hover { color: #dc2626; background: #fee2e2; }
.group-del svg { width: 14px; height: 14px; }

.group-body { border-top: 1px solid #e2e8f0; display: flex; }
.empty-group { padding: 16px 20px; font-size: 12px; color: #94a3b8; text-align: center; }

/* ── WIKI LIST PANEL ────────── */
.wiki-list-panel { flex: 2; min-width: 0; border-right: 1px solid #e2e8f0; }

/* ── DOCS PANEL ─────────────── */
.docs-panel {
  flex: 1; min-width: 220px; max-width: 320px;
  display: flex; flex-direction: column;
  background: #f8fafc; border-radius: 0 0 10px 0;
  transition: background 0.15s;
}
.docs-panel--over { background: #eff6ff; }

.docs-panel-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 8px 12px; border-bottom: 1px solid #e2e8f0; flex-shrink: 0;
}
.docs-panel-title {
  display: flex; align-items: center; gap: 5px;
  font-size: 11px; font-weight: 700; color: #64748b;
  text-transform: uppercase; letter-spacing: 0.08em;
}
.docs-panel-title svg { color: #94a3b8; }

.docs-add-btn {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 4px 9px; font-size: 11px; font-weight: 600;
  background: #fff; border: 1px solid #e2e8f0; border-radius: 6px;
  color: #475569; cursor: pointer; font-family: inherit;
  transition: background 0.12s, border-color 0.12s;
}
.docs-add-btn:hover { background: #f1f5f9; border-color: #cbd5e0; }
.docs-add-btn svg { width: 11px; height: 11px; }

.docs-empty-zone {
  flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 6px; padding: 20px 12px; color: #94a3b8; font-size: 11px; text-align: center;
  pointer-events: none;
}

.docs-file-list { display: flex; flex-direction: column; overflow-y: auto; flex: 1; }

.doc-item {
  display: flex; align-items: center; gap: 6px;
  padding: 6px 12px; border-bottom: 1px solid #f1f5f9;
  transition: background 0.1s;
}
.doc-item:last-child { border-bottom: none; }
.doc-item:hover { background: #f1f5f9; }

.doc-file-icon { width: 13px; height: 13px; color: #94a3b8; flex-shrink: 0; }
.doc-name {
  flex: 1; font-size: 11.5px; color: #334155; font-weight: 500;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0;
}
.doc-size { font-size: 10px; color: #94a3b8; white-space: nowrap; flex-shrink: 0; }

.doc-actions { display: flex; gap: 2px; flex-shrink: 0; }
.doc-action-btn {
  width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;
  border: none; background: transparent; border-radius: 5px;
  cursor: pointer; color: #94a3b8; transition: background 0.1s, color 0.1s;
}
.doc-action-btn:hover { background: #e2e8f0; color: #475569; }
.doc-action-btn svg { width: 13px; height: 13px; }
.doc-action-danger:hover { background: #fee2e2; color: #dc2626; }

/* ── WIKI ROWS ──────────────── */
.wiki-row {
  display: grid;
  grid-template-columns: 20px 20px 1fr auto auto;
  gap: 12px; align-items: center;
  padding: 10px 16px;
  border-top: 1px solid #f1f5f9;
  transition: background 0.12s;
  cursor: grab;
}
.wiki-row--first { border-top: none; }
.wiki-row:hover { background: #f8fbff; }
.wiki-row--dragging { background: #eff6ff; opacity: 0.5; }

.drag-handle { color: transparent; display: flex; transition: color 0.12s; cursor: grab; }
.wiki-row:hover .drag-handle { color: #cbd5e0; }
.drag-handle svg { width: 14px; height: 14px; }

.wiki-favicon { width: 18px; height: 18px; border-radius: 3px; object-fit: contain; flex-shrink: 0; }
.wiki-favicon-letter {
  width: 18px; height: 18px; border-radius: 4px; flex-shrink: 0;
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 10px; font-weight: 700; color: #fff; line-height: 1;
}

.wiki-info { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.wiki-name { font-size: 12.5px; font-weight: 600; color: #334155; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.wiki-url {
  font-size: 11px; color: #94a3b8; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  opacity: 0; transition: opacity 0.15s; font-family: 'Courier New', monospace;
}
.wiki-row:hover .wiki-url { opacity: 1; }

.btn-open {
  display: inline-flex; align-items: center; gap: 5px;
  font-size: 12px; font-weight: 600; color: #1a3a5c;
  text-decoration: none; padding: 6px 10px;
  border: 1px solid #e2e8f0; border-radius: 6px; white-space: nowrap;
  background: #fff; transition: background 0.12s, border-color 0.12s;
}
.btn-open:hover { background: #eff6ff; border-color: #93c5fd; }
.btn-open svg { width: 12px; height: 12px; }

.wiki-actions { position: relative; display: flex; align-items: center; }
.action-dots {
  width: 30px; height: 30px; display: flex; align-items: center; justify-content: center;
  border: none; background: transparent; border-radius: 6px; cursor: pointer; color: #94a3b8;
  transition: background 0.12s, color 0.12s;
}
.action-dots:hover { background: #f1f5f9; color: #1e293b; }
.action-dots svg { width: 16px; height: 16px; }

.action-menu {
  position: absolute; right: 0; top: calc(100% + 4px); z-index: 50;
  background: #fff; border: 1px solid #e2e8f0; border-radius: 8px;
  box-shadow: 0 10px 30px rgba(15,23,42,0.12); padding: 4px; min-width: 170px;
  display: flex; flex-direction: column; gap: 2px;
  animation: slideIn 0.15s ease;
}
.action-item {
  display: flex; align-items: center; gap: 8px;
  padding: 7px 10px; border: none; background: transparent;
  font-size: 13px; color: #1e293b; cursor: pointer; border-radius: 6px;
  text-align: left; font-family: inherit;
}
.action-item:hover { background: #f1f5f9; }
.action-item svg { width: 14px; height: 14px; }
.action-item-danger { color: #dc2626; }
.action-item-danger:hover { background: #fee2e2; }
.action-divider { height: 1px; background: #f1f5f9; margin: 2px 4px; }

/* ── EMPTY STATES ───────────── */
.empty-state {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 12px; padding: 60px 24px; color: #94a3b8; font-size: 14px; text-align: center;
}
.empty-state svg { width: 56px; height: 56px; }

/* ── MODAL ──────────────────── */
.overlay {
  position: fixed; inset: 0; background: rgba(15,23,42,0.4);
  display: flex; align-items: center; justify-content: center; z-index: 200; padding: 24px;
  animation: fadeIn 0.15s ease;
}
.modal {
  background: #fff; border-radius: 14px; width: 500px; max-width: 100%;
  box-shadow: 0 24px 60px rgba(15,23,42,0.25);
  display: flex; flex-direction: column;
  animation: scaleIn 0.18s ease;
}
.modal-sm { width: 380px; }
.modal-head {
  display: flex; align-items: flex-start; justify-content: space-between;
  padding: 20px 22px 14px; border-bottom: 1px solid #f1f5f9; gap: 12px;
}
.modal-title { font-size: 17px; font-weight: 700; color: #0f2742; margin: 0; }
.modal-sub { font-size: 13px; color: #64748b; margin: 4px 0 0; }
.close-btn { border: none; background: none; font-size: 17px; color: #94a3b8; cursor: pointer; line-height: 1; padding: 2px; }
.close-btn:hover { color: #1e293b; }
.modal-body { padding: 18px 22px; display: flex; flex-direction: column; gap: 14px; }
.modal-foot { display: flex; gap: 8px; padding-top: 6px; }
.form-error { font-size: 12px; color: #dc2626; margin: 0; }

.field { display: flex; flex-direction: column; gap: 5px; }
.field > span { font-size: 12px; font-weight: 600; color: #475569; }
.field input, .field select {
  padding: 9px 12px; border: 1px solid #e2e8f0; border-radius: 8px;
  font-size: 13px; background: #f8fafc; color: #1e293b; font-family: inherit;
}
.field input:focus, .field select:focus { outline: none; border-color: #1a3a5c; background: #fff; }
.url-input-wrap {
  display: flex; align-items: center;
  border: 1px solid #e2e8f0; border-radius: 8px; background: #f8fafc; overflow: hidden;
}
.url-input-wrap:focus-within { border-color: #1a3a5c; background: #fff; }
.url-prefix { padding: 9px 10px; font-size: 12px; color: #94a3b8; font-weight: 600; border-right: 1px solid #e2e8f0; white-space: nowrap; }
.url-input-wrap input { border: none; background: transparent; padding: 9px 12px; font-size: 13px; flex: 1; outline: none; font-family: inherit; }

/* ── TOAST ──────────────────── */
.toast {
  position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
  padding: 11px 20px; border-radius: 10px; font-size: 13px; font-weight: 600;
  box-shadow: 0 8px 24px rgba(0,0,0,0.15); z-index: 500; white-space: nowrap;
}
.toast--ok   { background: #0f2742; color: #fff; }
.toast--warn { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }

.toast-enter-active, .toast-leave-active { transition: opacity 0.25s, transform 0.25s; }
.toast-enter-from { opacity: 0; transform: translateX(-50%) translateY(8px); }
.toast-leave-to  { opacity: 0; transform: translateX(-50%) translateY(8px); }

/* ── ANIMATIONS ─────────────── */
@keyframes fadeIn  { from { opacity: 0 } to { opacity: 1 } }
@keyframes scaleIn { from { opacity: 0; transform: scale(0.96) } to { opacity: 1; transform: scale(1) } }
@keyframes slideIn { from { opacity: 0; transform: translateY(-4px) } to { opacity: 1; transform: translateY(0) } }
</style>

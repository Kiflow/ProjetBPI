<template>
  <div class="dashboard">
    <p v-if="!fileLoaded">
      Glisser-déposer un fichier CSV pour ajouter des tickets :
    </p>
    <p class="hint">
      Colonnes attendues (ligne d'en-tête): Numero ticket, Objet, Priorité,
      Priorité RMS, Date promis pour, Échéance, ID externe, Code Client, Compte,
      Proprietaire, Statut, Categorie, Classification BU
    </p>

    <div
      v-if="!fileLoaded"
      class="drop-zone"
      @dragover.prevent
      @dragenter.prevent
      @drop.prevent="handleDrop"
    >
      <p>Déposez votre fichier CSV ici</p>
      <p v-if="fileName" class="file-name">Fichier sélectionné: {{ fileName }}</p>
      <button type="button" class="choose-button" @click="openFilePicker">
        Choisir un fichier
      </button>
      <button
        type="button"
        class="read-button"
        :disabled="!selectedFile"
        @click="readSelectedFile"
      >
        Lire le fichier
      </button>
      <input
        ref="fileInput"
        type="file"
        accept=".csv"
        @change="handleFile"
      />
    </div>

    <div v-else class="loaded">
      <p class="success">
        Fichier chargé avec succès. Nombre de tickets: {{ ticketsCount }}
      </p>
      <button type="button" class="choose-button" @click="loadNewFile">
        Charger un nouveau fichier
      </button>
      <input
        ref="fileInput"
        type="file"
        accept=".csv"
        @change="handleFile"
      />
    </div>

    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import * as XLSX from "xlsx";

const tickets = ref([]);
const fileName = ref("");
const errorMessage = ref("");
const fileInput = ref(null);
const selectedFile = ref(null);
const fileLoaded = ref(false);

const ticketsCount = computed(() => tickets.value.length);

const handleFile = (event) => {
  const file = event.target.files[0];
  if (!file) return;
  fileName.value = file.name;
  selectedFile.value = file;
  tickets.value = [];
  errorMessage.value = "";
  event.target.value = "";
};

const handleDrop = (event) => {
  const file = event.dataTransfer.files[0];
  if (!file) return;
  fileName.value = file.name;
  selectedFile.value = file;
  tickets.value = [];
  errorMessage.value = "";
  fileLoaded.value = false;
};

const openFilePicker = () => {
  if (fileInput.value) {
    fileInput.value.click();
  }
};

const readSelectedFile = () => {
  if (!selectedFile.value) return;
  readExcel(selectedFile.value);
};

const loadNewFile = () => {
  tickets.value = [];
  fileName.value = "";
  errorMessage.value = "";
  selectedFile.value = null;
  fileLoaded.value = false;
  if (fileInput.value) {
    fileInput.value.value = "";
    fileInput.value.click();
  }
};

const readExcel = (file) => {
  errorMessage.value = "";
  const isCsv =
    file.type === "text/csv" || file.name.toLowerCase().endsWith(".csv");

  if (!isCsv) {
    errorMessage.value = "Veuillez déposer un fichier CSV (.csv).";
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const data = e.target.result;
    const workbook = XLSX.read(data, { type: "string" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
    tickets.value = rows.map((row) => {
      const priorite =
        row.Priorite ??
        row["Priorité"] ??
        row.priorite ??
        row["priorité"] ??
        "";
      const statut =
        row.Statut ??
        row["Statut"] ??
        row.Status ??
        row["Status"] ??
        row["État"] ??
        row["Etat"] ??
        "";
      return {
        NumeroTicket:
          row["Numero ticket"] ??
          row["Numéro ticket"] ??
          row["numero ticket"] ??
          row["numéro ticket"] ??
          row["Numero Ticket"] ??
          row["Numéro Ticket"] ??
          row["numero Ticket"] ??
          row["numéro Ticket"] ??
          "",
        Objet: row.Objet ?? row.objet ?? "",
        Priorite: priorite,
        DatePromisPour:
          row["Date Promis pour"] ??
          "",
        Echeance: row.Echeance ?? row["Échéance"] ?? row.echeance ?? "",
        IdExterne:
          row["ID externe"] ??
          row["Id externe"] ??
          row["id externe"] ??
          row["ID Externe"] ??
          row["Id Externe"] ??
          row["id Externe"] ??
          row.IdExterne ??
          row.idExterne ??
          "",
        CodeClient:
          row["Code Client"] ??
          row["Code client"] ??
          row["code client"] ??
          row.CodeClient ??
          row.codeClient ??
          row["Numero PAC"] ??
          row["Numéro PAC"] ??
          row["numero pac"] ??
          row["numéro pac"] ??
          row["Numero Pac"] ??
          row["Numéro Pac"] ??
          row.NumeroPac ??
          row.numeroPac ??
          row.PAC ??
          row.pac ??
          "",
        Compte:
          row.Compte ??
          row.compte ??
          row.Client ??
          row.client ??
          "",
        Categorie:
          row.Categorie ??
          row["Catégorie"] ??
          row.categorie ??
          row["catégorie"] ??
          row["Categorie"] ??
          row["categorie"] ??
          "",
        ClassificationBU:
          row["Classification BU"] ??
          row["classification BU"] ??
          row["classification bu"] ??
          row.ClassificationBU ??
          row.classificationBU ??
          "",
        Proprietaire:
          row.Proprietaire ??
          row["Propriétaire"] ??
          row.proprietaire ??
          row["propriétaire"] ??
          "",
        Statut: statut,
      };
    });
    localStorage.setItem("tickets", JSON.stringify(tickets.value));
    fileLoaded.value = true;
  };
  reader.onerror = () => {
    errorMessage.value =
      "Impossible de lire le fichier. Vérifiez qu'il n'est pas corrompu.";
  };
  reader.readAsText(file);
};
</script>

<style scoped>
.dashboard {
  padding: 24px;
  background-color: #ffffff;
  min-height: 100vh;
}

.drop-zone {
  border: 2px dashed #0052cc;
  border-radius: 6px;
  padding: 40px;
  text-align: center;
  color: #0052cc;
  margin-bottom: 24px;
  cursor: pointer;
  background-color: #deebff;
  transition: background 0.2s;
}

.drop-zone:hover {
  background-color: #cfe0ff;
}

.drop-zone input {
  display: none;
}

.file-name {
  margin-top: 8px;
  color: #243b53;
}

.choose-button {
  margin-top: 12px;
  background: #0052cc;
  color: #ffffff;
  border: none;
  padding: 8px 14px;
  border-radius: 4px;
  cursor: pointer;
}

.choose-button:hover {
  background: #0041a3;
}

.read-button {
  margin-left: 8px;
  margin-top: 12px;
  background: #1f6f43;
  color: #ffffff;
  border: none;
  padding: 8px 14px;
  border-radius: 4px;
  cursor: pointer;
}

.read-button:hover {
  background: #185b36;
}

.read-button:disabled {
  background: #8fb39d;
  cursor: not-allowed;
}

.loaded {
  margin-top: 12px;
}

.loaded input {
  display: none;
}

.success {
  color: #1f6f43;
  margin-bottom: 12px;
}

.hint {
  margin-top: 6px;
  color: #243b53;
}

.error {
  color: #d14343;
  margin-bottom: 16px;
}

.ticket-list {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.ticket-card {
  background: white;
  border-radius: 6px;
  padding: 16px;
  width: 220px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}
</style>

<template>
  <div class="dashboard">
    <p>Glisser-déposer un fichier Excel pour ajouter des tickets :</p>
    <p class="hint">
      Colonnes attendues (ligne d'en-tête): Numero ticket, Objet, Criticité,
      Priorité RMS, Date promis pour, Échéance, ID externe, Code Client, Compte,
      Proprietaire
    </p>

    <div
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

    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>

    <div v-if="tickets.length" class="ticket-list">
      <div
        v-for="ticket in tickets"
        :key="ticket.NumeroTicket"
        class="ticket-card"
      >
        <h3>{{ ticket.Objet }}</h3>
        <p>Numéro ticket: {{ ticket.NumeroTicket }}</p>
        <p>Criticité: {{ ticket.Criticite }}</p>
        <p>Priorité RMS: {{ ticket.PrioriteRms }}</p>
        <p>Date promis pour: {{ ticket.DatePromisPour }}</p>
        <p>Échéance: {{ ticket.Echeance }}</p>
        <p>ID externe: {{ ticket.IdExterne }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import * as XLSX from "xlsx";

const tickets = ref([]);
const fileName = ref("");
const errorMessage = ref("");
const fileInput = ref(null);
const selectedFile = ref(null);

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
      const criticite =
        row.Criticite ?? row["Criticité"] ?? row.criticite ?? "";
      const priorite =
        row.Priorite ?? row["Priorité"] ?? row.priorite ?? criticite ?? "";
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
        Criticite: criticite,
        Priorite: priorite,
        PrioriteRms:
          row["Priorité RMS"] ??
          row["Priorite RMS"] ??
          row.PrioriteRms ??
          row.prioriteRms ??
          row["priorité rms"] ??
          row["priorite rms"] ??
          "",
        DatePromisPour:
          row["Date promis pour"] ??
          row["Date Promis Pour"] ??
          row.DatePromisPour ??
          row.datePromisPour ??
          row["date promis pour"] ??
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
        Proprietaire:
          row.Proprietaire ??
          row["Propriétaire"] ??
          row.proprietaire ??
          row["propriétaire"] ??
          "",
      };
    });
    localStorage.setItem("tickets", JSON.stringify(tickets.value));
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

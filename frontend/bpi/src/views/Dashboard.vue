<template>
  <div class="dashboard">
    <h1>Tableau de suivi des tickets</h1>

    <p>Glisser-déposer un fichier Excel pour ajouter des tickets :</p>

    <div
      class="drop-zone"
      @dragover.prevent
      @dragenter.prevent
      @drop.prevent="handleDrop"
    >
      <p>Déposez votre fichier Excel ici</p>
      <input type="file" @change="handleFile" />
    </div>

    <div v-if="tickets.length" class="ticket-list">
      <div v-for="ticket in tickets" :key="ticket.ID" class="ticket-card">
        <h3>{{ ticket.Sujet }}</h3>
        <p>Criticité: {{ ticket.Criticité }}</p>
        <p>Échéance: {{ ticket.Echeance }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import * as XLSX from "xlsx";

const tickets = ref([]);

const handleFile = (event) => {
  const file = event.target.files[0];
  readExcel(file);
};

const handleDrop = (event) => {
  const file = event.dataTransfer.files[0];
  readExcel(file);
};

const readExcel = (file) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    tickets.value = XLSX.utils.sheet_to_json(sheet);
  };
  reader.readAsArrayBuffer(file);
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

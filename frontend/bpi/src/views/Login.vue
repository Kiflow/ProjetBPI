<template>
  <div class="login-page">
    <div class="login-card">
      <div class="header">
        <h1>Backlog Dashboard</h1>
      </div>

      <form @submit.prevent="login">
        <div class="field">
          <label>ID utilisateur</label>
          <input
            v-model="userId"
            type="text"
            placeholder="id.utilisateur"
            required
          />
        </div>

        <div class="field">
          <label>Mot de passe</label>
          <input
            v-model="password"
            type="password"
            placeholder="********"
            required
          />
        </div>

        <button type="submit" :disabled="loading">
          {{ loading ? "Connexion..." : "Se connecter" }}
        </button>
      </form>

      <div class="footer">
        <small>Acces reserve aux collaborateurs ADP</small>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import api from "../services/api";

const router = useRouter();

const userId = ref("");
const password = ref("");
const loading = ref(false);

const login = async () => {
  try {
    loading.value = true;

    const res = await api.post("/auth/login", {
      userId: userId.value,
      password: password.value
    });

    localStorage.setItem("token", res.data.token);
    localStorage.setItem("user", JSON.stringify(res.data.user));
    window.dispatchEvent(new Event("auth-changed"));
    router.push("/");
  } catch (e) {
    console.error("[login] Erreur login:", e);
    if (e?.response) {
      console.error("[login] Response:", e.response.status, e.response.data);
    }
    alert("Identifiants incorrects");
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.login-page {
  height: 100vh;
  background: linear-gradient(135deg, #deebff, #f4f5f7);
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-card {
  background: white;
  width: 380px;
  padding: 32px;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(9, 30, 66, 0.15);
}

.header {
  text-align: center;
  margin-bottom: 24px;
}

.header h1 {
  color: #0052cc;
  font-size: 22px;
  margin-bottom: 6px;
}

.header p {
  color: #6b778c;
  font-size: 14px;
}

.field {
  margin-bottom: 16px;
}

.field label {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  color: #172b4d;
}

.field input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #dfe1e6;
  border-radius: 4px;
  font-size: 14px;
}

.field input:focus {
  outline: none;
  border-color: #4c9aff;
  box-shadow: 0 0 0 2px #deebff;
}

button {
  width: 100%;
  padding: 12px;
  background-color: #0052cc;
  color: white;
  border: none;
  border-radius: 4px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease;
}

button:hover {
  background-color: #0747a6;
}

button:disabled {
  background-color: #b3d4ff;
  cursor: not-allowed;
}

.footer {
  text-align: center;
  margin-top: 20px;
  color: #6b778c;
}
</style>

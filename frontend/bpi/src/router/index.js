import { createRouter, createWebHistory } from "vue-router";
import Dashboard from "../views/Dashboard.vue";
import Login from "../views/Login.vue";
import Tickets from "../views/Tickets.vue";
import CentralisationDemande from "../views/CentralisationDemande.vue";
import PrioriteRms from "../views/PrioriteRms.vue";
import Habilitation from "../views/Habilitation.vue";
import Permanence from "../views/Permanence.vue";
import ClientPlanAction from "../views/ClientPlanAction.vue";
import ClientSensible from "../views/ClientSensible.vue";
import Facturation from "../views/Facturation.vue";
import Wiki from "../views/Wiki.vue";
import UtilitaireTodo from "../views/UtilitaireTodo.vue";

const routes = [
  { path: "/login", component: Login },
  { path: "/", component: Dashboard, meta: { requiresAuth: true } },
  { path: "/tickets", component: Tickets, meta: { requiresAuth: true } },
  {
    path: "/centralisation-demande",
    component: CentralisationDemande,
    meta: { requiresAuth: true }
  },
  {
    path: "/priorite-rms",
    component: PrioriteRms,
    meta: { requiresAuth: true }
  },
  {
    path: "/habilitation",
    component: Habilitation,
    meta: { requiresAuth: true }
  },
  {
    path: "/permanence",
    component: Permanence,
    meta: { requiresAuth: true }
  },
  {
    path: "/client-plan-action",
    component: ClientPlanAction,
    meta: { requiresAuth: true }
  },
  {
    path: "/client-sensible",
    component: ClientSensible,
    meta: { requiresAuth: true }
  },
  {
    path: "/facturation",
    component: Facturation,
    meta: { requiresAuth: true }
  },
  {
    path: "/wiki",
    component: Wiki,
    meta: { requiresAuth: true, title: "Mes wikis" }
  },
  {
    path: "/utilitaire-todo",
    component: UtilitaireTodo,
    meta: { requiresAuth: true, title: "To-do cockpit" }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach((to, from, next) => {
  const isAuth = !!localStorage.getItem("token");
  if (to.meta.requiresAuth && !isAuth) return next("/login");
  if (to.path === "/login" && isAuth) return next("/");
  next();
});

router.afterEach((to) => {
  const baseTitle = "BPI";
  const pageTitle = to.meta?.title ? `${to.meta.title} | ${baseTitle}` : baseTitle;
  document.title = pageTitle;
});

export default router;

import { createRouter, createWebHistory } from "vue-router";

import Login from "./views/Login.vue";
import RoleSelection from "./views/RoleSelection.vue";
import EmployerDashboard from "./views/EmployerDashboard.vue";
import EmployerSchedule from "./views/EmployerSchedule.vue";
import EmployerEmployees from "./views/EmployerEmployees.vue";
import EmployerTaskLists from "./views/EmployerTaskLists.vue";
import EmployerSettings from "./views/EmployerSettings.vue";
import EmployeeDashboard from "./views/EmployeeDashboard.vue";
import EmployeeSchedule from "./views/EmployeeSchedule.vue";
import EmployeeAvailability from "./views/EmployeeAvailability.vue";
import EmployeeTradeboard from "./views/EmployeeTradeboard.vue";
import EmployeeSettings from "./views/EmployeeSettings.vue";
import EmployerCreateProfile from "./views/EmployerCreateProfile.vue";
import EmployeeCreateProfile from "./views/EmployeeCreateProfile.vue";
import Utils from "./config/utils.js";
import EmployerTradeboard from "./views/EmployerTradeboard.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  linkExactActiveClass: "active",
  routes: [
    {
      path: "/login",
      alias: "/",
      name: "login",
      component: Login,
    },
    {
      path: "/roles",
      name: "roleSelection",
      component: RoleSelection,
    },
    {
      path: "/onboarding/employer",
      name: "employerCreateProfile",
      component: EmployerCreateProfile,
    },
    {
      path: "/onboarding/employee",
      name: "employeeCreateProfile",
      component: EmployeeCreateProfile,
    },
    {
      path: "/employer",
      name: "employerDashboard",
      component: EmployerDashboard,
      redirect: { name: "employerSchedule" },
      children: [
        {
          path: "schedule",
          name: "employerSchedule",
          component: EmployerSchedule,
        },
        {
          path: "employees",
          name: "employerEmployees",
          component: EmployerEmployees,
        },
        {
          path: "trades",
          name: "tradeRequestShifts",
          component: EmployerTradeboard,
        },
        {
          path: "tasklists",
          name: "employerTaskLists",
          component: EmployerTaskLists,
        },
        {
          path: "settings",
          name: "employerSettings",
          component: EmployerSettings,
        },
      ],
    },
    {
      path: "/employee",
      name: "employeeDashboard",
      component: EmployeeDashboard,
      redirect: { name: "employeeSchedule" },
      children: [
        {
          path: "schedule",
          name: "employeeSchedule",
          component: EmployeeSchedule,
        },
        {
          path: "availability",
          name: "employeeAvailability",
          component: EmployeeAvailability,
        },
        {
          path: "trades",
          name: "employeeTradeboard",
          component: EmployeeTradeboard,
        },
        {
          path: "settings",
          name: "employeeSettings",
          component: EmployeeSettings,
        },
      ],
    },
  ],
});

router.beforeEach((to, from, next) => {
  const user = Utils.getStore("user");
  const isLoggedIn = Boolean(user && user.token);

  if (to.name !== "login" && !isLoggedIn) {
    next({ name: "login" });
    return;
  }

  next();
});

export default router;

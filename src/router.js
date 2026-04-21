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
import AdminLogin from "./views/AdminLogin.vue";
import AdminDashboard from "./views/AdminDashboard.vue";
import EmployeeTimeClock from "./views/EmployeeTimeClock.vue";
import EmployerTimecards from "./views/EmployerTimecards.vue";

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
      path: "/adminLogin",
      name: "adminLogin",
      component: AdminLogin,
    },
    {
      path: "/adminDashboard",
      name: "adminDashboard",
      component: AdminDashboard,
    },
    {
      path: "/roles",
      name: "roleSelection",
      component: RoleSelection,
    },
    {
      path: "/onboarding/employer",
      name: "employerCreateProfile",
      meta: { appRole: "employer" },
      component: EmployerCreateProfile,
    },
    {
      path: "/onboarding/employee",
      name: "employeeCreateProfile",
      meta: { appRole: "employee" },
      component: EmployeeCreateProfile,
    },
    {
      path: "/employer",
      name: "employerDashboard",
      meta: { appRole: "employer" },
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
          path: "timecards",
          name: "employerTimecards",
          component: EmployerTimecards,
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
      meta: { appRole: "employee" },
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
        {
          path: "timeclock",
          name: "employeeTimeClock",
          component: EmployeeTimeClock,
        },
      ],
    },
  ],
});

router.beforeEach((to, from, next) => {
  const user = Utils.getStore("user");
  const isLoggedIn = Boolean(user && user.token);

  // 1. Always allow access to login pages
  if (to.name === "adminLogin" || to.name === "login") {
    // If already logged in, skip login and go to the best landing route.
    if (isLoggedIn) {
      next(Utils.getDefaultRouteForUser(user));
    } else {
      next();
    }
    return;
  }

  // 2. Protect all other routes
  if (!isLoggedIn) {
    next({ name: "login" });
  } else {
    // 3. Optional: Prevent workers from manualy typing /adminDashboard in the URL
    if (to.name === "adminDashboard" && !user.isAdmin) {
      next(Utils.getDefaultRouteForUser(user));
    } else {
      next();
    }
  }
});

router.afterEach((to) => {
  const user = Utils.getStore("user");

  if (!user?.token || user.isAdmin) {
    return;
  }

  const selectedRole = to.matched.find((record) => record.meta?.appRole)?.meta
    ?.appRole;

  if (selectedRole) {
    Utils.setLastSelectedRole(user.userId, selectedRole);
  }
});

export default router;

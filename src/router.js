import Vue from "vue";
import Router from "vue-router";

import RoleSelection from "./views/RoleSelection.vue";
import EmployerDashboard from "./views/EmployerDashboard.vue";
import EmployerSchedule from "./views/EmployerSchedule.vue";
import EmployerEmployees from "./views/EmployerEmployees.vue";
import EmployerTaskLists from "./views/EmployerTaskLists.vue";
import EmployerSettings from "./views/EmployerSettings.vue";
import EmployeeDashboard from "./views/EmployeeDashboard.vue";
import EmployerTradeboard from "./views/EmployerTradeboard.vue";

Vue.use(Router);

const router = new Router({
  mode: "history",
  linkExactActiveClass: "active",
  base:
    //    process.env.NODE_ENV === 'development'? "/" : "/tutorScheduling/", - for AWS
    process.env.NODE_ENV === "development" ? "/" : "/tutorial-frontend-vue2",
  routes: [
    {
      path: "/",
      name: "roleSelection",
      component: RoleSelection,
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
          path: 'trades',
          name: 'tradeRequestShifts',
          component: EmployerTradeboard, // The new file we wrote!
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
    },
  ],
});

export default router;

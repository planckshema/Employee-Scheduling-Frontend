import Vue from "vue";
import Router from "vue-router";

import Login from "./views/Login.vue";

import TutorialsList from "./views/TutorialsList.vue";
import EditTutorial from "./views/EditTutorial.vue";
import AddTutorial from "./views/AddTutorial.vue";
import ViewTutorial from "./views/ViewTutorial.vue";
import AddLesson from "./views/AddLesson.vue";
import EditLesson from "./views/EditLesson.vue";

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

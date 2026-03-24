<template>
  <div class="dashboard-page">
    <header class="header">
      <div>
        <h1>Employer Dashboard</h1>
        <p>Manage your team's schedule</p>
      </div>
      <button class="ghost-button" @click="$router.push({ name: 'employeeDashboard' })">
        Switch View
      </button>
    </header>

    <nav class="tabs">
      <button v-for="tab in tabs" :key="tab.key" :class="['tab', { active: currentTab === tab.key }]"
        @click="$router.push({ name: tab.routeName })">
        <v-icon size="18">{{ tab.icon }}</v-icon>
        {{ tab.label }}
      </button>
    </nav>

    <router-view />
  </div>
</template>

<script>
export default {
  name: "EmployerDashboard",
  data() {
    return {
      tabs: [
        {
          key: "schedule",
          label: "Schedule",
          icon: "mdi-calendar-month-outline",
          routeName: "employerSchedule",
        },
        {
          key: "employees",
          label: "Employees",
          icon: "mdi-account-group-outline",
          routeName: "employerEmployees",
        },
        {
          key: "trades", // New Key
          label: "Trade Board",
          icon: "mdi-swap-horizontal", // New Icon
          routeName: "tradeRequestShifts", // Ensure this matches your router/index.js name
        },
        {
          key: "taskLists",
          label: "Task Lists",
          icon: "mdi-clipboard-text-outline",
          routeName: "employerTaskLists",
        },
        {
          key: "settings",
          label: "Settings",
          icon: "mdi-cog-outline",
          routeName: "employerSettings",
        },
      ],
    };
  },
  computed: {
    currentTab() {
      const map = {
        employerSchedule: "schedule",
        employerEmployees: "employees",
        tradeRequestShifts: "trades",
        employerTaskLists: "taskLists",
        employerSettings: "settings",
      };
      return map[this.$route.name] || "schedule";
    },
  },
  created() {
    if (this.$route.name === "employerDashboard") {
      this.$router.replace({ name: "employerSchedule" });
    }
  },
};
</script>

<style scoped>
.dashboard-page {
  min-height: 100vh;
  background: #f3f5f8;
  color: #151d2d;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: #fff;
  border-bottom: 1px solid #e5e8ef;
}

h1 {
  margin: 0;
  font-size: 42px;
}

p {
  margin: 0;
}

.tabs {
  display: inline-flex;
  background: #e8ebf2;
  border-radius: 14px;
  margin: 20px;
  gap: 2px;
  padding: 4px;
}

.tab {
  border: none;
  background: transparent;
  padding: 10px 14px;
  border-radius: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.tab.active {
  background: #fff;
}

.ghost-button {
  border-radius: 12px;
  padding: 11px 16px;
  font-weight: 700;
  border: 1px solid #d7dceb;
  background: #fff;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

@media (max-width: 980px) {
  h1 {
    font-size: 34px;
  }

  .tabs {
    margin: 14px;
    width: calc(100% - 28px);
    overflow-x: auto;
    display: flex;
  }
}
</style>

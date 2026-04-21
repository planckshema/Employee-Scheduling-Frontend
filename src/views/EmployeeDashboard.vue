<template>
  <div class="dashboard-page">
    <section class="dashboard-shell">
      <header class="header">
        <div class="title-block">
          <p class="eyebrow">Employee Workspace</p>
          <h1>{{ headingTitle }}</h1>
          <p>{{ headingSubtitle }}</p>
        </div>
        <button class="ghost-button" @click="$router.push({ name: 'employerDashboard' })">
          Switch View
        </button>
      </header>

      <nav class="tabs">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          :class="['tab', { active: currentTab === tab.key }]"
          @click="$router.push({ name: tab.routeName })"
        >
          <v-icon size="18">{{ tab.icon }}</v-icon>
          {{ tab.label }}
        </button>
      </nav>
    </section>

    <router-view />
  </div>
</template>

<script>
import EmployeeServices from "@/services/employeeServices";

export default {
  name: "EmployeeDashboard",
  data() {
    return {
      employeeProfile: null,
      tabs: [
        {
          key: "schedule",
          label: "Schedule",
          icon: "mdi-calendar-month-outline",
          routeName: "employeeSchedule",
        },
        {
          key: "availability",
          label: "Availability",
          icon: "mdi-clock-outline",
          routeName: "employeeAvailability",
        },
        {
          key: "tradeboard",
          label: "Trade Board",
          icon: "mdi-swap-horizontal",
          routeName: "employeeTradeboard",
        },
        {
          key: "settings",
          label: "Settings",
          icon: "mdi-cog-outline",
          routeName: "employeeSettings",
        },
        {
          key: "timeclock",
          label: "Clock In/Clock Out",
          icon: "mdi-timer-outline",
          routeName: "employeeTimeClock",
        },
      ],
    };
  },
  computed: {
    currentUser() {
      return this.$store.getters.getLoginUserInfo || {};
    },
    headingTitle() {
      if (!this.employeeProfile) {
        return "Employee Workspace";
      }
      return [this.employeeProfile.firstName, this.employeeProfile.lastName].filter(Boolean).join(" ").trim() || "Employee Workspace";
    },
    headingSubtitle() {
      const school = this.employeeProfile?.school;
      const schoolYear = this.employeeProfile?.schoolYear;
      if (school && schoolYear) {
        return `${schoolYear} at ${school}`;
      }
      if (school) {
        return school;
      }
      return "Manage your schedule, availability, and shift activity.";
    },
    currentTab() {
      const map = {
        employeeSchedule: "schedule",
        employeeAvailability: "availability",
        employeeTradeboard: "tradeboard",
        employeeTimeClock: "timeclock",
        employeeSettings: "settings",

      };
      return map[this.$route.name] || "schedule";
    },
  },
  async created() {
    if (this.$route.name === "employeeDashboard") {
      this.$router.replace({ name: "employeeSchedule" });
    }

    if (this.currentUser?.userId) {
      try {
        const { data } = await EmployeeServices.getEmployeeProfile(this.currentUser.userId);
        this.employeeProfile = data || null;
      } catch (error) {
        this.employeeProfile = null;
      }
    }
  },
};
</script>

<style scoped>
.dashboard-page {
  min-height: 100vh;
  background:
    radial-gradient(circle at top left, rgba(123, 201, 111, 0.14), transparent 22%),
    linear-gradient(180deg, #f8fcf7 0%, var(--app-bg) 100%);
  color: var(--app-text);
  padding: 20px 28px 0;
}

.dashboard-shell {
  max-width: 1380px;
  margin: 0 auto 18px;
  border: 1px solid var(--app-border);
  border-radius: 30px;
  background: rgba(255, 254, 251, 0.92);
  box-shadow: var(--app-shadow-md);
  overflow: hidden;
  backdrop-filter: blur(10px);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 28px 30px 18px;
}

h1 {
  margin: 0;
  font-size: 44px;
  line-height: 1;
  letter-spacing: -0.04em;
}

.title-block p {
  margin: 0;
  color: var(--app-text-soft);
  line-height: 1.6;
}

.eyebrow {
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 12px;
  font-weight: 800;
  color: var(--app-secondary);
}

.tabs {
  display: flex;
  gap: 8px;
  padding: 16px 22px 22px;
  border-top: 1px solid rgba(184, 207, 180, 0.58);
  flex-wrap: wrap;
}

.tab {
  border: 1px solid transparent;
  background: rgba(235, 244, 233, 0.9);
  color: var(--app-text-soft);
  padding: 11px 16px;
  border-radius: 16px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 8px;
}

.tab.active {
  background: var(--app-surface);
  color: var(--app-primary);
  box-shadow: 0 12px 24px rgba(36, 74, 46, 0.08);
  border-color: var(--app-border);
}

.ghost-button {
  border-radius: 14px;
  padding: 12px 18px;
  font-weight: 700;
  border: 1px solid var(--app-border);
  background: rgba(255, 254, 251, 0.94);
  color: var(--app-text);
  display: inline-flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 14px 26px rgba(36, 74, 46, 0.06);
}

@media (max-width: 980px) {
  .dashboard-page {
    padding: 12px 14px 0;
  }

  .header {
    padding: 18px 16px 14px;
    display: grid;
    gap: 14px;
  }

  h1 {
    font-size: 34px;
  }

  .tabs {
    padding: 12px 14px 14px;
    overflow-x: auto;
    display: flex;
    flex-wrap: nowrap;
  }
}
</style>

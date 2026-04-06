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
    radial-gradient(circle at top left, rgba(88, 126, 255, 0.12), transparent 22%),
    linear-gradient(180deg, #f6f8fc 0%, #edf2f8 100%);
  color: #151d2d;
  padding: 18px 28px 0;
}

.dashboard-shell {
  max-width: 1380px;
  margin: 0 auto 18px;
  border: 1px solid rgba(220, 225, 236, 0.92);
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.88);
  box-shadow: 0 18px 40px rgba(28, 39, 64, 0.06);
  overflow: hidden;
  backdrop-filter: blur(8px);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 28px 18px;
}

h1 {
  margin: 0;
  font-size: 44px;
  line-height: 1;
}

.title-block p {
  margin: 0;
  color: #607089;
}

.eyebrow {
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 12px;
  font-weight: 800;
  color: #3359c9;
}

.tabs {
  display: flex;
  gap: 6px;
  padding: 0 22px 22px;
  border-top: 1px solid rgba(229, 232, 239, 0.9);
  padding-top: 14px;
  flex-wrap: wrap;
}

.tab {
  border: none;
  background: rgba(232, 235, 242, 0.75);
  padding: 10px 15px;
  border-radius: 14px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.tab.active {
  background: #fff;
  box-shadow: 0 6px 18px rgba(32, 43, 71, 0.08);
  border: 1px solid rgba(220, 225, 236, 0.95);
}

.ghost-button {
  border-radius: 12px;
  padding: 11px 16px;
  font-weight: 700;
  border: 1px solid #d7dceb;
  background: rgba(255, 255, 255, 0.9);
  display: inline-flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 10px 24px rgba(23, 27, 37, 0.05);
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

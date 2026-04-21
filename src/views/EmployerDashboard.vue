<template>
  <div class="dashboard-page">
    <section class="dashboard-shell">
      <header class="header">
        <div class="title-block">
          <p class="eyebrow">Employer Workspace</p>
          <h1>{{ headingTitle }}</h1>
          <p>{{ headingSubtitle }}</p>
        </div>
        <button class="ghost-button" @click="$router.push({ name: 'employeeDashboard' })">
          Switch View
        </button>
      </header>

      <nav class="tabs">
        <button v-for="tab in tabs" :key="tab.key" :class="['tab', { active: currentTab === tab.key }]"
          @click="$router.push({ name: tab.routeName })">
          <v-icon size="18">{{ tab.icon }}</v-icon>
          <span>{{ tab.label }}</span>
          <span v-if="tab.key === 'trades' && tradeboardAttentionCount > 0" class="tab-indicator"
            :title="tradeboardIndicatorTitle">
            {{ tradeboardAttentionCount }}
          </span>
        </button>
      </nav>
    </section>

    <router-view />
  </div>
</template>

<script>
import EmployerServices from "@/services/employerServices";
import TradeService from "@/services/tradeServices";

export default {
  name: "EmployerDashboard",
  data() {
    return {
      employerProfile: null,
      tradeboardAttentionCount: 0,
      tradeboardRefreshHandle: null,
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
          key: "timecards",
          label: "Timecards",
          icon: "mdi-timer-check-outline",
          routeName: "employerTimecards",
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
    currentUser() {
      return this.$store.getters.getLoginUserInfo || {};
    },
    headingTitle() {
      return this.employerProfile?.businessName || "Employer Workspace";
    },
    headingSubtitle() {
      const niche = this.employerProfile?.niche;
      return niche
        ? `Manage schedules and staffing for your ${niche.toLowerCase()}.`
        : "Manage your team's schedule";
    },
    tradeboardIndicatorTitle() {
      const count = this.tradeboardAttentionCount;
      return count === 1
        ? "1 trade board item needs attention"
        : `${count} trade board items need attention`;
    },
    currentTab() {
      const map = {
        employerSchedule: "schedule",
        employerEmployees: "employees",
        employerTimecards: "timecards",
        tradeRequestShifts: "trades",
        employerTaskLists: "taskLists",
        employerSettings: "settings",
      };
      return map[this.$route.name] || "schedule";
    },
  },
  async created() {
    if (this.$route.name === "employerDashboard") {
      this.$router.replace({ name: "employerSchedule" });
    }

    if (this.currentUser?.userId) {
      try {
        const { data } = await EmployerServices.getEmployerProfile(this.currentUser.userId);
        this.employerProfile = data || null;
      } catch (error) {
        this.employerProfile = null;
      }
    }

    await this.loadTradeboardAttentionCount();
  },
  mounted() {
    window.addEventListener("focus", this.loadTradeboardAttentionCount);
    this.tradeboardRefreshHandle = window.setInterval(this.loadTradeboardAttentionCount, 60000);
  },
  beforeUnmount() {
    window.removeEventListener("focus", this.loadTradeboardAttentionCount);
    if (this.tradeboardRefreshHandle) {
      window.clearInterval(this.tradeboardRefreshHandle);
      this.tradeboardRefreshHandle = null;
    }
  },
  watch: {
    "$route.name"() {
      this.loadTradeboardAttentionCount();
    },
  },
  methods: {
    async loadTradeboardAttentionCount() {
      try {
        const { data } = await TradeService.getPendingCount();
        const pendingCount = Number(data?.pendingCount || 0);
        const availableCount = Number(data?.availableCount || 0);
        const attentionCount = Number.isFinite(Number(data?.attentionCount))
          ? Number(data.attentionCount)
          : pendingCount + availableCount;

        this.tradeboardAttentionCount = Math.max(0, attentionCount);
      } catch (error) {
        this.tradeboardAttentionCount = 0;
      }
    },
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

.tab-indicator {
  min-width: 22px;
  height: 22px;
  padding: 0 7px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #c83c31;
  color: #fff;
  font-size: 12px;
  font-weight: 800;
  line-height: 1;
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

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

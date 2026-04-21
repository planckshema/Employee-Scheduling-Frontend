<template>
  <section class="tab-content">
    <section v-if="errorMessage" class="status-banner error">
      <v-icon size="18">mdi-alert-circle-outline</v-icon>
      <span>{{ errorMessage }}</span>
    </section>

    <section v-if="loading" class="loading-card">
      <v-progress-circular indeterminate color="primary" size="34" width="3" />
      <p>Loading your schedule...</p>
    </section>

    <template v-else>
      <section class="hero-card">
        <div>
          <p class="eyebrow">Current Week</p>
          <h2>My Schedule</h2>
          <p class="muted">{{ weekRangeLabel }}</p>
        </div>

        <div class="summary-pills">
          <article class="pill">
            <span>Hours</span>
            <strong>{{ formatHours(summary.weeklyHours) }}</strong>
          </article>
          <article class="pill">
            <span>Upcoming</span>
            <strong>{{ summary.totalUpcomingShifts }}</strong>
          </article>
          <article class="pill">
            <span>Next Shift</span>
            <strong>{{ summary.nextShift ? summary.nextShift.startTime : "None" }}</strong>
          </article>
        </div>
      </section>

      <section class="week-grid">
        <article
          v-for="day in weeklySchedule"
          :key="day.dayKey"
          class="day-card"
          :class="{ active: day.shiftCount > 0 }"
        >
          <div class="day-head">
            <div>
              <strong>{{ day.label }}</strong>
              <p>{{ formatShortDate(day.date) }}</p>
            </div>
            <span class="count">{{ day.shiftCount }} shift<span v-if="day.shiftCount !== 1">s</span></span>
          </div>

          <div v-if="day.shifts.length" class="shift-list">
            <article v-for="shift in day.shifts" :key="shift.shiftId" class="shift-card">
              <strong>{{ shift.position }}</strong>
              <span>{{ shift.startTime }} - {{ shift.endTime }}</span>
            </article>
          </div>

          <p v-else class="empty-copy">No shifts scheduled.</p>
        </article>
      </section>

      <section class="panel">
        <div class="panel-header">
          <div>
            <p class="eyebrow">Coming Up</p>
            <h3>Upcoming Shifts</h3>
          </div>
        </div>

        <div v-if="upcomingShifts.length" class="upcoming-list">
          <article v-for="shift in upcomingShifts" :key="shift.shiftId" class="upcoming-row">
            <div>
              <strong>{{ shift.position }}</strong>
              <p>{{ formatLongDate(shift.date) }}</p>
            </div>
            <span>{{ shift.startTime }} - {{ shift.endTime }}</span>
          </article>
        </div>

        <p v-else class="empty-copy">You do not have any upcoming shifts.</p>
      </section>
    </template>
  </section>
</template>

<script>
import EmployeeServices from "@/services/employeeServices";

export default {
  name: "EmployeeSchedule",
  data() {
    return {
      loading: true,
      errorMessage: "",
      dashboard: null,
    };
  },
  computed: {
    currentUser() {
      return this.$store.getters.getLoginUserInfo || {};
    },
    summary() {
      return (
        this.dashboard?.summary || {
          nextShift: null,
          weeklyHours: 0,
          totalUpcomingShifts: 0,
        }
      );
    },
    weeklySchedule() {
      return this.dashboard?.weeklySchedule || [];
    },
    upcomingShifts() {
      return this.dashboard?.upcomingShifts || [];
    },
    weekRangeLabel() {
      if (!this.weeklySchedule.length) {
        return "";
      }

      const first = this.weeklySchedule[0]?.date;
      const last = this.weeklySchedule[this.weeklySchedule.length - 1]?.date;
      return `${this.formatShortDate(first)} - ${this.formatShortDate(last)}`;
    },
  },
  created() {
    this.loadDashboard();
  },
  methods: {
    async loadDashboard() {
      if (!this.currentUser?.userId) {
        this.loading = false;
        this.errorMessage = "Your session is missing user information. Please sign in again.";
        return;
      }

      this.loading = true;
      this.errorMessage = "";

      try {
        const { data } = await EmployeeServices.getEmployeeDashboard(this.currentUser.userId);
        this.dashboard = data;
      } catch (error) {
        this.errorMessage =
          error.response?.data?.message || "We could not load the employee schedule.";
      } finally {
        this.loading = false;
      }
    },
    formatShortDate(value) {
      if (!value) return "";
      return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
      }).format(new Date(`${value}T00:00:00`));
    },
    formatLongDate(value) {
      if (!value) return "";
      return new Intl.DateTimeFormat("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(new Date(`${value}T00:00:00`));
    },
    formatHours(value) {
      const numeric = Number(value || 0);
      return `${numeric % 1 === 0 ? numeric.toFixed(0) : numeric.toFixed(1)} hrs`;
    },
  },
};
</script>

<style scoped>
.tab-content {
  padding: 0 20px 28px;
  display: grid;
  gap: 18px;
}

.status-banner,
.hero-card,
.panel,
.day-card,
.loading-card {
  border: 1px solid var(--app-border);
  border-radius: 22px;
  background: linear-gradient(180deg, var(--app-surface) 0%, var(--app-surface-soft) 100%);
  box-shadow: var(--app-shadow-sm);
}

.status-banner {
  padding: 14px 16px;
  display: flex;
  gap: 10px;
  align-items: center;
}

.status-banner.error {
  background: var(--app-danger-bg);
  color: var(--app-danger);
  border-color: var(--app-danger-border);
}

.loading-card {
  min-height: 220px;
  display: flex;
  gap: 12px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--app-text-soft);
}

.hero-card {
  padding: 24px;
  display: flex;
  justify-content: space-between;
  gap: 18px;
  align-items: center;
  background: linear-gradient(135deg, rgba(47, 107, 63, 0.97) 0%, rgba(79, 155, 88, 0.92) 100%);
  border-color: rgba(47, 107, 63, 0.35);
  color: #f7fff5;
  box-shadow: var(--app-shadow-md);
}

.eyebrow {
  margin: 0 0 8px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 12px;
  font-weight: 800;
  color: rgba(236, 248, 238, 0.8);
}

h2,
h3,
p {
  margin: 0;
}

.hero-card h2 {
  font-size: 32px;
  letter-spacing: -0.03em;
}

.muted,
.upcoming-row p,
.day-head p,
.empty-copy {
  color: var(--app-text-soft);
}

.hero-card .muted {
  color: rgba(236, 248, 238, 0.8);
}

.summary-pills {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.pill {
  min-width: 130px;
  padding: 14px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.12);
  display: grid;
  gap: 6px;
  backdrop-filter: blur(4px);
}

.pill span {
  color: rgba(236, 248, 238, 0.78);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.pill strong {
  color: #fff;
}

.week-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
}

.day-card {
  padding: 18px;
}

.day-card.active {
  background: linear-gradient(180deg, var(--app-surface) 0%, rgba(236, 248, 238, 0.82) 100%);
  border-color: rgba(79, 155, 88, 0.28);
  box-shadow: 0 18px 30px rgba(47, 107, 63, 0.1);
}

.day-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.count {
  white-space: nowrap;
  border-radius: 999px;
  background: rgba(123, 201, 111, 0.18);
  color: var(--app-primary);
  padding: 7px 11px;
  font-size: 12px;
  font-weight: 700;
}

.shift-list,
.upcoming-list {
  display: grid;
  gap: 10px;
}

.shift-card,
.upcoming-row {
  border: 1px solid var(--app-border);
  border-radius: 16px;
  background: var(--app-surface);
  padding: 13px 14px;
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
}

.panel {
  padding: 22px;
}

.panel-header {
  margin-bottom: 14px;
}

@media (max-width: 980px) {
  .tab-content {
    padding: 0 14px 16px;
  }

  .hero-card,
  .shift-card,
  .upcoming-row {
    display: grid;
  }
}
</style>

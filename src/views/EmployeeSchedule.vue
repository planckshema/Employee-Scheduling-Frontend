<template>
  <section class="tab-content">
    <section v-if="errorMessage" class="status-banner error">
      <v-icon size="18">mdi-alert-circle-outline</v-icon>
      <span>{{ errorMessage }}</span>
    </section>

    <section v-if="loading" class="loading-card">
      <v-progress-circular indeterminate color="#2647c8" size="34" width="3" />
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
  padding: 0 20px 24px;
  display: grid;
  gap: 16px;
}

.status-banner,
.hero-card,
.panel,
.day-card,
.loading-card {
  border: 1px solid #dce1ec;
  border-radius: 18px;
  background: #fff;
}

.status-banner {
  padding: 14px 16px;
  display: flex;
  gap: 10px;
  align-items: center;
}

.status-banner.error {
  background: #fff4f5;
  color: #8b1f2d;
}

.loading-card {
  min-height: 220px;
  display: flex;
  gap: 12px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #617089;
}

.hero-card {
  padding: 20px;
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
}

.eyebrow {
  margin: 0 0 8px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 12px;
  font-weight: 800;
  color: #3957ba;
}

h2,
h3,
p {
  margin: 0;
}

.muted,
.upcoming-row p,
.day-head p,
.empty-copy {
  color: #617089;
}

.summary-pills {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.pill {
  min-width: 130px;
  padding: 14px;
  border-radius: 14px;
  background: #f6f8fc;
  display: grid;
  gap: 6px;
}

.pill span {
  color: #617089;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.week-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 14px;
}

.day-card {
  padding: 16px;
  background: #f9fbff;
}

.day-card.active {
  background: linear-gradient(180deg, #f4f7ff 0%, #eef3ff 100%);
  border-color: #d4ddf6;
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
  background: #eef2fb;
  padding: 6px 10px;
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
  border: 1px solid #e2e7f1;
  border-radius: 14px;
  background: #fff;
  padding: 12px 14px;
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
}

.panel {
  padding: 20px;
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

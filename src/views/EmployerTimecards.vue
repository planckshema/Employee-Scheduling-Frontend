<template>
  <section class="tab-content">
    <section v-if="errorMessage" class="status-banner error">
      <v-icon size="18">mdi-alert-circle-outline</v-icon>
      <span>{{ errorMessage }}</span>
    </section>

    <section class="hero-card">
      <div>
        <p class="eyebrow">Employer Timecards</p>
        <h2>Review shift attendance and worked hours</h2>
        <p class="muted">
          Track completed shifts, active clock-ins, missed punches, and scheduled versus worked time across your team.
        </p>
      </div>

      <button class="ghost-button" :disabled="loading" @click="fetchTimecards">
        <v-icon size="18">mdi-refresh</v-icon>
        {{ loading ? "Refreshing..." : "Refresh" }}
      </button>
    </section>

    <section class="summary-grid">
      <article class="summary-card">
        <span>Visible Timecards</span>
        <strong>{{ timecards.length }}</strong>
      </article>
      <article class="summary-card">
        <span>Worked Hours</span>
        <strong>{{ formatHours(totalWorkedHours) }}</strong>
      </article>
      <article class="summary-card">
        <span>Scheduled Hours</span>
        <strong>{{ formatHours(totalScheduledHours) }}</strong>
      </article>
      <article class="summary-card active-card">
        <span>Clocked In</span>
        <strong>{{ activeTimecards }}</strong>
      </article>
      <article class="summary-card missed-card">
        <span>Missed</span>
        <strong>{{ missedTimecards }}</strong>
      </article>
    </section>

    <section class="filters-card">
      <div class="filter-grid">
        <label>
          <span>Employee</span>
          <select v-model="filters.employeeId">
            <option value="">All employees</option>
            <option v-for="employee in employees" :key="employee.id" :value="String(employee.id)">
              {{ employee.name }}
            </option>
          </select>
        </label>

        <label>
          <span>Status</span>
          <select v-model="filters.status">
            <option value="">All statuses</option>
            <option v-for="option in statusOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </label>

        <label>
          <span>From</span>
          <input v-model="filters.dateFrom" type="date" />
        </label>

        <label>
          <span>To</span>
          <input v-model="filters.dateTo" type="date" />
        </label>

        <label class="search-field">
          <span>Search</span>
          <input
            v-model.trim="filters.search"
            type="search"
            placeholder="Search employee, position, or day"
            @keyup.enter="fetchTimecards"
          />
        </label>
      </div>

      <div class="filter-actions">
        <button class="ghost-button" :disabled="loading" @click="resetFilters">
          Reset
        </button>
        <button class="primary-button" :disabled="loading" @click="fetchTimecards">
          Apply Filters
        </button>
      </div>
    </section>

    <section class="table-shell">
      <header class="table-header">
        <div>
          <h3>Timecard Log</h3>
          <p class="muted">Showing the latest scheduled shifts with timecard activity and attendance status.</p>
        </div>
      </header>

      <div v-if="loading" class="table-state">
        Loading employer timecards...
      </div>

      <div v-else-if="!timecards.length" class="table-state empty">
        No timecards matched the current filters.
      </div>

      <div v-else class="table-wrap">
        <table class="timecard-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Shift</th>
              <th>Date</th>
              <th>Scheduled</th>
              <th>Clock Activity</th>
              <th>Hours</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="timecard in timecards" :key="timecard.shiftId">
              <td>
                <strong>{{ timecard.employeeName || "Unassigned" }}</strong>
                <p class="cell-copy">Shift #{{ timecard.shiftId }}</p>
              </td>
              <td>
                <strong>{{ timecard.position || "Shift" }}</strong>
                <p class="cell-copy">{{ timecard.dayLabel || "Scheduled shift" }}</p>
              </td>
              <td>
                <strong>{{ formatDate(timecard.date) }}</strong>
              </td>
              <td>
                <strong>{{ timecard.scheduledStartTime }} - {{ timecard.scheduledEndTime }}</strong>
                <p class="cell-copy">{{ formatHours(timecard.scheduledHours) }} scheduled</p>
              </td>
              <td>
                <strong>{{ formatClockRange(timecard) }}</strong>
                <p class="cell-copy">{{ formatClockDetails(timecard) }}</p>
              </td>
              <td>
                <strong>{{ formatHours(timecard.workedHours) }} worked</strong>
                <p class="cell-copy">Variance {{ formatVariance(timecard.varianceHours) }}</p>
              </td>
              <td>
                <span :class="['status-pill', timecard.status]">
                  {{ statusLabel(timecard.status) }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </section>
</template>

<script>
import SchedulerServices from "@/services/schedulerServices";
import TimecardServices from "@/services/timecardServices";

const statusOptions = [
  { value: "scheduled", label: "Scheduled" },
  { value: "clocked-in", label: "Clocked In" },
  { value: "completed", label: "Completed" },
  { value: "missed", label: "Missed" },
];

const defaultFilters = () => ({
  employeeId: "",
  status: "",
  dateFrom: "",
  dateTo: "",
  search: "",
});

export default {
  name: "EmployerTimecards",
  data() {
    return {
      loading: false,
      errorMessage: "",
      employees: [],
      timecards: [],
      filters: defaultFilters(),
      statusOptions,
    };
  },
  computed: {
    currentUser() {
      return this.$store.getters.getLoginUserInfo || {};
    },
    totalWorkedHours() {
      return this.timecards.reduce((total, timecard) => total + Number(timecard.workedHours || 0), 0);
    },
    totalScheduledHours() {
      return this.timecards.reduce((total, timecard) => total + Number(timecard.scheduledHours || 0), 0);
    },
    activeTimecards() {
      return this.timecards.filter((timecard) => timecard.status === "clocked-in").length;
    },
    missedTimecards() {
      return this.timecards.filter((timecard) => timecard.status === "missed").length;
    },
  },
  created() {
    this.bootstrapPage();
  },
  methods: {
    async bootstrapPage() {
      if (!this.currentUser?.userId) {
        this.errorMessage = "Your session is missing employer information. Please sign in again.";
        return;
      }

      await Promise.all([this.fetchEmployees(), this.fetchTimecards()]);
    },
    buildQueryParams() {
      return {
        employeeId: this.filters.employeeId,
        status: this.filters.status,
        dateFrom: this.filters.dateFrom,
        dateTo: this.filters.dateTo,
        search: this.filters.search,
      };
    },
    async fetchEmployees() {
      try {
        const { data } = await SchedulerServices.getEmployees();
        this.employees = (data || [])
          .map((row) => ({
            id: row.EmployeeID,
            name: `${row.firstName} ${row.lastName}`.trim(),
          }))
          .sort((a, b) => a.name.localeCompare(b.name));
      } catch (error) {
        this.errorMessage = error.response?.data?.message || "We could not load the employee list.";
      }
    },
    async fetchTimecards() {
      if (!this.currentUser?.userId) {
        return;
      }

      this.loading = true;
      this.errorMessage = "";

      try {
        const { data } = await TimecardServices.getEmployerTimecards(
          this.currentUser.userId,
          this.buildQueryParams(),
        );
        this.timecards = Array.isArray(data) ? data : data?.timecards || [];
      } catch (error) {
        this.timecards = [];
        this.errorMessage = error.response?.data?.message || "We could not load employer timecards.";
      } finally {
        this.loading = false;
      }
    },
    resetFilters() {
      this.filters = defaultFilters();
      this.fetchTimecards();
    },
    statusLabel(status) {
      const labels = {
        scheduled: "Scheduled",
        "clocked-in": "Clocked In",
        completed: "Completed",
        missed: "Missed",
      };
      return labels[status] || "Unknown";
    },
    formatDate(value) {
      if (!value) {
        return "No date";
      }

      const parsed = new Date(`${value}T00:00:00`);
      return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString();
    },
    formatDateTime(value) {
      if (!value) {
        return "";
      }

      const parsed = new Date(value);
      return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString();
    },
    formatHours(value) {
      return `${Number(value || 0).toFixed(2)}h`;
    },
    formatVariance(value) {
      const variance = Number(value || 0);
      const prefix = variance > 0 ? "+" : "";
      return `${prefix}${variance.toFixed(2)}h`;
    },
    formatClockRange(timecard) {
      if (timecard.clockInTime && timecard.clockOutTime) {
        return `${this.formatDateTime(timecard.clockInTime)} - ${this.formatDateTime(timecard.clockOutTime)}`;
      }

      if (timecard.clockInTime) {
        return `In: ${this.formatDateTime(timecard.clockInTime)}`;
      }

      return "No clock activity";
    },
    formatClockDetails(timecard) {
      if (timecard.clockInTime && !timecard.clockOutTime) {
        return "Employee is currently clocked in.";
      }

      if (timecard.status === "missed") {
        return "Shift ended without a completed timecard.";
      }

      if (timecard.status === "scheduled") {
        return "Shift is scheduled and has not started yet.";
      }

      return "Timecard activity recorded.";
    },
  },
};
</script>

<style scoped>
.tab-content {
  max-width: 1380px;
  margin: 0 auto;
  padding: 0 28px 32px;
}

h2,
h3,
p {
  margin: 0;
}

.status-banner,
.hero-card,
.filters-card,
.table-shell,
.summary-card {
  border: 1px solid rgba(220, 225, 236, 0.95);
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 18px 40px rgba(28, 39, 64, 0.06);
}

.status-banner {
  border-radius: 16px;
  padding: 14px 16px;
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 16px;
}

.status-banner.error {
  background: #fff4f5;
  border-color: #efc0c8;
  color: #8b1f2d;
}

.hero-card {
  border-radius: 24px;
  padding: 24px 26px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 18px;
}

.eyebrow {
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 12px;
  font-weight: 800;
  color: #3359c9;
}

.muted,
.cell-copy {
  color: #617089;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 18px;
}

.summary-card {
  border-radius: 18px;
  padding: 16px 18px;
  display: grid;
  gap: 6px;
}

.summary-card span {
  color: #617089;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.summary-card strong {
  font-size: 24px;
}

.active-card {
  background: linear-gradient(180deg, #edf9f3 0%, #e5f6ed 100%);
  border-color: #bfe5cc;
}

.missed-card {
  background: linear-gradient(180deg, #fff5f6 0%, #ffeaed 100%);
  border-color: #efc5cc;
}

.filters-card,
.table-shell {
  border-radius: 24px;
  padding: 20px;
}

.filters-card {
  margin-bottom: 18px;
}

.filter-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
}

.filter-grid label {
  display: grid;
  gap: 6px;
  font-weight: 700;
  color: #223047;
}

.filter-grid span {
  font-size: 13px;
  color: #617089;
}

.filter-grid input,
.filter-grid select {
  width: 100%;
  min-height: 48px;
  border: 1px solid #dbe1ed;
  border-radius: 12px;
  padding: 10px 14px;
  background: #f8faff;
  outline: none;
}

.search-field {
  grid-column: span 1;
}

.filter-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 14px;
}

.table-header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.table-state {
  min-height: 180px;
  display: grid;
  place-items: center;
  border: 1px dashed #d7dceb;
  border-radius: 18px;
  color: #617089;
  background: #fbfcff;
}

.table-state.empty {
  color: #7b889c;
}

.table-wrap {
  overflow-x: auto;
}

.timecard-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 1100px;
}

.timecard-table th,
.timecard-table td {
  border-top: 1px solid #e7ebf3;
  padding: 16px 14px;
  text-align: left;
  vertical-align: top;
}

.timecard-table thead th {
  border-top: none;
  color: #617089;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  background: #f8faff;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 7px 12px;
  font-weight: 700;
  font-size: 12px;
}

.status-pill.scheduled {
  background: #eef2ff;
  color: #3b4bb0;
}

.status-pill.clocked-in {
  background: #edf9f3;
  color: #1d7a4e;
}

.status-pill.completed {
  background: #f3f4f7;
  color: #253246;
}

.status-pill.missed {
  background: #fff1f3;
  color: #b4233c;
}

.ghost-button,
.primary-button {
  border-radius: 12px;
  padding: 11px 16px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.ghost-button {
  border: 1px solid #d7dceb;
  background: #fff;
}

.primary-button {
  border: 1px solid #080c28;
  background: #060828;
  color: #fff;
}

.ghost-button:disabled,
.primary-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

@media (max-width: 1200px) {
  .summary-grid,
  .filter-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 980px) {
  .tab-content {
    padding: 0 14px 18px;
  }

  .hero-card,
  .filter-actions,
  .table-header {
    display: grid;
  }

  .summary-grid,
  .filter-grid {
    grid-template-columns: 1fr;
  }
}
</style>

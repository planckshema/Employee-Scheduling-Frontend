<template>
  <section class="tab-content">
    <section v-if="errorMessage" class="status-banner error">
      <v-icon size="18">mdi-alert-circle-outline</v-icon>
      <span>{{ errorMessage }}</span>
    </section>

    <section v-if="successMessage" class="status-banner success">
      <v-icon size="18">mdi-check-circle-outline</v-icon>
      <span>{{ successMessage }}</span>
    </section>

    <section class="panel">
      <div class="panel-header">
        <div>
          <p class="eyebrow">Weekly Pattern</p>
          <h2>Availability</h2>
          <p class="muted">Set the times you are generally available to work each week.</p>
        </div>
        <button class="primary-button" :disabled="saving || !availabilityChanged" @click="saveAvailability">
          <v-icon size="18">mdi-content-save-outline</v-icon>
          {{ saving ? "Saving..." : "Save Availability" }}
        </button>
      </div>

      <div v-if="loading" class="loading-card">
        <v-progress-circular indeterminate color="primary" size="34" width="3" />
        <p>Loading availability...</p>
      </div>

      <div v-else class="availability-list">
        <article
          v-for="row in editableAvailability"
          :key="row.dayKey"
          class="availability-row"
          :class="{ unavailable: !row.available }"
        >
          <div class="availability-meta">
            <strong>{{ row.label }}</strong>
            <span>{{ availabilityLabel(row) }}</span>
          </div>

          <label class="availability-toggle">
            <input v-model="row.available" type="checkbox" @change="handleAvailabilityToggle(row)" />
            <span>Available</span>
          </label>

          <div class="time-inputs">
            <input v-model="row.startTime" type="time" :disabled="!row.available" />
            <span>to</span>
            <input v-model="row.endTime" type="time" :disabled="!row.available" />
          </div>
        </article>
      </div>
    </section>

    <section class="panel">
      <div class="panel-header compact">
        <div>
          <p class="eyebrow">Reference</p>
          <h3>Recent Time-Off Requests</h3>
        </div>
      </div>

      <div v-if="timeOffHistory.length" class="history-list">
        <article v-for="request in timeOffHistory" :key="request.timeOffId" class="history-row">
          <div>
            <strong>{{ formatDateRange(request.startDate, request.endDate) }}</strong>
            <p>{{ request.reason }}</p>
          </div>
        </article>
      </div>

      <p v-else class="empty-copy">No recent time-off requests were found.</p>
    </section>
  </section>
</template>

<script>
import EmployeeServices from "@/services/employeeServices";

const cloneAvailability = (rows = []) =>
  rows.map((row) => ({
    dayKey: row.dayKey,
    label: row.label,
    available: Boolean(row.available),
    startTime: row.startTime || "",
    endTime: row.endTime || "",
  }));

export default {
  name: "EmployeeAvailability",
  data() {
    return {
      loading: true,
      saving: false,
      errorMessage: "",
      successMessage: "",
      editableAvailability: [],
      timeOffHistory: [],
      savedAvailabilitySnapshot: "[]",
    };
  },
  computed: {
    currentUser() {
      return this.$store.getters.getLoginUserInfo || {};
    },
    availabilityChanged() {
      return JSON.stringify(cloneAvailability(this.editableAvailability)) !== this.savedAvailabilitySnapshot;
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
        this.editableAvailability = cloneAvailability(data.availability || []);
        this.savedAvailabilitySnapshot = JSON.stringify(cloneAvailability(data.availability || []));
        this.timeOffHistory = data.timeOffHistory || [];
      } catch (error) {
        this.errorMessage =
          error.response?.data?.message || "We could not load employee availability.";
      } finally {
        this.loading = false;
      }
    },
    handleAvailabilityToggle(row) {
      if (row.available) {
        row.startTime = row.startTime || "09:00";
        row.endTime = row.endTime || "17:00";
        return;
      }

      row.startTime = "";
      row.endTime = "";
    },
    availabilityLabel(row) {
      if (!row.available || !row.startTime || !row.endTime) {
        return "Unavailable";
      }
      return `${row.startTime} - ${row.endTime}`;
    },
    async saveAvailability() {
      if (!this.currentUser?.userId || !this.availabilityChanged) {
        return;
      }

      this.saving = true;
      this.errorMessage = "";
      this.successMessage = "";

      try {
        const payload = cloneAvailability(this.editableAvailability).map((row) => ({
          ...row,
          available: row.available && Boolean(row.startTime) && Boolean(row.endTime),
          startTime: row.available ? row.startTime : "",
          endTime: row.available ? row.endTime : "",
        }));

        const { data } = await EmployeeServices.updateEmployeeAvailability(
          this.currentUser.userId,
          payload,
        );

        const normalized = cloneAvailability(data.availability || payload);
        this.editableAvailability = normalized;
        this.savedAvailabilitySnapshot = JSON.stringify(normalized);
        this.successMessage = "Availability updated successfully.";
      } catch (error) {
        this.errorMessage =
          error.response?.data?.message || "We could not save availability right now.";
      } finally {
        this.saving = false;
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
    formatDateRange(startDate, endDate) {
      if (!startDate || !endDate) {
        return "";
      }
      if (startDate === endDate) {
        return this.formatLongDate(startDate);
      }
      return `${this.formatShortDate(startDate)} - ${this.formatLongDate(endDate)}`;
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

.panel,
.status-banner {
  border: 1px solid var(--app-border);
  border-radius: 22px;
  background: linear-gradient(180deg, var(--app-surface) 0%, var(--app-surface-soft) 100%);
  box-shadow: var(--app-shadow-sm);
}

.panel {
  padding: 22px;
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

.status-banner.success {
  background: var(--app-success-bg);
  color: var(--app-primary);
  border-color: var(--app-success-border);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
  margin-bottom: 18px;
}

.panel-header.compact {
  margin-bottom: 12px;
}

.eyebrow {
  margin: 0 0 8px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 12px;
  font-weight: 800;
  color: var(--app-secondary);
}

h2,
h3,
p {
  margin: 0;
}

.muted,
.availability-meta span,
.history-row p,
.empty-copy {
  color: var(--app-text-soft);
}

.primary-button {
  border-radius: 14px;
  padding: 12px 18px;
  font-weight: 700;
  border: 1px solid var(--app-primary-deep);
  background: linear-gradient(135deg, var(--app-primary) 0%, var(--app-secondary) 100%);
  color: #fff;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 16px 28px rgba(47, 107, 63, 0.18);
}

.primary-button:disabled {
  opacity: 0.6;
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

.availability-list,
.history-list {
  display: grid;
  gap: 12px;
}

.availability-row,
.history-row {
  border: 1px solid var(--app-border);
  border-radius: 18px;
  padding: 14px 16px;
  background: var(--app-surface);
}

.availability-row {
  display: grid;
  grid-template-columns: minmax(110px, 140px) auto minmax(210px, 1fr);
  gap: 16px;
  align-items: center;
}

.availability-row.unavailable {
  background: var(--app-surface-soft);
}

.availability-toggle {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-weight: 700;
  color: var(--app-text);
}

.time-inputs {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
}

.time-inputs input {
  min-height: 44px;
  border-radius: 14px;
  border: 1px solid var(--app-border);
  background: var(--app-surface-soft);
  padding: 0 12px;
  color: var(--app-text);
}

.time-inputs input:focus {
  border-color: var(--app-primary);
  background: var(--app-surface);
  box-shadow: 0 0 0 4px rgba(79, 155, 88, 0.12);
  outline: none;
}

@media (max-width: 980px) {
  .tab-content {
    padding: 0 14px 16px;
  }

  .panel-header,
  .availability-row {
    display: grid;
  }

  .time-inputs {
    justify-content: flex-start;
    flex-wrap: wrap;
  }
}
</style>

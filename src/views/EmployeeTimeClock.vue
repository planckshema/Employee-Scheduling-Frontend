<template>
  <section class="tab-content">
    <section v-if="errorMessage" class="status-banner error">
      <span>{{ errorMessage }}</span>
    </section>

    <section v-if="successMessage" class="status-banner success">
      <span>{{ successMessage }}</span>
    </section>

    <section class="clock-card">
      <h2>Clock In/Clock Out</h2>

      <div v-if="loading">
        <p>Loading time clock...</p>
      </div>

      <div v-else-if="!shift">
        <p>No assigned shift scheduled for today.</p>
      </div>

      <div v-else>
        <p><strong>Position:</strong> {{ shift.position }}</p>
        <p><strong>Date:</strong> {{ formatShiftDate(shift.date) }}</p>
        <p><strong>Time:</strong> {{ shift.startTime }} - {{ shift.endTime }}</p>

        <p v-if="timeClock.clockInTime">
          <strong>Clocked In:</strong> {{ formatDateTime(timeClock.clockInTime) }}
        </p>

        <p v-if="timeClock.clockOutTime">
          <strong>Clocked Out:</strong> {{ formatDateTime(timeClock.clockOutTime) }}
        </p>

        <div class="actions">
          <button
            v-if="canClockIn"
            class="primary-button"
            :disabled="submitting"
            @click="handleClockIn"
          >
            {{ submitting ? "Clocking In..." : "Clock In" }}
          </button>

          <button
            v-else-if="canClockOut"
            class="primary-button"
            :disabled="submitting"
            @click="handleClockOut"
          >
            {{ submitting ? "Clocking Out..." : "Clock Out" }}
          </button>
        </div>

        <p v-if="isShiftComplete" class="status-copy">
          The last action on this shift was a clock-out. You can clock in again if needed.
        </p>
      </div>
    </section>
  </section>
</template>

<script>
import EmployeeServices from "@/services/employeeServices";
import ShiftServices from "@/services/shiftServices";

const emptyTimeClock = () => ({
  clockInTime: null,
  clockOutTime: null,
});

const firstDefined = (...values) => values.find((value) => value !== undefined && value !== null);

const normalizeTimeValue = (value) => {
  if (!value) {
    return "";
  }

  const raw = String(value);
  if (raw.includes("T")) {
    return raw.split("T")[1].slice(0, 5);
  }

  return raw.slice(0, 5);
};

const normalizeDateValue = (value) => {
  if (!value) {
    return "";
  }

  return String(value).slice(0, 10);
};

const normalizeShift = (payload) => {
  const source = payload?.shift || payload?.todayShift || payload?.data || payload;
  const row = Array.isArray(source) ? source[0] : source;

  if (!row) {
    return null;
  }

  const shiftId = firstDefined(row.shiftId, row.ShiftID, row.id, row.shiftID);
  if (!shiftId) {
    return null;
  }

  return {
    ...row,
    shiftId,
    employeeId: firstDefined(row.employeeId, row.EmployeeID, row.employeeID, row.EmployeeId, null),
    position: firstDefined(row.position, row.Position, "Shift"),
    date: normalizeDateValue(firstDefined(row.date, row.startDate, row.Date)),
    startTime: normalizeTimeValue(firstDefined(row.startTime, row.StartTime)),
    endTime: normalizeTimeValue(firstDefined(row.endTime, row.EndTime)),
  };
};

const getLocalIsoDate = (dateValue = new Date()) => {
  const date = new Date(dateValue);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const toMinutes = (timeValue) => {
  const [hours, minutes] = String(timeValue || "00:00").split(":").map(Number);
  return (hours || 0) * 60 + (minutes || 0);
};

const dedupeShifts = (shifts = []) => {
  const seen = new Set();

  return shifts.filter((shift) => {
    const key = shift.shiftId || `${shift.date}-${shift.startTime}-${shift.endTime}-${shift.position}`;
    if (!key || seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
};

const pickBestTodayShift = (shifts = []) => {
  const today = getLocalIsoDate();
  const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();

  const todayShifts = dedupeShifts(shifts)
    .filter((shift) => shift?.date === today)
    .sort((left, right) => toMinutes(left.startTime) - toMinutes(right.startTime));

  if (!todayShifts.length) {
    return null;
  }

  const activeShift = todayShifts.find(
    (shift) => toMinutes(shift.startTime) <= nowMinutes && nowMinutes <= toMinutes(shift.endTime),
  );
  if (activeShift) {
    return activeShift;
  }

  const nextShift = todayShifts.find((shift) => toMinutes(shift.startTime) > nowMinutes);
  if (nextShift) {
    return nextShift;
  }

  return todayShifts[todayShifts.length - 1];
};

const extractDashboardShifts = (dashboard) => {
  const weeklySchedule = (dashboard?.weeklySchedule || []).flatMap((day) =>
    (day?.shifts || [])
      .map((shift) =>
        normalizeShift({
          ...shift,
          date: firstDefined(shift?.date, day?.date),
        }),
      )
      .filter(Boolean),
  );

  const upcomingShifts = (dashboard?.upcomingShifts || [])
    .map((shift) => normalizeShift(shift))
    .filter(Boolean);

  return dedupeShifts([...weeklySchedule, ...upcomingShifts]);
};

const selectEmployeeShifts = (shifts, employeeId) => {
  if (!employeeId) {
    return [];
  }

  const normalizedEmployeeId = String(employeeId);
  return (shifts || [])
    .map((shift) => normalizeShift(shift))
    .filter((shift) => shift && String(shift.employeeId) === normalizedEmployeeId);
};

const normalizeTimeClock = (payload) => {
  const source = payload?.timeClock || payload?.status || payload?.record || payload || {};

  return {
    clockInTime: firstDefined(
      source.clockInTime,
      source.ClockInTime,
      source.clockIn,
      source.clockInAt,
      source.clockedInAt,
      source.timeIn,
    ) || null,
    clockOutTime: firstDefined(
      source.clockOutTime,
      source.ClockOutTime,
      source.clockOut,
      source.clockOutAt,
      source.clockedOutAt,
      source.timeOut,
    ) || null,
  };
};

const mergeTimeClock = (current, incoming) => ({
  clockInTime: incoming.clockInTime || current.clockInTime || null,
  clockOutTime: incoming.clockOutTime || current.clockOutTime || null,
});

const toTimestamp = (value) => {
  if (!value) {
    return 0;
  }

  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
};

export default {
  name: "EmployeeTimeClock",
  data() {
    return {
      loading: true,
      submitting: false,
      errorMessage: "",
      successMessage: "",
      shift: null,
      timeClock: emptyTimeClock(),
    };
  },
  computed: {
    currentUser() {
      return this.$store.getters.getLoginUserInfo || {};
    },
    latestClockInMs() {
      return toTimestamp(this.timeClock.clockInTime);
    },
    latestClockOutMs() {
      return toTimestamp(this.timeClock.clockOutTime);
    },
    isCurrentlyClockedIn() {
      return Boolean(this.latestClockInMs) && this.latestClockInMs > this.latestClockOutMs;
    },
    canClockIn() {
      return Boolean(this.shift?.shiftId) && !this.isCurrentlyClockedIn;
    },
    canClockOut() {
      return Boolean(this.shift?.shiftId) && this.isCurrentlyClockedIn;
    },
    isShiftComplete() {
      return Boolean(this.shift?.shiftId) && Boolean(this.latestClockOutMs) && this.latestClockOutMs >= this.latestClockInMs;
    },
  },
  created() {
    this.loadTimeClock();
  },
  methods: {
    async resolveTodayShift() {
      let recoverableError = null;
      let dashboard = null;
      let employeeId = null;

      try {
        const { data } = await EmployeeServices.getTodayShift(this.currentUser.userId);
        const endpointShift = normalizeShift(data);
        if (endpointShift) {
          return endpointShift;
        }
      } catch (error) {
        if (error.response?.status !== 404) {
          recoverableError = error;
        }
      }

      try {
        const { data } = await EmployeeServices.getEmployeeDashboard(this.currentUser.userId);
        dashboard = data || null;
        employeeId = firstDefined(
          dashboard?.profile?.employeeId,
          dashboard?.profile?.EmployeeID,
          dashboard?.profile?.employeeID,
          null,
        );

        const dashboardShift = pickBestTodayShift(extractDashboardShifts(dashboard));
        if (dashboardShift) {
          return dashboardShift;
        }
      } catch (error) {
        if (error.response?.status !== 404 && !recoverableError) {
          recoverableError = error;
        }
      }

      if (employeeId) {
        try {
          const { data } = await ShiftServices.getAllShifts();
          const shiftFromList = pickBestTodayShift(selectEmployeeShifts(data, employeeId));
          if (shiftFromList) {
            return shiftFromList;
          }
        } catch (error) {
          if (error.response?.status !== 404 && !recoverableError) {
            recoverableError = error;
          }
        }
      }

      if (recoverableError) {
        throw recoverableError;
      }

      return null;
    },
    async loadTimeClock() {
      if (!this.currentUser?.userId) {
        this.loading = false;
        this.errorMessage = "Your session is missing user information. Please sign in again.";
        return;
      }

      this.loading = true;
      this.errorMessage = "";
      this.successMessage = "";

      try {
        this.shift = await this.resolveTodayShift();
        await this.loadTimeClockStatus();
      } catch (error) {
        if (error.response?.status === 404) {
          this.shift = null;
          this.timeClock = emptyTimeClock();
          return;
        }

        this.errorMessage = error.response?.data?.message || "We could not load the time clock.";
      } finally {
        this.loading = false;
      }
    },
    async loadTimeClockStatus({ merge = false } = {}) {
      if (!this.shift?.shiftId) {
        this.timeClock = emptyTimeClock();
        return;
      }

      try {
        const { data: statusPayload } = await EmployeeServices.getTimeClockStatus(
          this.currentUser.userId,
          this.shift.shiftId,
        );
        const normalizedStatus = normalizeTimeClock(statusPayload);
        this.timeClock = merge
          ? mergeTimeClock(this.timeClock, normalizedStatus)
          : normalizedStatus;
      } catch (error) {
        if (error.response?.status === 404) {
          if (!merge) {
            this.timeClock = emptyTimeClock();
          }
          return;
        }

        throw error;
      }
    },
    applyClockResult(payload, action) {
      const normalizedResult = normalizeTimeClock(payload);
      const fallbackTimestamp = new Date().toISOString();

      if (action === "clockIn") {
        this.timeClock = mergeTimeClock(this.timeClock, {
          ...normalizedResult,
          clockInTime: normalizedResult.clockInTime || fallbackTimestamp,
        });
        return;
      }

      if (action === "clockOut") {
        this.timeClock = mergeTimeClock(this.timeClock, {
          ...normalizedResult,
          clockOutTime: normalizedResult.clockOutTime || fallbackTimestamp,
        });
      }
    },
    async handleClockIn() {
      if (!this.shift?.shiftId || this.submitting) {
        return;
      }

      this.submitting = true;
      this.errorMessage = "";
      this.successMessage = "";

      try {
        const response = await EmployeeServices.clockIn(this.currentUser.userId, this.shift.shiftId);
        this.applyClockResult(response?.data, "clockIn");
        this.successMessage = "You have been clocked in.";

        try {
          await this.loadTimeClockStatus({ merge: true });
        } catch (statusError) {
          // Keep the optimistic state if the follow-up status fetch is unavailable.
        }
      } catch (error) {
        this.errorMessage = error.response?.data?.message || "Clock in failed.";
      } finally {
        this.submitting = false;
      }
    },
    async handleClockOut() {
      if (!this.shift?.shiftId || this.submitting) {
        return;
      }

      this.submitting = true;
      this.errorMessage = "";
      this.successMessage = "";

      try {
        const response = await EmployeeServices.clockOut(this.currentUser.userId, this.shift.shiftId);
        this.applyClockResult(response?.data, "clockOut");
        this.successMessage = "You have been clocked out.";

        try {
          await this.loadTimeClockStatus({ merge: true });
        } catch (statusError) {
          // Keep the optimistic state if the follow-up status fetch is unavailable.
        }
      } catch (error) {
        this.errorMessage = error.response?.data?.message || "Clock out failed.";
      } finally {
        this.submitting = false;
      }
    },
    formatShiftDate(value) {
      if (!value) {
        return "";
      }

      const parsed = new Date(`${String(value).slice(0, 10)}T00:00:00`);
      if (Number.isNaN(parsed.getTime())) {
        return String(value);
      }

      return parsed.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    },
    formatDateTime(value) {
      if (!value) {
        return "";
      }

      return new Date(value).toLocaleString();
    },
  },
};
</script>

<style scoped>
.tab-content {
  --clock-surface: #ffffff;
  --clock-surface-soft: #f4fbf6;
  --clock-text: #1d2b23;
  --clock-text-soft: #55685d;
  --clock-primary: #0b6e4f;
  --clock-primary-deep: #073b3a;
  --clock-success-border: rgba(8, 160, 69, 0.24);
  --clock-danger: #9a2f2f;
  --clock-danger-border: rgba(154, 47, 47, 0.22);
  --clock-shadow: 0 18px 36px rgba(7, 59, 58, 0.1);
  padding: 0 20px 24px;
  display: grid;
  gap: 16px;
}

.clock-card,
.status-banner {
  max-width: 760px;
  border: 1px solid rgba(11, 110, 79, 0.16);
  border-radius: 22px;
  background: linear-gradient(180deg, #ffffff 0%, #f4fbf6 100%);
  padding: 24px;
  box-shadow: var(--app-shadow-sm, var(--clock-shadow));
}

.status-banner.error {
  background: linear-gradient(180deg, #fff8f8 0%, #fff1f1 100%);
  color: var(--app-danger, var(--clock-danger));
  border-color: var(--app-danger-border, var(--clock-danger-border));
}

.status-banner.success {
  background: linear-gradient(180deg, #f4fff7 0%, #ebf9f0 100%);
  color: var(--app-primary, var(--clock-primary));
  border-color: var(--app-success-border, var(--clock-success-border));
}

.clock-card h2 {
  margin: 0 0 18px;
  color: var(--app-text, var(--clock-text));
  font-size: 22px;
  letter-spacing: -0.02em;
}

.clock-card p {
  margin: 0 0 8px;
  color: var(--app-text, var(--clock-text));
  line-height: 1.55;
}

.clock-card strong {
  color: var(--app-primary-deep, var(--clock-primary-deep));
}

.actions {
  display: flex;
  gap: 10px;
  margin-top: 22px;
}

.primary-button {
  min-width: 150px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  appearance: none;
  cursor: pointer;
  border: 1px solid #084d39;
  background-color: #0b6e4f;
  background: linear-gradient(135deg, #073b3a 0%, #0b6e4f 46%, #08a045 100%);
  color: #f8fff8;
  padding: 13px 18px;
  border-radius: 14px;
  font-weight: 800;
  font-size: 15px;
  letter-spacing: 0.01em;
  box-shadow: 0 18px 30px rgba(11, 110, 79, 0.22);
  text-shadow: 0 1px 0 rgba(0, 0, 0, 0.14);
  transition: transform 0.18s ease, box-shadow 0.18s ease, filter 0.18s ease;
}

.primary-button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 20px 36px rgba(11, 110, 79, 0.26);
  filter: saturate(1.04);
}

.primary-button:focus-visible {
  outline: 3px solid rgba(33, 211, 117, 0.3);
  outline-offset: 3px;
}

.ghost-button {
  border: 1px solid var(--app-border);
  background: var(--app-surface, var(--clock-surface));
  padding: 11px 16px;
  border-radius: 14px;
  font-weight: 700;
  color: var(--app-text, var(--clock-text));
}

.primary-button:disabled,
.ghost-button:disabled {
  opacity: 1;
  cursor: not-allowed;
}

.primary-button:disabled {
  background: linear-gradient(135deg, #5f7f74 0%, #729f88 100%);
  border-color: #5a8073;
  color: rgba(248, 255, 248, 0.94);
  box-shadow: none;
  text-shadow: none;
}

.status-copy {
  margin-top: 16px;
  color: var(--app-text-soft, var(--clock-text-soft));
}
</style>

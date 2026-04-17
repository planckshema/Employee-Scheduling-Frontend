<template>
  <section class="tab-content">
    <section v-if="errorMessage" class="status-banner error">
      <span>{{ errorMessage }}</span>
    </section>

    <section class="clock-card">
      <h2>Clock In/Clock Out</h2>

      <div v-if="loading">
        <p>Loading time clock...</p>
      </div>

      <div v-else-if="!shift">
        <p>No shift scheduled for today.</p>
      </div>

      <div v-else>
        <p><strong>Position:</strong> {{ shift.position }}</p>
        <p><strong>Date:</strong> {{ shift.date }}</p>
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
            @click="handleClockIn"
          >
            Clock In
          </button>

          <button
            v-if="canClockOut"
            class="ghost-button"
            @click="handleClockOut"
          >
            Clock Out
          </button>
        </div>
      </div>
    </section>
  </section>
</template>

<script>
import EmployeeServices from "@/services/employeeServices";

export default {
  name: "EmployeeTimeClock",
  data() {
    return {
      loading: true,
      errorMessage: "",
      shift: null,
      timeClock: {
        clockInTime: null,
        clockOutTime: null,
      },
    };
  },
  computed: {
    currentUser() {
      return this.$store.getters.getLoginUserInfo || {};
    },
    canClockIn() {
      return this.shift && !this.timeClock.clockInTime;
    },
    canClockOut() {
      return this.shift && this.timeClock.clockInTime && !this.timeClock.clockOutTime;
    },
  },
  created() {
    this.loadTimeClock();
  },
  methods: {
    async loadTimeClock() {
      if (!this.currentUser?.userId) {
        this.loading = false;
        this.errorMessage = "Your session is missing user information. Please sign in again.";
        return;
      }

      this.loading = true;
      this.errorMessage = "";

      try {
        const { data: shift } = await EmployeeServices.getTodayShift(this.currentUser.userId);
        this.shift = shift;

        if (this.shift?.shiftId) {
          const { data: status } = await EmployeeServices.getTimeClockStatus(
            this.currentUser.userId,
            this.shift.shiftId
          );
          this.timeClock = status;
        }
      } catch (error) {
        this.errorMessage =
          error.response?.data?.message || "We could not load the time clock.";
      } finally {
        this.loading = false;
      }
    },
    async handleClockIn() {
      try {
        await EmployeeServices.clockIn(this.currentUser.userId, this.shift.shiftId);
        await this.loadTimeClock();
      } catch (error) {
        this.errorMessage =
          error.response?.data?.message || "Clock in failed.";
      }
    },
    async handleClockOut() {
      try {
        await EmployeeServices.clockOut(this.currentUser.userId, this.shift.shiftId);
        await this.loadTimeClock();
      } catch (error) {
        this.errorMessage =
          error.response?.data?.message || "Clock out failed.";
      }
    },
    formatDateTime(value) {
      if (!value) return "";
      return new Date(value).toLocaleString();
    },
  },
};
</script>

<style scoped>
.tab-content {
  padding: 0 20px 24px;
}

.clock-card,
.status-banner {
  border: 1px solid #dce1ec;
  border-radius: 18px;
  background: #fff;
  padding: 20px;
}

.status-banner.error {
  background: #fff4f5;
  color: #8b1f2d;
  margin-bottom: 16px;
}

.actions {
  display: flex;
  gap: 10px;
  margin-top: 18px;
}

.primary-button {
  border: 1px solid #080c28;
  background: #060828;
  color: #fff;
  padding: 11px 16px;
  border-radius: 12px;
  font-weight: 700;
}

.ghost-button {
  border: 1px solid #d7dceb;
  background: #fff;
  padding: 11px 16px;
  border-radius: 12px;
  font-weight: 700;
}
</style>
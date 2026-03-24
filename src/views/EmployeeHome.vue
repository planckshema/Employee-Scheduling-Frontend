<template>
  <div class="dashboard-container">
    <h1>Employee Dashboard</h1>

    <!-- Summary Cards -->
    <div class="card-row">
      <div class="card">
        <h3>Next Shift</h3>
        <p>Tuesday 2:00 PM - 5:00 PM</p>
      </div>

      <div class="card">
        <h3>Weekly Hours</h3>
        <p>12 / 20 hrs</p>
      </div>

      <div class="card">
        <h3>Pending Requests</h3>
        <p>1 request</p>
      </div>
    </div>

    <!-- Schedule Section -->
    <div class="schedule-section">
      <h2>Your Schedule</h2>

      <!-- THIS IS YOUR SCHEDULE COMPONENT -->
      <EmployerSchedule />
    </div>

    <!-- Quick Actions -->
    <div class="card">
      <h2>Quick Actions</h2>

      <button class="primary-button" @click="goToSchedule">
        View My Schedule
      </button>

      <button class="ghost-button" @click="goToAvailability">
        Update Availability
      </button>

      <button class="danger-button" @click="goToRequests">
        Time Off Requests
      </button>
    </div>
  </div>
</template>

<script>
import EmployerSchedule from "./EmployerSchedule.vue"; // your schedule file :contentReference[oaicite:0]{index=0}

export default {
  components: {
    EmployerSchedule,
  },
  methods: {
    goToSchedule() {
      this.$router.push("/schedule");
    },
    goToAvailability() {
      this.$router.push("/availability");
    },
    goToRequests() {
      this.$router.push("/requests");
    },
  },
};
</script>

<style scoped>
.dashboard-container {
  padding: 20px;
}

.card-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
  margin-bottom: 20px;
}

.card {
  background: white;
  border: 1px solid #dadce0;
  border-radius: 8px;
  padding: 16px;
}

.schedule-section {
  margin: 30px 0;
}

.primary-button {
  background: #1a73e8;
  color: white;
  padding: 10px 16px;
  border: none;
  border-radius: 4px;
  margin-right: 10px;
  cursor: pointer;
}

.ghost-button {
  background: none;
  border: 1px solid #ccc;
  padding: 10px 16px;
  border-radius: 4px;
  margin-right: 10px;
  cursor: pointer;
}

.danger-button {
  background: #d93025;
  color: white;
  padding: 10px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
</style>

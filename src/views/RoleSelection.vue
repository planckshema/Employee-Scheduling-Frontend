<template>
  <div class="role-page">
    <div class="role-card">
      <h1>WorkScheduler</h1>
      <p>Choose how you want to continue today.</p>

      <button class="role-option" :disabled="loadingRole === 'employer'" @click="continueAsEmployer">
        <div class="role-icon">
          <v-icon size="52" color="#5a6475">mdi-account-group-outline</v-icon>
        </div>
        <h2>Employer</h2>
        <span>Manage team schedules and shifts</span>
      </button>

      <button class="role-option" :disabled="loadingRole === 'employee'" @click="continueAsEmployee">
        <div class="role-icon">
          <v-icon size="52" color="#5a6475">mdi-account-circle-outline</v-icon>
        </div>
        <h2>Employee</h2>
        <span>View schedule, set availability, and trade shifts</span>
      </button>

      <p v-if="errorMessage" class="error-copy">{{ errorMessage }}</p>
    </div>
  </div>
</template>

<script>
import EmployeeServices from "@/services/employeeServices";
import EmployerServices from "@/services/employerServices";

export default {
  name: "RoleSelection",
  data() {
    return {
      loadingRole: "",
      errorMessage: "",
    };
  },
  computed: {
    currentUser() {
      return this.$store.getters.getLoginUserInfo || {};
    },
  },
  methods: {
    async continueAsEmployer() {
      await this.resolveNextRoute("employer", EmployerServices.getEmployerProfile, "employerDashboard", "employerCreateProfile");
    },
    async continueAsEmployee() {
      await this.resolveNextRoute("employee", EmployeeServices.getEmployeeProfile, "employeeDashboard", "employeeCreateProfile");
    },
    async resolveNextRoute(role, fetchProfile, dashboardRoute, createRoute) {
      if (!this.currentUser?.userId) {
        this.errorMessage = "Your session is missing user information. Please sign in again.";
        return;
      }

      this.loadingRole = role;
      this.errorMessage = "";

      try {
        await fetchProfile(this.currentUser.userId);
        this.$router.push({ name: dashboardRoute });
      } catch (error) {
        if (error.response?.status === 404) {
          this.$router.push({ name: createRoute });
          return;
        }

        this.errorMessage =
          error.response?.data?.message || "We could not continue with that profile right now.";
      } finally {
        this.loadingRole = "";
      }
    },
  },
};
</script>

<style scoped>
.role-page {
  min-height: 100vh;
  background: #dfe5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.role-card {
  width: 100%;
  max-width: 560px;
  border-radius: 14px;
  background: #f8f8fb;
  padding: 34px;
  box-shadow: 0 10px 24px rgba(23, 27, 37, 0.05);
}

h1 {
  text-align: center;
  font-size: 52px;
  line-height: 1.05;
  margin-bottom: 10px;
  font-weight: 700;
  color: #121826;
}

p {
  text-align: center;
  color: #667289;
  margin-bottom: 24px;
  font-size: 20px;
}

.role-option {
  width: 100%;
  border: 1px solid #d9deea;
  border-radius: 12px;
  background: #fff;
  margin-bottom: 14px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: border-color 0.18s ease, transform 0.18s ease;
}

.role-option:hover {
  border-color: #b9c3d8;
  transform: translateY(-1px);
}

.role-option:disabled {
  opacity: 0.7;
  cursor: progress;
  transform: none;
}

.role-option h2 {
  margin-top: 6px;
  margin-bottom: 4px;
  font-size: 34px;
  color: #121826;
}

.role-option span {
  color: #5c6880;
  font-size: 20px;
}

.error-copy {
  color: #b4233c;
  margin-bottom: 0;
  font-size: 15px;
}

@media (max-width: 980px) {
  h1 {
    font-size: 34px;
  }

  p,
  .role-option span {
    font-size: 16px;
  }

  .role-option h2 {
    font-size: 28px;
  }
}
</style>

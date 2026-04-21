<template>
  <div class="role-page">
    <div class="role-card">
      <h1>WorkScheduler</h1>
      <p>Choose how you want to continue today.</p>

      <button class="role-option" :disabled="loadingRole === 'employer'" @click="continueAsEmployer">
        <div class="role-icon">
          <v-icon size="52" color="primary">mdi-account-group-outline</v-icon>
        </div>
        <h2>Employer</h2>
        <span>Manage team schedules and shifts</span>
      </button>

      <button class="role-option" :disabled="loadingRole === 'employee'" @click="continueAsEmployee">
        <div class="role-icon">
          <v-icon size="52" color="primary">mdi-account-circle-outline</v-icon>
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
  background:
    radial-gradient(circle at top left, rgba(123, 201, 111, 0.16), transparent 24%),
    linear-gradient(180deg, #f8fcf6 0%, var(--app-bg) 54%, #e1eee0 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 28px;
}

.role-card {
  width: 100%;
  max-width: 560px;
  border: 1px solid var(--app-border);
  border-radius: 28px;
  background: rgba(255, 254, 251, 0.95);
  padding: 38px;
  box-shadow: var(--app-shadow-md);
}

h1 {
  text-align: center;
  font-size: 52px;
  line-height: 1.05;
  margin-bottom: 10px;
  font-weight: 800;
  color: var(--app-text);
  letter-spacing: -0.04em;
}

p {
  text-align: center;
  color: var(--app-text-soft);
  margin-bottom: 24px;
  font-size: 19px;
  line-height: 1.6;
}

.role-option {
  width: 100%;
  border: 1px solid var(--app-border);
  border-radius: 22px;
  background: linear-gradient(180deg, var(--app-surface) 0%, var(--app-surface-soft) 100%);
  margin-bottom: 16px;
  padding: 26px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 14px 30px rgba(36, 74, 46, 0.05);
}

.role-option:hover {
  border-color: var(--app-border-strong);
  transform: translateY(-2px);
  box-shadow: 0 20px 36px rgba(36, 74, 46, 0.1);
}

.role-option:disabled {
  opacity: 0.7;
  cursor: progress;
  transform: none;
}

.role-option h2 {
  margin: 10px 0 4px;
  margin-bottom: 4px;
  font-size: 34px;
  color: var(--app-text);
  letter-spacing: -0.03em;
}

.role-option span {
  color: var(--app-text-soft);
  font-size: 18px;
  line-height: 1.5;
}

.error-copy {
  color: var(--app-danger);
  margin-bottom: 0;
  font-size: 15px;
}

.role-icon {
  width: 84px;
  height: 84px;
  border-radius: 24px;
  display: grid;
  place-items: center;
  background: linear-gradient(180deg, rgba(123, 201, 111, 0.16), rgba(79, 155, 88, 0.08));
  border: 1px solid rgba(79, 155, 88, 0.18);
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

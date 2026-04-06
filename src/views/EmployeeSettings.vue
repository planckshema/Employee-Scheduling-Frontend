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
          <p class="eyebrow">Account</p>
          <h2>Settings</h2>
          <p class="muted">Update your employee profile information and account session.</p>
        </div>
      </div>

      <div v-if="loading" class="loading-card">
        <v-progress-circular indeterminate color="#2647c8" size="34" width="3" />
        <p>Loading settings...</p>
      </div>

      <div v-else class="settings-grid">
        <article class="profile-card">
          <label>First Name</label>
          <input v-model="form.firstName" type="text" />

          <label>Last Name</label>
          <input v-model="form.lastName" type="text" />

          <label>Email</label>
          <input v-model="form.email" type="email" readonly />

          <label>Phone</label>
          <input v-model="form.phoneNum" type="text" placeholder="555-0101" />

          <label>School</label>
          <input v-model="form.school" type="text" placeholder="Oakland University" />

          <label>Year</label>
          <input v-model="form.schoolYear" type="text" placeholder="Senior" />

          <label>Major</label>
          <input v-model="form.major" type="text" placeholder="Computer Science" />

          <label>Student ID</label>
          <input v-model="form.studentId" type="text" placeholder="Optional" />

          <div class="actions-row">
            <button class="primary-button" :disabled="saving || !hasChanges" @click="saveProfile">
              <v-icon size="18">mdi-content-save-outline</v-icon>
              {{ saving ? "Saving..." : "Save Changes" }}
            </button>
          </div>
        </article>

        <article class="session-card">
          <h3>Session</h3>
          <p class="muted">Signed in as {{ form.email || currentUser.email }}</p>

          <button class="ghost-button" @click="logout">
            <v-icon size="18">mdi-logout</v-icon>
            Log Out
          </button>
        </article>
      </div>
    </section>
  </section>
</template>

<script>
import AuthServices from "@/services/authServices";
import EmployeeServices from "@/services/employeeServices";
import Utils from "@/config/utils";

const emptyForm = () => ({
  employeeId: null,
  firstName: "",
  lastName: "",
  email: "",
  phoneNum: "",
  school: "",
  schoolYear: "",
  major: "",
  studentId: "",
});

export default {
  name: "EmployeeSettings",
  data() {
    return {
      loading: true,
      saving: false,
      errorMessage: "",
      successMessage: "",
      form: emptyForm(),
      savedSnapshot: JSON.stringify(emptyForm()),
    };
  },
  computed: {
    currentUser() {
      return this.$store.getters.getLoginUserInfo || {};
    },
    hasChanges() {
      return JSON.stringify(this.form) !== this.savedSnapshot;
    },
  },
  created() {
    this.loadProfile();
  },
  methods: {
    async loadProfile() {
      if (!this.currentUser?.userId) {
        this.loading = false;
        this.errorMessage = "Your session is missing user information. Please sign in again.";
        return;
      }

      this.loading = true;
      this.errorMessage = "";

      try {
        const { data } = await EmployeeServices.getEmployeeProfile(this.currentUser.userId);
        this.form = {
          employeeId: data?.EmployeeID || null,
          firstName: data?.firstName || "",
          lastName: data?.lastName || "",
          email: data?.email || this.currentUser.email || "",
          phoneNum: data?.phoneNum || "",
          school: data?.school || "",
          schoolYear: data?.schoolYear || "",
          major: data?.major || "",
          studentId: data?.studentId || "",
        };
        this.savedSnapshot = JSON.stringify(this.form);
      } catch (error) {
        this.errorMessage =
          error.response?.data?.message || "We could not load employee settings.";
      } finally {
        this.loading = false;
      }
    },
    async saveProfile() {
      if (!this.form.employeeId || !this.hasChanges) {
        return;
      }

      this.saving = true;
      this.errorMessage = "";
      this.successMessage = "";

      try {
        const { data } = await EmployeeServices.updateEmployee(this.form.employeeId, {
          firstName: this.form.firstName.trim(),
          lastName: this.form.lastName.trim(),
          email: this.form.email,
          phoneNum: this.form.phoneNum.trim(),
          school: this.form.school.trim(),
          schoolYear: this.form.schoolYear.trim(),
          major: this.form.major.trim(),
          studentId: this.form.studentId.trim(),
        });

        this.form = {
          employeeId: data.EmployeeID,
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          email: data.email || this.form.email,
          phoneNum: data.phoneNum || "",
          school: data.school || "",
          schoolYear: data.schoolYear || "",
          major: data.major || "",
          studentId: data.studentId || "",
        };
        this.savedSnapshot = JSON.stringify(this.form);
        this.successMessage = "Profile updated successfully.";
      } catch (error) {
        this.errorMessage =
          error.response?.data?.message || "We could not save your profile right now.";
      } finally {
        this.saving = false;
      }
    },
    async logout() {
      try {
        await AuthServices.logoutUser(this.currentUser);
      } catch (error) {
        // Even if the server logout fails, clear the local session.
      } finally {
        Utils.removeItem("user");
        this.$store.commit("setLoginUser", null);
        this.$router.push({ name: "login" });
      }
    },
  },
};
</script>

<style scoped>
.tab-content {
  padding: 0 20px 24px;
}

.panel,
.status-banner {
  border: 1px solid #dce1ec;
  border-radius: 18px;
  background: #fff;
}

.panel {
  padding: 20px;
}

.status-banner {
  padding: 14px 16px;
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 16px;
}

.status-banner.error {
  background: #fff4f5;
  color: #8b1f2d;
}

.status-banner.success {
  background: #effcf4;
  color: #195f40;
}

.panel-header {
  margin-bottom: 18px;
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

.muted {
  color: #617089;
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

.settings-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(280px, 0.8fr);
  gap: 16px;
}

.profile-card,
.session-card {
  border: 1px solid #e1e6f0;
  border-radius: 16px;
  background: #f9fbff;
  padding: 18px;
}

label {
  display: block;
  margin-bottom: 6px;
  font-weight: 700;
}

input {
  width: 100%;
  min-height: 46px;
  border-radius: 12px;
  border: 1px solid #d8deea;
  background: #fff;
  padding: 0 12px;
  margin-bottom: 14px;
}

.actions-row {
  display: flex;
  justify-content: flex-end;
}

.primary-button,
.ghost-button {
  border-radius: 12px;
  padding: 11px 16px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.primary-button {
  border: 1px solid #080c28;
  background: #060828;
  color: #fff;
}

.ghost-button {
  border: 1px solid #d7dceb;
  background: #fff;
}

.primary-button:disabled {
  opacity: 0.6;
}

@media (max-width: 980px) {
  .tab-content {
    padding: 0 14px 16px;
  }

  .settings-grid {
    grid-template-columns: 1fr;
  }
}
</style>

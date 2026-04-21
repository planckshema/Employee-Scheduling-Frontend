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
          <p class="eyebrow">Business Profile</p>
          <h2>Settings</h2>
          <p class="muted">Manage the business details your scheduling workspace is built around.</p>
        </div>
      </div>

      <div v-if="loading" class="loading-card">
        <v-progress-circular indeterminate color="primary" size="34" width="3" />
        <p>Loading settings...</p>
      </div>

      <div v-else class="settings-grid">
        <article class="profile-card">
          <label>First Name</label>
          <input v-model="form.firstName" type="text" />

          <label>Last Name</label>
          <input v-model="form.lastName" type="text" />

          <label>Business Name</label>
          <input v-model="form.businessName" type="text" />

          <label>Niche</label>
          <input v-model="form.niche" type="text" />

          <label>Phone</label>
          <input v-model="form.phoneNum" type="text" />

          <label>Location</label>
          <input v-model="form.location" type="text" />

          <label>Working Times</label>
          <input v-model="form.operatingHours" type="text" />

          <label>Description</label>
          <textarea v-model="form.description" rows="4" />

          <div class="actions-row">
            <button class="primary-button" :disabled="saving || !hasChanges" @click="saveProfile">
              <v-icon size="18">mdi-content-save-outline</v-icon>
              {{ saving ? "Saving..." : "Save Changes" }}
            </button>
          </div>
        </article>
      </div>
    </section>
  </section>
</template>

<script>
import EmployerServices from "@/services/employerServices";

const emptyForm = () => ({
  firstName: "",
  lastName: "",
  businessName: "",
  niche: "",
  phoneNum: "",
  location: "",
  operatingHours: "",
  description: "",
});

export default {
  name: "EmployerSettings",
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
        const { data } = await EmployerServices.getEmployerProfile(this.currentUser.userId);
        this.form = {
          firstName: data?.firstName || "",
          lastName: data?.lastName || "",
          businessName: data?.businessName || "",
          niche: data?.niche || "",
          phoneNum: data?.phoneNum || "",
          location: data?.location || "",
          operatingHours: data?.operatingHours || "",
          description: data?.description || "",
        };
        this.savedSnapshot = JSON.stringify(this.form);
      } catch (error) {
        this.errorMessage =
          error.response?.data?.message || "We could not load employer settings.";
      } finally {
        this.loading = false;
      }
    },
    async saveProfile() {
      if (!this.hasChanges) {
        return;
      }

      this.saving = true;
      this.errorMessage = "";
      this.successMessage = "";

      try {
        const { data } = await EmployerServices.updateEmployerProfile(this.currentUser.userId, this.form);
        this.form = {
          firstName: data?.firstName || "",
          lastName: data?.lastName || "",
          businessName: data?.businessName || "",
          niche: data?.niche || "",
          phoneNum: data?.phoneNum || "",
          location: data?.location || "",
          operatingHours: data?.operatingHours || "",
          description: data?.description || "",
        };
        this.savedSnapshot = JSON.stringify(this.form);
        this.successMessage = "Employer profile updated successfully.";
        window.dispatchEvent(
          new CustomEvent("employer-profile-updated", {
            detail: data || null,
          }),
        );
      } catch (error) {
        this.errorMessage =
          error.response?.data?.message || "We could not save employer settings.";
      } finally {
        this.saving = false;
      }
    },
  },
};
</script>

<style scoped>
.tab-content {
  padding: 0 20px 28px;
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
  margin-bottom: 16px;
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
  margin-bottom: 18px;
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
p {
  margin: 0;
}

.muted {
  color: var(--app-text-soft);
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

.settings-grid {
  display: grid;
  grid-template-columns: 1fr;
}

.profile-card {
  border: 1px solid var(--app-border);
  border-radius: 20px;
  background: var(--app-surface);
  padding: 20px;
}

label {
  display: block;
  margin-bottom: 6px;
  font-weight: 700;
  color: var(--app-text);
}

input,
textarea {
  width: 100%;
  min-height: 48px;
  border-radius: 14px;
  border: 1px solid var(--app-border);
  background: var(--app-surface-soft);
  padding: 0 12px;
  margin-bottom: 14px;
  font: inherit;
  color: var(--app-text);
}

textarea {
  min-height: 120px;
  padding: 12px;
  resize: vertical;
}

input:focus,
textarea:focus {
  border-color: var(--app-primary);
  background: var(--app-surface);
  box-shadow: 0 0 0 4px rgba(79, 155, 88, 0.12);
  outline: none;
}

.actions-row {
  display: flex;
  justify-content: flex-end;
}

.primary-button {
  border-radius: 14px;
  padding: 12px 18px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 1px solid var(--app-primary-deep);
  background: linear-gradient(135deg, var(--app-primary) 0%, var(--app-secondary) 100%);
  color: #fff;
  box-shadow: 0 16px 28px rgba(47, 107, 63, 0.18);
}

.primary-button:disabled {
  opacity: 0.6;
}

@media (max-width: 980px) {
  .tab-content {
    padding: 0 14px 16px;
  }
}
</style>

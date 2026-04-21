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
        <v-progress-circular indeterminate color="#2647c8" size="34" width="3" />
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
  grid-template-columns: 1fr;
}

.profile-card {
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

input,
textarea {
  width: 100%;
  min-height: 46px;
  border-radius: 12px;
  border: 1px solid #d8deea;
  background: #fff;
  padding: 0 12px;
  margin-bottom: 14px;
  font: inherit;
}

textarea {
  min-height: 110px;
  padding: 12px;
}

.actions-row {
  display: flex;
  justify-content: flex-end;
}

.primary-button {
  border-radius: 12px;
  padding: 11px 16px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 1px solid #080c28;
  background: #060828;
  color: #fff;
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

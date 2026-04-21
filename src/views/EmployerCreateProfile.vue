<template>
  <div class="onboarding-page">
    <section class="onboarding-card">
      <div class="heading">
        <p class="eyebrow">Employer Onboarding</p>
        <h1>Create Employer Profile</h1>
        <p>Tell us about your business so we can tailor your scheduling workspace.</p>
      </div>

      <p v-if="errorMessage" class="message error">{{ errorMessage }}</p>

      <div class="form-grid">
        <label>
          First Name
          <input v-model="form.firstName" type="text" />
        </label>
        <label>
          Last Name
          <input v-model="form.lastName" type="text" />
        </label>
        <label class="full">
          Business Name
          <input v-model="form.businessName" type="text" placeholder="Campus Coffee House" />
        </label>
        <label>
          Niche
          <input v-model="form.niche" type="text" placeholder="Coffee shop, library, front desk" />
        </label>
        <label>
          Phone
          <input v-model="form.phoneNum" type="text" placeholder="555-0100" />
        </label>
        <label class="full">
          Location
          <input v-model="form.location" type="text" placeholder="Student Union, 1st Floor" />
        </label>
        <label class="full">
          Working Times
          <input v-model="form.operatingHours" type="text" placeholder="Mon-Fri 7:00 AM - 9:00 PM" />
        </label>
        <label class="full">
          Business Description
          <textarea v-model="form.description" rows="4" placeholder="What kind of work do your student employees do?" />
        </label>
      </div>

      <div class="actions">
        <button class="ghost-button" @click="$router.push({ name: 'roleSelection' })">Back</button>
        <button class="primary-button" :disabled="saving" @click="saveProfile">
          {{ saving ? "Creating..." : "Create Profile" }}
        </button>
      </div>
    </section>
  </div>
</template>

<script>
import EmployerServices from "@/services/employerServices";

export default {
  name: "EmployerCreateProfile",
  data() {
    return {
      saving: false,
      errorMessage: "",
      form: {
        firstName: "",
        lastName: "",
        businessName: "",
        niche: "",
        phoneNum: "",
        location: "",
        operatingHours: "",
        description: "",
      },
    };
  },
  computed: {
    currentUser() {
      return this.$store.getters.getLoginUserInfo || {};
    },
  },
  created() {
    this.form.firstName = this.currentUser.fName || "";
    this.form.lastName = this.currentUser.lName || "";
  },
  methods: {
    async saveProfile() {
      if (!this.currentUser?.userId) {
        this.errorMessage = "Your session is missing user information. Please sign in again.";
        return;
      }

      this.saving = true;
      this.errorMessage = "";

      try {
        await EmployerServices.createEmployerProfile(this.currentUser.userId, {
          ...this.form,
          email: this.currentUser.email,
        });
        this.$router.push({ name: "employerDashboard" });
      } catch (error) {
        this.errorMessage =
          error.response?.data?.message || "We could not create the employer profile.";
      } finally {
        this.saving = false;
      }
    },
  },
};
</script>

<style scoped>
.onboarding-page {
  min-height: 100vh;
  padding: 28px;
  background:
    radial-gradient(circle at top left, rgba(123, 201, 111, 0.16), transparent 24%),
    linear-gradient(135deg, #f8fcf7 0%, var(--app-bg) 58%, #e2efe2 100%);
  display: flex;
  justify-content: center;
  align-items: center;
}

.onboarding-card {
  width: 100%;
  max-width: 840px;
  background: rgba(255, 254, 251, 0.96);
  border: 1px solid var(--app-border);
  border-radius: 28px;
  padding: 34px;
  box-shadow: var(--app-shadow-md);
}

.heading {
  margin-bottom: 20px;
}

.eyebrow {
  margin: 0 0 8px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 12px;
  font-weight: 800;
  color: var(--app-secondary);
}

h1 {
  margin: 0 0 10px;
  font-size: 42px;
  color: var(--app-text);
  letter-spacing: -0.03em;
}

p {
  margin: 0;
  color: var(--app-text-soft);
  line-height: 1.6;
}

.message.error {
  margin-bottom: 16px;
  color: var(--app-danger);
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

label {
  display: grid;
  gap: 8px;
  font-weight: 700;
  color: var(--app-text);
}

label.full {
  grid-column: 1 / -1;
}

input,
textarea {
  width: 100%;
  border: 1px solid var(--app-border);
  border-radius: 16px;
  background: var(--app-surface-soft);
  padding: 12px 14px;
  font: inherit;
}

input {
  min-height: 50px;
}

textarea {
  min-height: 120px;
  resize: vertical;
}

input:focus,
textarea:focus {
  border-color: var(--app-primary);
  background: var(--app-surface);
  box-shadow: 0 0 0 4px rgba(79, 155, 88, 0.12);
  outline: none;
}

.actions {
  margin-top: 22px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.ghost-button,
.primary-button {
  border-radius: 14px;
  padding: 12px 18px;
  font-weight: 700;
}

.ghost-button {
  border: 1px solid var(--app-border);
  background: var(--app-surface);
  color: var(--app-text);
}

.primary-button {
  border: 1px solid var(--app-primary-deep);
  background: linear-gradient(135deg, var(--app-primary) 0%, var(--app-secondary) 100%);
  color: #fff;
  box-shadow: 0 18px 28px rgba(47, 107, 63, 0.18);
}

@media (max-width: 800px) {
  .onboarding-card {
    padding: 22px;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  label.full {
    grid-column: auto;
  }
}
</style>

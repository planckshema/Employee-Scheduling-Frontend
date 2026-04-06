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
  padding: 24px;
  background: linear-gradient(135deg, #eef3fb 0%, #dde7f6 100%);
  display: flex;
  justify-content: center;
  align-items: center;
}

.onboarding-card {
  width: 100%;
  max-width: 840px;
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid #dce1ec;
  border-radius: 24px;
  padding: 32px;
  box-shadow: 0 20px 45px rgba(28, 39, 64, 0.08);
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
  color: #3957ba;
}

h1 {
  margin: 0 0 10px;
  font-size: 42px;
}

p {
  margin: 0;
  color: #627088;
}

.message.error {
  margin-bottom: 16px;
  color: #b4233c;
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
  color: #182234;
}

label.full {
  grid-column: 1 / -1;
}

input,
textarea {
  width: 100%;
  border: 1px solid #d7dceb;
  border-radius: 14px;
  background: #f9fbff;
  padding: 12px 14px;
  font: inherit;
}

.actions {
  margin-top: 22px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.ghost-button,
.primary-button {
  border-radius: 12px;
  padding: 11px 16px;
  font-weight: 700;
}

.ghost-button {
  border: 1px solid #d7dceb;
  background: #fff;
}

.primary-button {
  border: 1px solid #080c28;
  background: #060828;
  color: #fff;
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

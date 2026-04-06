<template>
  <div class="onboarding-page">
    <section class="onboarding-card">
      <div class="heading">
        <p class="eyebrow">Employee Onboarding</p>
        <h1>Create Employee Profile</h1>
        <p>Complete your student profile before entering the employee workspace.</p>
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
          School
          <input v-model="form.school" type="text" placeholder="Oakland University" />
        </label>
        <label>
          Year
          <input v-model="form.schoolYear" type="text" placeholder="Freshman, Sophomore, Junior, Senior" />
        </label>
        <label>
          Major
          <input v-model="form.major" type="text" placeholder="Computer Science" />
        </label>
        <label>
          Student ID
          <input v-model="form.studentId" type="text" placeholder="Optional" />
        </label>
        <label>
          Phone
          <input v-model="form.phoneNum" type="text" placeholder="555-0101" />
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
import EmployeeServices from "@/services/employeeServices";

export default {
  name: "EmployeeCreateProfile",
  data() {
    return {
      saving: false,
      errorMessage: "",
      form: {
        firstName: "",
        lastName: "",
        school: "",
        schoolYear: "",
        major: "",
        studentId: "",
        phoneNum: "",
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
        await EmployeeServices.createEmployeeProfile(this.currentUser.userId, {
          ...this.form,
          email: this.currentUser.email,
        });
        this.$router.push({ name: "employeeDashboard" });
      } catch (error) {
        this.errorMessage =
          error.response?.data?.message || "We could not create the employee profile.";
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
  max-width: 760px;
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

input {
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

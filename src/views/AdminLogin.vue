<template>
  <div class="login-page">
    <div class="login-shell">
      <section class="hero-panel">
        <p class="eyebrow">Scheduling System</p>
        <h1>Admin Portal</h1>
        <p class="hero-copy">
          Restricted access. Sign in with your admin credentials to manage
          users, schedules, and system settings.
        </p>
      </section>

      <section class="login-card">
        <h2>Admin sign-in</h2>
        <p class="login-copy">
          Enter your credentials to access the admin dashboard.
        </p>

        <input
          v-model="username"
          class="input-field"
          type="text"
          placeholder="Username"
        />
        <input
          v-model="password"
          class="input-field"
          type="password"
          placeholder="Password"
        />

        <v-alert v-if="errorMessage" class="status-alert" type="error" dense>
          {{ errorMessage }}
        </v-alert>

        <button class="login-btn" @click="handleLogin">Sign In</button>

        <button class="back-btn" @click="$router.push({ name: 'login' })">
          Back to Login
        </button>
      </section>
    </div>
  </div>
</template>

<script>
import AdminServices from "@/services/adminServices";

export default {
  name: "AdminLogin",
  data() {
    return {
      username: "",
      password: "",
      errorMessage: "",
    };
  },
  methods: {
    async handleLogin() {
      if (!this.username || !this.password) {
        this.errorMessage = "Please enter both username and password.";
        return;
      }

      try {
        const { data } = await AdminServices.loginAdmin({
          username: this.username,
          password: this.password,
        });

        this.$store.commit("setLoginUser", data);
        this.$router.push({ name: "adminDashboard" });
      } catch (error) {
        this.errorMessage =
          error.response?.data?.message || "Invalid admin credentials.";
      }
    },
  },
};
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  padding: 24px;
  background: radial-gradient(
      circle at top left,
      rgba(87, 128, 255, 0.18),
      transparent 32%
    ),
    radial-gradient(
      circle at bottom right,
      rgba(79, 182, 139, 0.18),
      transparent 28%
    ),
    linear-gradient(135deg, #eff3fb 0%, #dfe7f2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-shell {
  width: 100%;
  max-width: 1040px;
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: 28px;
}

.hero-panel,
.login-card {
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.88);
  box-shadow: 0 18px 40px rgba(28, 39, 64, 0.08);
  backdrop-filter: blur(10px);
}

.hero-panel {
  padding: 48px;
}

.eyebrow {
  margin-bottom: 16px;
  color: #3359c9;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.hero-panel h1 {
  margin: 0;
  max-width: 520px;
  color: #152033;
  font-size: 56px;
  line-height: 1.02;
}

.hero-copy {
  margin-top: 22px;
  max-width: 520px;
  color: #5b6880;
  font-size: 20px;
  line-height: 1.6;
}

.login-card {
  padding: 40px 36px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.login-card h2 {
  margin: 0 0 10px;
  color: #152033;
  font-size: 34px;
}

.login-copy {
  margin-bottom: 24px;
  color: #5b6880;
  font-size: 17px;
  line-height: 1.5;
}

.input-field {
  width: 100%;
  padding: 12px 16px;
  margin-bottom: 14px;
  border: 1px solid #d0d8e8;
  border-radius: 999px;
  font-size: 15px;
  color: #152033;
  background: #f7f9fc;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.2s;
}

.input-field:focus {
  border-color: #3359c9;
  background: #fff;
}

.status-alert {
  margin-top: 4px;
  margin-bottom: 8px;
}

.login-btn {
  width: 100%;
  padding: 12px;
  margin-top: 4px;
  border: none;
  border-radius: 999px;
  background: #3359c9;
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.login-btn:hover {
  background: #2648b0;
}

.back-btn {
  margin-top: 12px;
  width: 100%;
  padding: 8px;
  border: none;
  border-radius: 999px;
  background: transparent;
  color: #6a768d;
  font-size: 13px;
  cursor: pointer;
  transition: color 0.2s;
}

.back-btn:hover {
  color: #3359c9;
}

@media (max-width: 960px) {
  .login-shell {
    grid-template-columns: 1fr;
  }

  .hero-panel,
  .login-card {
    padding: 32px 24px;
  }

  .hero-panel h1 {
    font-size: 40px;
  }

  .hero-copy {
    font-size: 17px;
  }
}
</style>
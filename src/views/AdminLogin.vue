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
  padding: 28px;
  background:
    radial-gradient(circle at top left, rgba(123, 201, 111, 0.16), transparent 30%),
    radial-gradient(circle at bottom right, rgba(79, 155, 88, 0.14), transparent 30%),
    linear-gradient(135deg, #f7fbf6 0%, var(--app-bg) 50%, #e1eee1 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-shell {
  width: 100%;
  max-width: 1040px;
  display: grid;
  grid-template-columns: 1.08fr 0.92fr;
  gap: 24px;
}

.hero-panel,
.login-card {
  border: 1px solid var(--app-border);
  border-radius: 28px;
  box-shadow: var(--app-shadow-md);
}

.hero-panel {
  padding: 50px 46px;
  background:
    linear-gradient(145deg, rgba(27, 61, 37, 0.97), rgba(41, 89, 54, 0.94)),
    linear-gradient(180deg, rgba(255, 255, 255, 0.08), transparent);
  color: #f7fff5;
}

.eyebrow {
  margin: 0 0 16px;
  color: rgba(236, 248, 238, 0.82);
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.hero-panel h1 {
  margin: 0;
  max-width: 520px;
  color: #f7fff5;
  font-size: 56px;
  line-height: 1.02;
  letter-spacing: -0.03em;
}

.hero-copy {
  margin-top: 22px;
  max-width: 520px;
  color: rgba(236, 248, 238, 0.8);
  font-size: 19px;
  line-height: 1.7;
}

.login-card {
  padding: 40px 36px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  background: rgba(255, 254, 251, 0.94);
  backdrop-filter: blur(12px);
}

.login-card h2 {
  margin: 0 0 10px;
  color: var(--app-text);
  font-size: 34px;
  letter-spacing: -0.02em;
}

.login-copy {
  margin-bottom: 24px;
  color: var(--app-text-soft);
  font-size: 16px;
  line-height: 1.6;
}

.input-field {
  width: 100%;
  min-height: 50px;
  padding: 12px 16px;
  margin-bottom: 14px;
  border: 1px solid var(--app-border);
  border-radius: 999px;
  font-size: 15px;
  color: var(--app-text);
  background: var(--app-surface-soft);
  outline: none;
  box-sizing: border-box;
}

.input-field:focus {
  border-color: var(--app-primary);
  background: var(--app-surface);
  box-shadow: 0 0 0 4px rgba(79, 155, 88, 0.12);
}

.status-alert {
  margin-top: 4px;
  margin-bottom: 8px;
}

.login-btn {
  width: 100%;
  padding: 13px 18px;
  margin-top: 4px;
  border: 1px solid var(--app-primary-deep);
  border-radius: 999px;
  background: linear-gradient(135deg, var(--app-primary) 0%, var(--app-secondary) 100%);
  color: #fff;
  font-size: 15px;
  font-weight: 700;
  box-shadow: 0 18px 30px rgba(47, 107, 63, 0.2);
}

.login-btn:hover {
  transform: translateY(-1px);
  filter: brightness(0.98);
}

.back-btn {
  margin-top: 12px;
  width: 100%;
  padding: 10px 14px;
  border: 1px solid var(--app-border);
  border-radius: 999px;
  background: var(--app-surface-soft);
  color: var(--app-text-soft);
  font-size: 13px;
  font-weight: 700;
}

.back-btn:hover {
  color: var(--app-primary);
  transform: translateY(-1px);
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

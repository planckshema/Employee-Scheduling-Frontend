<template>
  <div class="login-page">
    <div class="login-shell">
      <section class="hero-panel">
        <p class="eyebrow">Employee Scheduling System</p>
        <h1>Sign in with Google to continue.</h1>
        <p class="hero-copy">
          Use your Google account to access scheduling tools, manage shifts, and
          open the right dashboard for your role.
        </p>
      </section>

      <section class="login-card">
        <h2>Welcome back</h2>
        <p class="login-copy">
          We use Google Identity Services for a secure sign-in flow.
        </p>

        <div ref="googleButton" class="google-button"></div>

        <v-alert v-if="isSigningIn" class="status-alert" type="info" dense text>
          Finishing your sign-in...
        </v-alert>

        <v-alert v-if="errorMessage" class="status-alert" type="error" dense>
          {{ errorMessage }}
        </v-alert>

        <p class="helper-text">
          After sign-in, you'll choose whether you're continuing as an employer or employee and complete your profile once.
        </p>
      </section>
    </div>
  </div>
</template>

<script>
import AuthServices from "@/services/authServices";

export default {
  name: "Login",
  data() {
    return {
      errorMessage: "",
      isSigningIn: false,
    };
  },
  mounted() {
    this.initializeGoogleSignIn();
  },
  beforeUnmount() {
    if (
      window.google &&
      window.google.accounts &&
      window.google.accounts.id &&
      typeof window.google.accounts.id.cancel === "function"
    ) {
      window.google.accounts.id.cancel();
    }
  },
  methods: {
    initializeGoogleSignIn() {
      const clientId = (
        import.meta.env.VITE_CLIENT_ID ||
        import.meta.env.VUE_APP_CLIENT_ID ||
        ""
      ).trim();

      if (!clientId) {
        this.errorMessage =
          "Google sign-in is not configured. Add VITE_CLIENT_ID to Scheduling-Frontend/.env and restart the frontend.";
        return;
      }

      if (
        !window.google ||
        !window.google.accounts ||
        !window.google.accounts.id
      ) {
        this.errorMessage =
          "Google Identity Services failed to load. Refresh the page and try again.";
        return;
      }

      this.errorMessage = "";

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: this.handleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      window.google.accounts.id.renderButton(this.$refs.googleButton, {
        type: "standard",
        theme: "outline",
        size: "large",
        text: "signin_with",
        shape: "pill",
        width: 320,
        logo_alignment: "left",
      });
    },
    async handleCredentialResponse(response) {
      if (!response || !response.credential) {
        this.errorMessage =
          "Google sign-in did not return a credential. Please try again.";
        return;
      }

      this.isSigningIn = true;
      this.errorMessage = "";

      try {
        const { data } = await AuthServices.loginUser({
          credential: response.credential,
        });

        this.$store.commit("setLoginUser", data);
        this.$router.push({ name: "roleSelection" });
      } catch (error) {
        this.errorMessage =
          error.response?.data?.message ||
          "We could not sign you in with Google right now.";
      } finally {
        this.isSigningIn = false;
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

.google-button {
  min-height: 44px;
}

.status-alert {
  margin-top: 20px;
}

.helper-text {
  margin-top: 18px;
  color: #6a768d;
  font-size: 14px;
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

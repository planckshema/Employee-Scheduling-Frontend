<template>
  <v-container
    class="fill-height d-flex justify-center align-center bg-lighten-4"
  >
    <!-- Main Card Container -->
    <v-card
      width="100%"
      max-width="450"
      class="pa-8 elevation-4 rounded-lg text-center"
    >
      <!-- Header Section -->
      <v-card-text class="pb-8">
        <h1 class="text-h4 font-weight-bold grey--text text--darken-4">
          Login
        </h1>
      </v-card-text>

      <!-- Social Login Component -->
      <v-divider class="mb-6"></v-divider>
      <SocialLogin />
    </v-card>
  </v-container>
</template>

<script>
import SocialLogin from "@/components/SocialLogin";

export default {
  name: "Login",
  components: {
    SocialLogin,
  },
};
</script>

<style scoped>
.v-container {
  background-color: #eef2ff !important;
}

.transition-swing {
  transition: 0.3s cubic-bezier(0.25, 0.8, 0.5, 1);
}
</style>

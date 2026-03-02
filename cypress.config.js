const { defineConfig } = require("cypress");
require("dotenv").config();

module.exports = defineConfig({
  e2e: {
    baseUrl: "http://localhost:8080",
    env: {
      googleRefreshToken: process.env.VUE_APP_REFRESH_TOKEN,
      googleClientId: process.env.VUE_APP_CLIENT_ID,
      googleClientSecret: process.env.VUE_APP_CLIENT_SECRET,
      clientURL: process.env.VUE_APP_CLIENT_URL,
    },
  },

  component: {
    devServer: {
      framework: "vue-cli",
      bundler: "webpack",
    },
  },
});

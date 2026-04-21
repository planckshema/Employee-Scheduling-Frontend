import { createApp } from "vue";
import App from "./App.vue";
import vuetify from "./plugins/vuetify";
import router from "./router";
import store from "./store/store";
import "material-design-icons-iconfont/dist/material-design-icons.css";
import "vuetify/styles";
import "./assets/theme.css";

createApp(App).use(router).use(store).use(vuetify).mount("#app");

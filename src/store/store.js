import { reactive } from "vue";
import Utils from "@/config/utils";

const state = reactive({
  loginUser: Utils.getStore("user"),
});

const store = {
  state,
  getters: {
    get getLoginUserInfo() {
      return state.loginUser;
    },
  },
  commit(type, user) {
    if (type === "setLoginUser") {
      state.loginUser = user;
      Utils.setStore("user", user);
      return;
    }
    throw new Error(`Unknown mutation: ${type}`);
  },
  install(app) {
    app.config.globalProperties.$store = store;
    app.provide("store", store);
  },
};

export default store;

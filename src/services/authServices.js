import apiClient from "@/services/services.js";

export default {
  loginUser(user) {
    return apiClient.post("login", user);
  },
  authorizeUser(userId, code) {
    return apiClient.post(`authorize/${userId}`, code);
  },
  logoutUser(token) {
    return apiClient.post("logout", token);
  },
};

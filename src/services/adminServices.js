import apiClient from "@/services/services.js";

export default {
  loginAdmin(credentials) {
    return apiClient.post("admin/login", credentials);
  },
};
import apiClient from "../services/services.js";

export default {
  getEmployerProfile(userId) {
    return apiClient.get(`/employers/profile/users/${userId}`);
  },

  createEmployerProfile(userId, data) {
    return apiClient.post(`/employers/profile/users/${userId}`, data);
  },

  updateEmployerProfile(userId, data) {
    return apiClient.put(`/employers/profile/users/${userId}`, data);
  },
};

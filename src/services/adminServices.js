import apiClient from "@/services/services.js";

export default {
  loginAdmin(credentials) {
    return apiClient.post("admin/login", credentials);
  },
  getStats() {
    return apiClient.get("admin/stats");
  },
  getUsers(params = {}) {
    return apiClient.get("admin/users", { params });
  },
  createUser(data) {

    return apiClient.post("admin/users", data);
  },
  deleteEmployee(id) {
    
    return apiClient.delete(`admin/staff/${id}`); 
  },
  updateUser(id, data) {
    return apiClient.put(`admin/users/${id}`, data);
  },
  deleteUser(id) {
    return apiClient.delete(`admin/users/${id}`);
  },
};
import apiClient from "../services/services.js";

export default {
  getAllEmployees() {
    return apiClient.get("/employee");
  },

  getEmployee(id) {
    return apiClient.get(`/employee/${id}`);
  },

  createEmployee(data) {
    return apiClient.post("/employee", data);
  },

  updateEmployee(id, data) {
    return apiClient.put(`/employee/${id}`, data);
  },

  deleteEmployee(id) {
    return apiClient.delete(`/employee/${id}`);
  },

  getEmployeeDashboard(userId) {
    return apiClient.get(`/employee/dashboard/users/${userId}`);
  },

  getTodayShift(userId) {
    return apiClient.get(`/employee/dashboard/users/${userId}/today-shift`);
  },

  getTimeClockStatus(userId, shiftId) {
    return apiClient.get(`/employee/dashboard/users/${userId}/timeclock/${shiftId}`);
  },

  clockIn(userId, shiftId) {
    return apiClient.post(`/employee/dashboard/users/${userId}/timeclock/${shiftId}/clock-in`);
  },

  clockOut(userId, shiftId) {
    return apiClient.post(`/employee/dashboard/users/${userId}/timeclock/${shiftId}/clock-out`);
  },

  updateEmployeeAvailability(userId, weeklyAvailability, unavailableBlocks = []) {
    return apiClient.put(`/employee/dashboard/users/${userId}/availability`, {
      weeklyAvailability,
      unavailableBlocks,
    });
  },

  getEmployeeProfile(userId) {
    return apiClient.get(`/employee/profile/users/${userId}`);
  },

  createEmployeeProfile(userId, data) {
    return apiClient.post(`/employee/profile/users/${userId}`, data);
  },
};

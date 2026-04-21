import apiClient from "../services/services.js";

export default {
  // Get all employees from the database
  getAllEmployees() {
    return apiClient.get("/employee");
  },

  // Get a single employee by ID
  getEmployee(id) {
    return apiClient.get(`/employee/${id}`);
  },

  // Create a new employee
  createEmployee(data) {
    return apiClient.post("/employee", data);
  },

  // Update an existing employee
  updateEmployee(id, data) {
    return apiClient.put(`/employee/${id}`, data);
  },

  // Delete an employee
  deleteEmployee(id) {
    return apiClient.delete(`/employee/${id}`);
  },

  getEmployeeDashboard(userId) {
    return apiClient.get(`/employee/dashboard/users/${userId}`);
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

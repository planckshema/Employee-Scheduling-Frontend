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
};
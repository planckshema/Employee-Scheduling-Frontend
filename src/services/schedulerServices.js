import apiClient from "@/services/services.js";

export default {
  getEmployees() {
    return apiClient.get("employee");
  },
  getEmployeeAvailabilityIndex() {
    return apiClient.get("employee/availability-index");
  },
  createEmployee(payload) {
    return apiClient.post("employee", payload);
  },
  updateEmployee(id, payload) {
    return apiClient.put(`employee/${id}`, payload);
  },
  deleteEmployee(id) {
    return apiClient.delete(`employee/${id}`);
  },

  getTaskLists() {
    return apiClient.get("taskLists");
  },
  createTaskList(payload) {
    return apiClient.post("taskLists", payload);
  },
  updateTaskList(id, payload) {
    return apiClient.put(`taskLists/${id}`, payload);
  },
  deleteTaskList(id) {
    return apiClient.delete(`taskLists/${id}`);
  },

  getShifts() {
    return apiClient.get("shifts");
  },
  createShift(payload) {
    return apiClient.post("shifts", payload);
  },
  updateShift(id, payload) {
    return apiClient.put(`shifts/${id}`, payload);
  },
  deleteShift(id) {
    return apiClient.delete(`shifts/${id}`);
  },
};

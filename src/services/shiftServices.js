import apiClient from "../services/services.js";

export default {
  // Get all shifts from /worker_scheduling/shifts
  getAllShifts() {
    return apiClient.get("/shifts");
  },

  // Get a single shift by shiftID
  getShift(id) {
    return apiClient.get(`/shifts/${id}`);
  },

  // Create a new shift
  createShift(data) {
    return apiClient.post("/shifts", data);
  },

  // Update a shift using shiftID
  updateShift(id, data) {
    return apiClient.put(`/shifts/${id}`, data);
  },

  // Delete a shift using shiftID
  deleteShift(id) {
    return apiClient.delete(`/shifts/${id}`);
  },
};

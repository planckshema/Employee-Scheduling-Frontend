import apiClient from "../services/services.js";

export default {
  // Fetch class schedule from school's API
  getClassSchedule(studentId, term = null) {
    return apiClient.get(`/school/classes/${studentId}`, {
      params: { term }
    });
  },

  // Get current term information
  getCurrentTerm() {
    return apiClient.get('/school/current-term');
  },

  // Validate student ID with school's API
  validateStudentId(studentId) {
    return apiClient.post('/school/validate-student', { studentId });
  },

  // Get merged availability (work + classes)
  getMergedAvailability(userId, term = null) {
    return apiClient.get(`/employee/merged-availability/${userId}`, {
      params: { term }
    });
  }
};
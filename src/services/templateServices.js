import apiClient from "../services/services.js";

export default{
// Get all template headers (just names/IDs)
  getAllTemplates() {
    return apiClient.get("/templates");
  },

  // Get a specific template with all its shifts
  getTemplateDetails(id) {
    return apiClient.get(`/templates/${id}`);
  },

  // Save a new template (name + array of shifts)
  createTemplate(data) {
    return apiClient.post("/templates", data);
  },

  // Delete a template
  deleteTemplate(id) {
    return apiClient.delete(`/templates/${id}`);
  },
};


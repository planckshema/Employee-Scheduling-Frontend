import apiClient from "../services/services.js";

const cleanParams = (params = {}) =>
  Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== null && value !== undefined && value !== ""),
  );

export default {
  getEmployerTimecards(userId, params = {}) {
    return apiClient.get(`/timecards/employers/${userId}`, {
      params: cleanParams(params),
    });
  },
};

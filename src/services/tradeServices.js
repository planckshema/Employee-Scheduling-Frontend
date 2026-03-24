import apiClient from "../services/services.js";

export default {
    getAllTrades() {
        return apiClient.get("/tradeRequestShifts");
    },
    createTrade(data) {
        return apiClient.post("/tradeRequestShifts", data);
    },
    // ADD THIS: To fill the dropdown with shifts not already on the board
    getAvailableShifts() {
        return apiClient.get("/tradeRequestShifts/available");
    },
    claimTrade(id, data) {
        return apiClient.put(`/tradeRequestShifts/${id}/claim`, data);
    },
    approveTrade(id) {
        return apiClient.post(`/tradeRequestShifts/${id}/approve`);
    },
    deleteTrade(id) {
        return apiClient.delete(`/tradeRequestShifts/${id}`);
    },
};
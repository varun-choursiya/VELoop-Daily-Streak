import api from "./api.js";

export const getStreak = () => api.get("/daily-streak");
export const getStreakStatus = () => api.get("/daily-streak/status");
export const claimStreak = () => api.post("/daily-streak/claim", {});
export const getHistory = () => api.get("/daily-streak/history");
export const getWallet = () => api.get("/wallet");
export const getWalletTransactions = () => api.get("/wallet/transactions");

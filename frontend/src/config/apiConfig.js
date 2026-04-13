// src/config/apiConfig.js
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const apiConfig = {
  API_BASE_URL: API_BASE_URL
};

export default apiConfig;